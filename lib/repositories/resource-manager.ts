import { ResourceDoesNotExistError } from "../errors/resource-does-not-exist";
import { IResource } from "../resources/resource";

export abstract class ResourceManager<T extends IResource<any>> {
  protected resources = [] as T[];

  protected async addResource<R extends T>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    metadata: R["metadata"],
    spec: R["spec"]
  ) {
    try {
      await this.findResource(apiVersion, kind, metadata.label);
    } catch (e) {
      if (!(e instanceof ResourceDoesNotExistError)) throw e;
    }

    this.resources.push({ apiVersion, kind, metadata, spec } as R);
  }

  protected async findResource<R extends T>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    label: R["metadata"]["label"]
  ) {
    const resource = this.resources.find(
      (candidate) =>
        candidate.apiVersion === apiVersion &&
        candidate.kind === kind &&
        candidate.metadata.label === label
    );

    if (resource) {
      return resource as R;
    } else {
      throw new ResourceDoesNotExistError(label);
    }
  }

  protected async removeResource<R extends T>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    label: R["metadata"]["label"]
  ) {
    this.resources = this.resources.filter(
      (candidate) =>
        !(
          candidate.apiVersion === apiVersion &&
          candidate.kind === kind &&
          candidate.metadata.label === label
        )
    );
  }
}
