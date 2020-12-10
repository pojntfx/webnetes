import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface INodeSpec {
  runtimes: string[];
  capabilities: string[];
}

export class Node implements IResource<INodeSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.NODE;

  constructor(public metadata: IResourceMetadata, public spec: INodeSpec) {}
}
