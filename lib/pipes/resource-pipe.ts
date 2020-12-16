import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { IOFrameTranscoder } from "../frames/io-frame-transcoder";

export interface IResourcePipeConfig {
  process: {
    writeToStdin: (msg: Uint8Array, processId: string) => Promise<void>;
    readFromStdout: () => Promise<{ msg: Uint8Array; processId: string }>;
  };
  terminal: {
    writeToStdout: (msg: Uint8Array, processId: string) => Promise<void>;
    readFromStdin: () => Promise<{ msg: Uint8Array; processId: string }>;
  };
}

export enum EResourcePipeTypes {
  PROCESS = "webnetes.felix.pojtinger.com/v1alpha1/resources/process",
  // PROCESS_RESOLVE = "webnetes.felix.pojtinger.com/v1alpha1/resources/processResolve",
  // PROCESS_REJECTION = "webnetes.felix.pojtinger.com/v1alpha1/resources/processRejection",
  TERMINAL = "webnetes.felix.pojtinger.com/v1alpha1/resources/terminal",
  // TERMINAL_RESOLVE = "webnetes.felix.pojtinger.com/v1alpha1/resources/terminalResolve",
  // TERMINAL_REJECTION = "webnetes.felix.pojtinger.com/v1alpha1/resources/terminalRejection",
}

export class ResourcePipe
  implements IPipe<IResourcePipeConfig, EResourcePipeTypes> {
  private logger = getLogger();
  private bus = new Emittery();
  private ioFrameQueue = [] as Uint8Array[];
  private ioFrameTranscoder = new IOFrameTranscoder();

  async open(config: IResourcePipeConfig) {
    this.logger.debug("Opening ResourcePipe", { config });
  }

  async close() {
    this.logger.debug("Closing ResourcePipe");
  }

  async read() {
    this.logger.debug("Reading from ResourcePipe");

    return await this.handleRead();
  }

  async write(
    resourceType: EResourcePipeTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to ResourcePipe");

    if (Object.values(EResourcePipeTypes).includes(resourceType)) {
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

    // TODO: Handle different resourceTypes

    return frame;
  }

  private async handleWrite(
    resourceType: EResourcePipeTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    // TODO: Handle different resourceTypes

    console.log(resourceType, resourceId, msg, nodeId);
  }

  private getReadKey() {
    return "read";
  }
}
