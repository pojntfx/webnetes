import { IResourceMetadata } from "../resources/resource";
import { IRuntimeSpec, Runtime } from "../resources/runtime";
import { Repository } from "./repository";

export class Processors extends Repository<Runtime> {
  async createRuntime(metadata: IResourceMetadata, spec: IRuntimeSpec) {
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
    return this.findResource<Runtime>(apiVersion, kind, label);
  }
}
