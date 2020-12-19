import { InstanceDoesNotExistError } from "../errors/instance-does-not-exist";
import { IInstance } from "../resources/instance";
import { IResource } from "../resources/resource";
import { ResourceManager } from "./resource-manager";

export abstract class Repository<
  T extends IResource<any>,
  I extends IInstance<any>
> extends ResourceManager<T> {
  protected instances = [] as I[];

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

  protected async removeInstance<R extends I>(
    apiVersion: R["apiVersion"],
    kind: R["kind"],
    label: R["metadata"]["label"]
  ) {
    try {
      await this.findInstance(apiVersion, kind, label);
    } catch (e) {
      if (!(e instanceof InstanceDoesNotExistError)) throw e;
    }

    this.instances = this.instances.filter(
      (candidate) =>
        !(
          candidate.apiVersion === apiVersion &&
          candidate.kind === kind &&
          candidate.metadata.label === label
        )
    );
  }
}
