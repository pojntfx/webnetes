import { EResourceKind, IResourceMetadata } from "./resource";

export interface IInstance<T> {
  apiVersion: string;
  kind: EResourceKind;
  metadata: IResourceMetadata;
  instance: T;
}
