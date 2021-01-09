import { ResourceNotImplementedError } from "../errors/resource-not-implemented";
import { getLogger } from "../utils/logger";
import { IPipe, Pipe } from "./pipe";

export interface IResourcesConfig {}

export enum EResourcesResources {
  PROCESS = "schema.webnetes.dev/v1alpha1/raw/Process",
  PROCESS_INSTANCE = "schema.webnetes.dev/v1alpha1/raw/ProcessInstance",
  PROCESS_STDOUT = "schema.webnetes.dev/v1alpha1/raw/ProcessStdout",
  PROCESS_STDIN = "schema.webnetes.dev/v1alpha1/raw/ProcessStdin",

  TERMINAL = "schema.webnetes.dev/v1alpha1/raw/Terminal",
  TERMINAL_INSTANCE = "schema.webnetes.dev/v1alpha1/raw/TerminalInstance",
  TERMINAL_INSTANCE_DELETION = "schema.webnetes.dev/v1alpha1/raw/TerminalInstanceDeletion",
  TERMINAL_STDOUT = "schema.webnetes.dev/v1alpha1/raw/TerminalStdout",
  TERMINAL_STDIN = "schema.webnetes.dev/v1alpha1/raw/TerminalStdin",

  INPUT_DEVICE_INSTANCE = "schema.webnetes.dev/v1alpha1/raw/InputDeviceInstance",
  INPUT_DEVICE_INSTANCE_DELETION = "schema.webnetes.dev/v1alpha1/raw/InputDeviceInstanceDeletion",

  MANAGEMENT_ENTITY_INSTANCE = "schema.webnetes.dev/v1alpha1/raw/ManagementEntityInstance",
  MANAGEMENT_ENTITY_INSTANCE_DELETION = "schema.webnetes.dev/v1alpha1/raw/ManagementEntityInstanceDeletion",

  WEBNETES_ENTITY = "schema.webnetes.dev/v1alpha1/raw/WebnetesEntity",
  WEBNETES_ENTITY_DELETION = "schema.webnetes.dev/v1alpha1/raw/WebnetesEntityDeletion",
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
    this.logger.debug("Writing to resources", {
      resourceType,
      resourceId,
      nodeId,
    });

    await this.queue({
      resourceType: (() => {
        switch (resourceType) {
          case EResourcesResources.PROCESS: {
            return EResourcesResources.PROCESS_STDIN;
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

          case EResourcesResources.TERMINAL_INSTANCE_DELETION: {
            return EResourcesResources.INPUT_DEVICE_INSTANCE_DELETION;
          }

          case EResourcesResources.TERMINAL_STDIN: {
            return EResourcesResources.TERMINAL;
          }

          case EResourcesResources.MANAGEMENT_ENTITY_INSTANCE: {
            return EResourcesResources.WEBNETES_ENTITY;
          }

          case EResourcesResources.MANAGEMENT_ENTITY_INSTANCE_DELETION: {
            return EResourcesResources.WEBNETES_ENTITY_DELETION;
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
