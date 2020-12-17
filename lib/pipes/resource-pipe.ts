import Emittery from "emittery";
import { ClosedError } from "../errors/closed";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { Frame, FrameTranscoder } from "./transcoder";

export interface IResourcePipeConfig {}

export enum EResourcePipeResources {
  PROCESS = "webnetes.felix.pojtinger.com/v1alpha1/resources/Process",
  PROCESS_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/resources/ProcessInstance",
  PROCESS_STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/resources/ProcessStdout",
  PROCESS_STDIN = "webnetes.felix.pojtinger.com/v1alpha1/resources/ProcessStdin",

  TERMINAL = "webnetes.felix.pojtinger.com/v1alpha1/resources/Terminal",
  TERMINAL_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/resources/TerminalInstance",
  TERMINAL_STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/resources/TerminalStdout",
  TERMINAL_STDIN = "webnetes.felix.pojtinger.com/v1alpha1/resources/TerminalStdin",

  INPUT_DEVICE_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/resources/InputDeviceInstance",
  WORKLOAD_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/resources/WorkloadInstance",
}

export class ResourcePipe
  implements IPipe<IResourcePipeConfig, EResourcePipeResources> {
  private logger = getLogger();
  private bus = new Emittery();
  private frames = [] as Uint8Array[];
  private transcoder = new FrameTranscoder<EResourcePipeResources>();
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
    resourceType: EResourcePipeResources,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to ResourcePipe");

    if (this.config) {
      switch (resourceType) {
        case EResourcePipeResources.PROCESS: {
          await this.queue({
            resourceType: EResourcePipeResources.PROCESS_STDIN,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        case EResourcePipeResources.PROCESS_INSTANCE: {
          await this.queue({
            resourceType: EResourcePipeResources.WORKLOAD_INSTANCE,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        case EResourcePipeResources.PROCESS_STDOUT: {
          await this.queue({
            resourceType: EResourcePipeResources.PROCESS,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        case EResourcePipeResources.TERMINAL: {
          await this.queue({
            resourceType: EResourcePipeResources.TERMINAL_STDOUT,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        case EResourcePipeResources.TERMINAL_INSTANCE: {
          await this.queue({
            resourceType: EResourcePipeResources.INPUT_DEVICE_INSTANCE,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        case EResourcePipeResources.TERMINAL_STDIN: {
          await this.queue({
            resourceType: EResourcePipeResources.TERMINAL,
            resourceId,
            msg,
            nodeId,
          });

          break;
        }

        default: {
          throw new UnknownResourceError(resourceType);
        }
      }
    } else {
      throw new ClosedError("config");
    }
  }

  private async queue(frame: Frame<EResourcePipeResources>) {
    const encodedFrame = this.transcoder.encode(frame);

    this.frames.push(encodedFrame);
    await this.bus.emit(this.getReadKey(), encodedFrame);
  }

  private getReadKey() {
    return "read";
  }
}
