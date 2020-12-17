import { ResourceNotImplementedError } from "../errors/resource-not-implemented";
import { getLogger } from "../utils/logger";
import { IPipe, Pipe } from "./pipe";

export interface IResourcesConfig {}

export enum EResourcesResources {
  PROCESS = "webnetes.felix.pojtinger.com/v1alpha1/raw/Process",
  PROCESS_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/raw/ProcessInstance",
  PROCESS_STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/raw/ProcessStdout",
  PROCESS_STDIN = "webnetes.felix.pojtinger.com/v1alpha1/raw/ProcessStdin",

  TERMINAL = "webnetes.felix.pojtinger.com/v1alpha1/raw/Terminal",
  TERMINAL_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/raw/TerminalInstance",
  TERMINAL_STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/raw/TerminalStdout",
  TERMINAL_STDIN = "webnetes.felix.pojtinger.com/v1alpha1/raw/TerminalStdin",

  INPUT_DEVICE_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/raw/InputDeviceInstance",
  WORKLOAD_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/raw/WorkloadInstance",

  MANAGEMENT_ENTITY_INSTANCE = "webnetes.felix.pojtinger.com/v1alpha1/raw/ManagementEntityInstance",
  WEBNETES_ENTITY = "webnetes.felix.pojtinger.com/v1alpha1/raw/WebnetesEntity",
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

          case EResourcesResources.MANAGEMENT_ENTITY_INSTANCE: {
            return EResourcesResources.WEBNETES_ENTITY;
          }

          default: {
            throw new ResourceNotImplementedError(resourceType);
          }
        }
      })(),
      resourceId,
      msg,
      nodeId,
    });
  }
}
