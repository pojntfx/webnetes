import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { ExtendedRTCConfiguration, Transporter } from "@pojntfx/unisockets";
import { UnknownResourceError } from "../errors/unknown-resource";
import { ClosedError } from "../errors/closed";
import { IIOFrame, IOFrameTranscoder } from "../frames/io-frame-transcoder";

export interface IPeerPipeConfig {
  networkConfig: ExtendedRTCConfiguration;
}

export enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdout",
  STDOUT_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutResolve",
  STDOUT_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutRejection",
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdin",
  STDIN_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinResolve",
  STDIN_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinRejection",
}

export class PeerPipe
  implements IPipe<IPeerPipeConfig, EPeerPipeResourceTypes> {
  private logger = getLogger();
  private bus = new Emittery();
  private ioFrameQueue = [] as Uint8Array[];
  private ioFrameTranscoder = new IOFrameTranscoder();
  private transporter?: Transporter;
  private aliases = new Map<string, string>();
  private nodes = [] as string[];

  async open(config: IPeerPipeConfig) {
    this.logger.debug("Opening PeerPipe", { config });

    const transporter = new Transporter(
      config.networkConfig,
      async () => {},
      async () => {},
      async (nodeId: string) => {
        this.logger.debug("Connected to peer", { nodeId });

        this.nodes.push(nodeId);

        while (this.nodes.includes(nodeId)) {
          this.logger.silly("Received from peer", { nodeId });

          const msg = await transporter.recv(nodeId);

          this.ioFrameQueue.push(msg);
          this.bus.emit(this.getReadKey(), msg);
        }
      },
      async (nodeId) => {
        this.logger.debug("Disconnected from peer", { nodeId });

        this.nodes = this.nodes.filter((candidate) => candidate !== nodeId);
      }
    );

    this.transporter = transporter;
  }

  async close() {
    this.logger.debug("Closing PeerPipe");

    await this.transporter?.close();
  }

  async read() {
    this.logger.debug("Reading from PeerPipe");

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

  async write(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to PeerPipe");

    switch (resourceType) {
      case EPeerPipeResourceTypes.STDOUT: {
        await this.handleWrite(resourceType, resourceId, msg, nodeId);

        break;
      }

      case EPeerPipeResourceTypes.STDIN: {
        await this.handleWrite(resourceType, resourceId, msg, nodeId);

        break;
      }

      default: {
        throw new UnknownResourceError(resourceType);
      }
    }
  }

  private async handleWrite(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
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

  private getReadKey() {
    return "read";
  }
}
