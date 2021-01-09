export const API_VERSION = "schema.webnetes.dev/v1alpha1";

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
  NETWORK_INTERFACE = "NetworkInterface",
  TRACKER = "Tracker",
  TURNSERVER = "TurnServer",
  WORKLOAD = "Workload",
  COORDINATES = "Coordinates",
  BENCHMARK_SCORE = "BenchmarkScore",
  PUBLIC_IP = "PublicIP",
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
