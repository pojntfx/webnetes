import { getLogger } from "../utils/logger";
import { IPipe, Pipe } from "./pipe";

export interface IResourcesConfig {}

export enum EResourcesResources {
  PROCESS = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/Process",
  PROCESS_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/ProcessInstance",
  PROCESS_STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/ProcessStdout",
  PROCESS_STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/ProcessStdin",

  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/Terminal",
  TERMINAL_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/TerminalInstance",
  TERMINAL_STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/TerminalStdout",
  TERMINAL_STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/TerminalStdin",

  INPUT_DEVICE_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/InputDeviceInstance",
  WORKLOAD_INSTANCE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/WorkloadInstance",
}

export class Resources
  extends Pipe<IResourcesConfig, EResourcesResources>
  implements IPipe<IResourcesConfig, EResourcesResources> {
  private logger = getLogger();

  async open(config: IResourcesConfig) {
    this.logger.debug("Opening resources", { config });
  }

  async close() {
    this.logger.debug("Closing resources");
  }

  async write(
    resourceType: EResourcesResources,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    this.logger.debug("Writing to resources");

    await this.queue({
      resourceType: (() => {
        switch (resourceType) {
          case EResourcesResources.PROCESS: {
            return EResourcesResources.PROCESS_STDIN;
          }

          case EResourcesResources.PROCESS_INSTANCE: {
            return EResourcesResources.WORKLOAD_INSTANCE;
          }

          case EResourcesResources.PROCESS_STDOUT: {
            return EResourcesResources.PROCESS;
          }

          case EResourcesResources.TERMINAL: {
            return EResourcesResources.TERMINAL_STDOUT;
          }

          case EResourcesResources.TERMINAL_INSTANCE: {
            return EResourcesResources.INPUT_DEVICE_INSTANCE;
          }

          case EResourcesResources.TERMINAL_STDIN: {
            return EResourcesResources.TERMINAL;
          }

          default: {
            throw new UnknownResourceError(resourceType);
          }
        }
      })(),
      resourceId,
      msg,
      nodeId,
    });
  }
}
