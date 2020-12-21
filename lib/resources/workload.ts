import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IWorkloadSpec {
  file: string;
  runtime: string;
  capabilities: string[];
  networkInterface: string;
  arguments: string;
  terminalLabel: string;
  terminalHostNodeId: string;
}

export class Workload implements IResource<IWorkloadSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.WORKLOAD;

  constructor(public metadata: IResourceMetadata, public spec: IWorkloadSpec) {}
}
