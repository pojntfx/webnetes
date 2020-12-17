import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { IIOFrame, IOFrameTranscoder } from "../frames/io-frame-transcoder";
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
  private frames = [] as Uint8Array[];
  private transcoder = new IOFrameTranscoder<EResourcePipeTypes>();
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

    let msg: Uint8Array;
    if (this.frames.length !== 0) {
      msg = this.frames.shift()!;
    } else {
      msg = (await this.bus.once(this.getReadKey())) as Uint8Array;

      this.frames.shift();
    }

    const frame = this.transcoder.decode(msg);

    return frame;
  }

  async write(
    resourceType: EResourcePipeTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to ResourcePipe");

    if (Object.values(EResourcePipeTypes).includes(resourceType)) {
      if (this.config) {
        switch (resourceType) {
          case EResourcePipeTypes.PROCESS: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.PROCESS_WRITE_TO_STDIN,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.TERMINAL: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.TERMINAL_WRITE_TO_STDOUT,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.WORKLOAD_INSTANCE: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.CREATE_WORKLOAD,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.PROCESS_READ_FROM_STDOUT: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.PROCESS,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.TERMINAL_READ_FROM_STDIN: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.TERMINAL,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.INPUT_DEVICE_INSTANCE: {
            await this.queueFrame({
              resourceType: EResourcePipeTypes.CREATE_INPUT_DEVICE,
              resourceId,
              msg,
              nodeId,
            });

            break;
          }
        }
      } else {
        throw new ClosedError("config");
      }
    } else {
      throw new UnknownResourceError(resourceType);
    }
  }

  private async queueFrame(frame: IIOFrame<EResourcePipeTypes>) {
    const encodedFrame = this.transcoder.encode(frame);

    this.frames.push(encodedFrame);
    await this.bus.emit(this.getReadKey(), encodedFrame);
  }

  private getReadKey() {
    return "read";
  }
}
