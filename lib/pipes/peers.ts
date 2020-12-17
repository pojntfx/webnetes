import {
  ExtendedRTCConfiguration,
  SignalingClient,
  Transporter,
} from "@pojntfx/unisockets";
import { ClosedError } from "../errors/closed";
import { KnockRejectedError } from "../errors/knock-rejected";
import { ResourceNotImplementedError } from "../errors/resource-not-implemented";
import { getLogger } from "../utils/logger";
import { IPipe, Pipe } from "./pipe";

export interface IPeersConfig {
  transporter: ExtendedRTCConfiguration;
  signaler: {
    url: string;
    retryAfter: number;
    prefix: string;
  };
}

export enum EPeersResources {
  STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/raw/Stdout",
  STDIN = "webnetes.felix.pojtinger.com/v1alpha1/raw/Stdin",
  WORKLOAD = "webnetes.felix.pojtinger.com/v1alpha1/raw/Workload",
  INPUT_DEVICE = "webnetes.felix.pojtinger.com/v1alpha1/raw/InputDevice",
  MANAGEMENT_ENTITY = "webnetes.felix.pojtinger.com/v1alpha1/raw/ManagementEntity",
}

export class Peers
  extends Pipe<IPeersConfig, EPeersResources>
  implements IPipe<IPeersConfig, EPeersResources> {
  private logger = getLogger();

  private transporter?: Transporter;
  private signaler?: SignalingClient;

  private nodes = [] as string[];
  private localNodeId = "";

  async open(config: IPeersConfig) {
    this.logger.debug("Opening peers", { config });

    const transporter = new Transporter(
      config.transporter,
      async () => {},
      async () => {},
      async (nodeId: string) => {
        this.logger.debug("Connected to peer", { nodeId });

        this.nodes.push(nodeId);

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

        this.localNodeId = localNodeId;

        if (rejected) {
          throw new KnockRejectedError();
        } else {
          this.bus.emit(this.getReadyKey(), true);
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

  async write(
    resourceType: EPeersResources,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to peers");

    if (Object.values(EPeersResources).includes(resourceType)) {
      if (this.localNodeId === nodeId) {
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
