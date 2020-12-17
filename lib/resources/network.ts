import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface INetworkSpec {
  signaler: string;
  stunServers: string[];
  turnServers: string[];
}

export class Network implements IResource<INetworkSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.NETWORK;

  constructor(public metadata: IResourceMetadata, public spec: INetworkSpec) {}
}
