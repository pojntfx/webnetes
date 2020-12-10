export const API_VERSION = "webnetes.felix.pojtinger.com/v1alpha1";

export enum EResourceKind {
  RUNTIME = "Runtime",
}

export interface IResourceMetadata {
  name: string;
  label: string;
}

export interface IResource<T> {
  apiVersion: string;
  kind: EResourceKind;
  metadata: IResourceMetadata;
  spec: T;
}
