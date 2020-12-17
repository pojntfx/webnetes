import { Capability, ICapabilitySpec } from "../resources/capability";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { IRuntimeSpec, Runtime } from "../resources/runtime";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Processors extends Repository<Runtime> {
  private logger = getLogger();

  async createRuntime(metadata: IResourceMetadata, spec: IRuntimeSpec) {
    this.logger.debug("Creating runtime", { metadata });

    const runtime = new Runtime(metadata, spec);

    this.addResource<Runtime>(
      runtime.apiVersion,
      runtime.kind,
      runtime.metadata,
      runtime.spec
    );
  }

  async createCapability(metadata: IResourceMetadata, spec: ICapabilitySpec) {
    this.logger.debug("Creating capability", { metadata });

    const capability = new Capability(metadata, spec);

    this.addResource<Capability>(
      capability.apiVersion,
      capability.kind,
      capability.metadata,
      capability.spec
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
}
