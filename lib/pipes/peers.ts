import {
  ExtendedRTCConfiguration,
  SignalingClient,
  Transporter,
} from "@pojntfx/unisockets";
import { Mutex } from "async-mutex";
import { ClosedError } from "../errors/closed";
import { KnockRejectedError } from "../errors/knock-rejected";
import { ResourceNotImplementedError } from "../errors/resource-not-implemented";
import { getLogger } from "../utils/logger";
import { IPipe, Pipe } from "./pipe";

export const LOCALHOST = "localhost";

export interface IPeersConfig {
  transporter: ExtendedRTCConfiguration;
  signaler: {
    url: string;
    retryAfter: number;
    prefix: string;
  };
  handlers: {
    onNodeAcknowledged: (id: string) => Promise<void>;
    onNodeJoin: (id: string) => Promise<void>;
    onNodeLeave: (id: string) => Promise<void>;
  };
}

export enum EPeersResources {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/Stdout",
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/Stdin",
  WORKLOAD = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/Workload",
  INPUT_DEVICE = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/InputDevice",
  INPUT_DEVICE_DELETION = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/InputDeviceDeletion",
  MANAGEMENT_ENTITY = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/ManagementEntity",
  MANAGEMENT_ENTITY_CONFIRM = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/ManagementEntityConfirm",
  MANAGEMENT_ENTITY_DELETION = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/ManagementEntityDeletion",
  MANAGEMENT_ENTITY_DELETION_CONFIRM = "webnetes.felicitas.pojtinger.com/v1alpha1/raw/ManagementEntityDeletionConfirm",
}

export class Peers
  extends Pipe<IPeersConfig, EPeersResources>
  implements IPipe<IPeersConfig, EPeersResources> {
  private logger = getLogger();

  private transporter?: Transporter;
  private signaler?: SignalingClient;

  private nodes = [] as string[];
  private localNodeId = "";

  private managementEntityLock = new Mutex();

  async open(config: IPeersConfig) {
    this.logger.debug("Opening peers", { config });

    const transporter = new Transporter(
      config.transporter,
      async () => {},
      async () => {},
      async (nodeId: string) => {
        this.logger.debug("Connected to peer", { nodeId });

        this.nodes.push(nodeId);

        if (nodeId.startsWith(config.signaler.prefix))
          await config.handlers.onNodeJoin(nodeId);

        while (this.nodes.includes(nodeId)) {
          this.logger.silly("Received from peer", { nodeId });

          const receivedMsg = await transporter.recv(nodeId);
          const frame = this.transcoder.decode(receivedMsg);

          await this.queue({
            ...frame,
            nodeId,
          });
        }
      },
      async (nodeId) => {
        this.logger.debug("Disconnected from peer", { nodeId });

        if (nodeId.startsWith(config.signaler.prefix))
          await config.handlers.onNodeLeave(nodeId);

        this.nodes = this.nodes.filter((candidate) => candidate !== nodeId);
      }
    );

    const signaler = new SignalingClient(
      config.signaler.url,
      config.signaler.retryAfter,
      config.signaler.prefix,
      async () => {},
      async () => {
        this.logger.debug("Disconnected from signaling server", {
          url: config.signaler.url,
        });
      },
      async (localNodeId: string, rejected: boolean) => {
        this.logger.debug("Connected to signaling server", {
          url: config.signaler.url,
          localNodeId,
        });

        if (rejected) {
          throw new KnockRejectedError();
        } else {
          this.localNodeId = localNodeId;
          this.bus.emit(this.getReadyKey(), true);

          await config.handlers.onNodeAcknowledged(localNodeId);
        }
      },
      async (
        answererId: string,
        handleCandidate: (candidate: string) => Promise<any>
      ) => await transporter.getOffer(answererId, handleCandidate),
      async (
        offererId: string,
        offer: string,
        handleCandidate: (candidate: string) => Promise<any>
      ) => await transporter.handleOffer(offererId, offer, handleCandidate),
      async (_: string, answererId: string, answer: string) =>
        await transporter.handleAnswer(answererId, answer),
      async (offererId: string, _: string, candidate: string) =>
        await transporter.handleCandidate(offererId, candidate),
      async (id: string) => await transporter.shutdown(id),
      async () => {}
    );

    return new Promise<void>(async (res, rej) => {
      try {
        (async () => {
          await this.bus.once(this.getReadyKey());

          this.transporter = transporter;
          this.signaler = signaler;

          res();
        })();

        await signaler.open();
      } catch (e) {
        rej(e);
      }
    });
  }

  async close() {
    this.logger.debug("Closing peers");

    await Promise.all([this.transporter?.close(), this.signaler?.close()]);
  }

  async read() {
    const read = await super.read();

    if (
      read.resourceType === EPeersResources.MANAGEMENT_ENTITY_CONFIRM ||
      read.resourceType === EPeersResources.MANAGEMENT_ENTITY_DELETION_CONFIRM
    ) {
      this.managementEntityLock.release();
    }

    return read;
  }

  async write(
    resourceType: EPeersResources,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to peers", { resourceType, resourceId, nodeId });

    if (
      resourceType === EPeersResources.MANAGEMENT_ENTITY ||
      resourceType === EPeersResources.MANAGEMENT_ENTITY_DELETION
    )
      await this.managementEntityLock.acquire();

    if (Object.values(EPeersResources).includes(resourceType)) {
      if (this.localNodeId === nodeId || nodeId === LOCALHOST) {
        await this.queue({
          resourceType,
          resourceId,
          msg,
          nodeId,
        });
      } else {
        if (this.transporter) {
          const frame = this.transcoder.encode({
            resourceType,
            resourceId,
            msg,
            nodeId,
          });

          await this.transporter.send(nodeId, frame);

          this.logger.silly("Sent to peer", { nodeId });
        } else {
          throw new ClosedError("transporter");
        }
      }
    } else {
      throw new ResourceNotImplementedError(resourceType);
    }
  }

  private getReadyKey() {
    return "ready";
  }
}
