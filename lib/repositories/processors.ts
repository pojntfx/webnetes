import { Capability, ICapabilitySpec } from "../resources/capability";
import { IProcessorSpec, Processor } from "../resources/processor";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { IRuntimeSpec, Runtime } from "../resources/runtime";
import { getLogger } from "../utils/logger";
import { ResourceManager } from "./resource-manager";

export class Processors extends ResourceManager<
  Runtime | Capability | Processor
> {
  private logger = getLogger();

  async createRuntime(metadata: IResourceMetadata, spec: IRuntimeSpec) {
    this.logger.debug("Creating runtime", { metadata });

    const runtime = new Runtime(metadata, spec);

    await this.addResource<Runtime>(
      runtime.apiVersion,
      runtime.kind,
      runtime.metadata,
      runtime.spec
    );
  }

  async deleteRuntime(metadata: IResourceMetadata) {
    this.logger.debug("Deleting runtime", { metadata });

    const runtime = new Runtime(metadata, {});

    await this.removeResource<Runtime>(
      runtime.apiVersion,
      runtime.kind,
      runtime.metadata.label
    );
  }

  async createCapability(metadata: IResourceMetadata, spec: ICapabilitySpec) {
    this.logger.debug("Creating capability", { metadata });

    const capability = new Capability(metadata, spec);

    await this.addResource<Capability>(
      capability.apiVersion,
      capability.kind,
      capability.metadata,
      capability.spec
    );
  }

  async createProcessor(metadata: IResourceMetadata, spec: IProcessorSpec) {
    this.logger.debug("Creating processor", { metadata });

    await Promise.all([
      ...spec.runtimes.map(async (runtime) => await this.getRuntime(runtime)),
      ...spec.capabilities.map(
        async (capability) => await this.getCapability(capability)
      ),
    ]);

    const processor = new Processor(metadata, spec);

    await this.addResource<Processor>(
      processor.apiVersion,
      processor.kind,
      processor.metadata,
      processor.spec
    );
  }

  async getRuntime(label: Runtime["metadata"]["label"]) {
    this.logger.debug("Getting runtime", { label });

    return this.findResource<Runtime>(
      API_VERSION,
      EResourceKind.RUNTIME,
      label
    );
  }

  async getCapability(label: Capability["metadata"]["label"]) {
    this.logger.debug("Getting capability", { label });

    return this.findResource<Capability>(
      API_VERSION,
      EResourceKind.CAPABILITY,
      label
    );
  }

  async getProcessor(label: Processor["metadata"]["label"]) {
    this.logger.debug("Getting processor", { label });

    return this.findResource<Processor>(
      API_VERSION,
      EResourceKind.PROCESSOR,
      label
    );
  }
}
