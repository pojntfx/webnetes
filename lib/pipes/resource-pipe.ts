import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { IOFrameTranscoder } from "../frames/io-frame-transcoder";
import { ClosedError } from "../errors/closed";

export interface IResourcePipeConfig {
  process: {
    writeToStdin: (
      resourceId: string,
      msg: Uint8Array,
      nodeId: string
    ) => Promise<void>;
    readFromStdout: () => Promise<{
      resourceId: string;
      msg: Uint8Array;
      nodeId: string;
    }>;
  };
  terminal: {
    writeToStdout: (
      resourceId: string,
      msg: Uint8Array,
      nodeId: string
    ) => Promise<void>;
    readFromStdin: () => Promise<{
      resourceId: string;
      msg: Uint8Array;
      nodeId: string;
    }>;
  };
}

export enum EResourcePipeTypes {
  PROCESS = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/process",
  // PROCESS_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processResolve",
  // PROCESS_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processRejection",
  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminal",
  // TERMINAL_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalResolve",
  // TERMINAL_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalRejection",
}

export class ResourcePipe
  implements IPipe<IResourcePipeConfig, EResourcePipeTypes> {
  private logger = getLogger();
  private bus = new Emittery();
  private ioFrameQueue = [] as Uint8Array[];
  private ioFrameTranscoder = new IOFrameTranscoder<EResourcePipeTypes>();
  config?: IResourcePipeConfig;

  async open(config: IResourcePipeConfig) {
    this.logger.debug("Opening ResourcePipe", { config });

    (async () => {
      while (true) {
        const {
          resourceId,
          msg,
          nodeId,
        } = await config.process.readFromStdout();

        const processedFrame = this.ioFrameTranscoder.encode({
          resourceType: EResourcePipeTypes.PROCESS,
          resourceId,
          msg,
          nodeId,
        });

        this.ioFrameQueue.push(processedFrame);
        this.bus.emit(this.getReadKey(), processedFrame);
      }
    })();

    (async () => {
      while (true) {
        const {
          resourceId,
          msg,
          nodeId,
        } = await config.terminal.readFromStdin();

        const processedFrame = this.ioFrameTranscoder.encode({
          resourceType: EResourcePipeTypes.TERMINAL,
          resourceId,
          msg,
          nodeId,
        });

        this.ioFrameQueue.push(processedFrame);
        this.bus.emit(this.getReadKey(), processedFrame);
      }
    })();

    this.config = config;
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

    return frame;
  }

  private async handleWrite(
    resourceType: EResourcePipeTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    if (this.config) {
      switch (resourceType) {
        case EResourcePipeTypes.PROCESS: {
          await this.config.process.writeToStdin(resourceId, msg, nodeId);

          break;
        }

        case EResourcePipeTypes.TERMINAL: {
          await this.config.terminal.writeToStdout(resourceId, msg, nodeId);

          break;
        }
      }
    } else {
      throw new ClosedError("config");
    }
  }

  private getReadKey() {
    return "read";
  }
}
