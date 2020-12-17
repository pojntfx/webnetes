import { IResourceMetadata } from "../resources/resource";
import { IRuntimeSpec, Runtime } from "../resources/runtime";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Processors extends Repository<Runtime> {
  private logger = getLogger();

  async createRuntime(metadata: IResourceMetadata, spec: IRuntimeSpec) {
    this.logger.debug("Created runtime", { metadata });

    const runtime = new Runtime(metadata, spec);

    this.addResource<Runtime>(
      runtime.apiVersion,
      runtime.kind,
      runtime.metadata,
      runtime.spec
    );
  }

  async getRuntime(
    apiVersion: Runtime["apiVersion"],
    kind: Runtime["kind"],
    label: Runtime["metadata"]["label"]
  ) {
    this.logger.debug("Getting runtime", { apiVersion, kind, label });

    return this.findResource<Runtime>(apiVersion, kind, label);
  }
}
