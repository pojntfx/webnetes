import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { IOFrameTranscoder } from "../frames/io-frame-transcoder";
import { ClosedError } from "../errors/closed";

export interface IResourcePipeConfig {}

export enum EResourcePipeTypes {
  PROCESS = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/process",
  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminal",
  WORKLOAD_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/workloadInstance",
  PROCESS_WRITE_TO_STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processWriteToStdin",
  TERMINAL_WRITE_TO_STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalWriteToStdout",
  CREATE_WORKLOAD = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/createWorkload",
  PROCESS_READ_FROM_STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processReadFromStdout",
  TERMINAL_READ_FROM_STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalReadFromStdin",
  INPUT_DEVICE_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/inputDeviceInstance",
  CREATE_INPUT_DEVICE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/createInputDevice",
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
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.PROCESS_WRITE_TO_STDIN,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

          break;
        }

        case EResourcePipeTypes.TERMINAL: {
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.TERMINAL_WRITE_TO_STDOUT,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

          break;
        }

        case EResourcePipeTypes.WORKLOAD_INSTANCE: {
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.CREATE_WORKLOAD,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

          break;
        }

        case EResourcePipeTypes.PROCESS_READ_FROM_STDOUT: {
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.PROCESS,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

          break;
        }

        case EResourcePipeTypes.TERMINAL_READ_FROM_STDIN: {
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.TERMINAL,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

          break;
        }

        case EResourcePipeTypes.INPUT_DEVICE_INSTANCE: {
          const processedFrame = this.ioFrameTranscoder.encode({
            resourceType: EResourcePipeTypes.CREATE_INPUT_DEVICE,
            resourceId,
            msg,
            nodeId,
          });

          this.ioFrameQueue.push(processedFrame);
          this.bus.emit(this.getReadKey(), processedFrame);

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
