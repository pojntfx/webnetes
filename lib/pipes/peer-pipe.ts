import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import {
  ExtendedRTCConfiguration,
  SignalingClient,
  Transporter,
} from "@pojntfx/unisockets";
import { UnknownResourceError } from "../errors/unknown-resource";
import { ClosedError } from "../errors/closed";
import { IOFrameTranscoder } from "../frames/io-frame-transcoder";
import { KnockRejectedError } from "../errors/knock-rejected";

export interface IPeerPipeConfig {
  transporter: ExtendedRTCConfiguration;
  signaler: {
    url: string;
    retryAfter: number;
    prefix: string;
  };
}

export enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdout",
  // STDOUT_RESOLVE = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdoutResolve",
  // STDOUT_REJECTION = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdoutRejection",
  STDIN = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdin",
  // STDIN_RESOLVE = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdinResolve",
  // STDIN_REJECTION = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdinRejection",
  WORKLOAD = "webnetes.felix.pojtinger.com/v1alpha1/resources/workload",
}

export class PeerPipe
  implements IPipe<IPeerPipeConfig, EPeerPipeResourceTypes> {
  private logger = getLogger();
  private bus = new Emittery();
  private ioFrameQueue = [] as Uint8Array[];
  private ioFrameTranscoder = new IOFrameTranscoder<EPeerPipeResourceTypes>();
  private transporter?: Transporter;
  private signaler?: SignalingClient;
  private nodes = [] as string[];
  private localNodeId = "";

  async open(config: IPeerPipeConfig) {
    this.logger.debug("Opening PeerPipe", { config });

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
          const frame = this.ioFrameTranscoder.decode(receivedMsg);
          const processedMsg = this.ioFrameTranscoder.encode({
            ...frame,
            nodeId,
          });

          this.ioFrameQueue.push(processedMsg);
          this.bus.emit(this.getReadKey(), processedMsg);
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
    this.logger.debug("Closing PeerPipe");

    await Promise.all([this.transporter?.close(), this.signaler?.close()]);
  }

  async read() {
    this.logger.debug("Reading from PeerPipe");

    return await this.handleRead();
  }

  async write(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to PeerPipe");

    if (Object.values(EPeerPipeResourceTypes).includes(resourceType)) {
      await this.handleWrite(resourceType, resourceId, msg, nodeId);
    } else {
      throw new UnknownResourceError(resourceType);
    }
  }

  private async handleRead() {
    let msg: Uint8Array;
    if (this.ioFrameQueue.length !== 0) {
      msg = this.ioFrameQueue.shift()!;
    } else {
      msg = (await this.bus.once(this.getReadKey())) as Uint8Array;

      this.ioFrameQueue.shift();
    }

    const frame = this.ioFrameTranscoder.decode(msg);

    return frame;
  }

  private async handleWrite(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    if (this.localNodeId === nodeId) {
      const processedMsg = this.ioFrameTranscoder.encode({
        resourceType,
        resourceId,
        msg,
        nodeId,
      });

      this.ioFrameQueue.push(processedMsg);
      this.bus.emit(this.getReadKey(), processedMsg);
    } else {
      if (this.transporter) {
        const frame = this.ioFrameTranscoder.encode({
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
  }

  private getReadyKey() {
    return "ready";
  }

  private getReadKey() {
    return "read";
  }
}
