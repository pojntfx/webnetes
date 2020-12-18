import { InstanceDoesNotExistError } from "../errors/instance-does-not-exist";
import { ResourceDoesNotExistError } from "../errors/resource-does-not-exist";
import { IInstance } from "../resources/instance";
import { IResource } from "../resources/resource";

export abstract class Repository<
  T extends IResource<any>,
  I extends IInstance<any>
> {
  protected resources = [] as T[];
  protected instances = [] as I[];

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

  protected async addInstance<R extends I>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    metadata: R["metadata"],
    instance: R["instance"]
  ) {
    try {
      await this.findInstance(apiVersion, kind, metadata.label);
    } catch (e) {
      if (!(e instanceof InstanceDoesNotExistError)) throw e;
    }

    this.instances.push({ apiVersion, kind, metadata, instance } as R);
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

  protected async findInstance<R extends I>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    label: R["metadata"]["label"]
  ) {
    const instance = this.instances.find(
      (candidate) =>
        candidate.apiVersion === apiVersion &&
        candidate.kind === kind &&
        candidate.metadata.label === label
    );

    if (instance) {
      return instance as R;
    } else {
      throw new InstanceDoesNotExistError(label);
    }
  }
}
