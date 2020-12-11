export const API_VERSION = "webnetes.felicitas.pojtinger.com/v1alpha1";

export enum EResourceKind {
  RUNTIME = "Runtime",
  ARGUMENTS = "Arguments",
  CAPABILITY = "Capability",
  FILE = "File",
  NETWORK = "Network",
  PROCESSOR = "Processor",
  REPOSITORY = "Repository",
  SIGNALER = "Signaler",
  STUNSERVER = "StunServer",
  SUBNET = "Subnet",
  TRACKER = "Tracker",
  TURNSERVER = "TurnServer",
  WORKLOAD = "Workload",
}

export interface IResourceMetadata {
  name?: string;
  label: string;
}

export interface IResource<T> {
  apiVersion: string;
  kind: EResourceKind;
  metadata: IResourceMetadata;
  spec: T;
}
