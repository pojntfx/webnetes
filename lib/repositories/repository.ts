import { ResourceDoesNotExistError } from "../errors/resource-does-not-exist";
import { IResource } from "../resources/resource";

export abstract class Repository<T extends IResource<any>> {
  protected resources = [] as T[];

  protected async addResource<R extends T>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    metadata: R["metadata"],
    spec: R["spec"]
  ) {
    try {
      await this.findResource(apiVersion, kind, metadata.label);

      this.resources.push({ apiVersion, kind, metadata, spec } as R);
    } catch (e) {
      if (!(e instanceof ResourceDoesNotExistError)) throw e;
    }
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
      return resource as IResource<R>;
    } else {
      throw new ResourceDoesNotExistError(label);
    }
  }
}
