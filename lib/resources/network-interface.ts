import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface INetworkInterfaceSpec {
  network: string;
  prefix: string;
}

export class NetworkInterface implements IResource<INetworkInterfaceSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.NETWORK_INTERFACE;

  constructor(
    public metadata: IResourceMetadata,
    public spec: INetworkInterfaceSpec
  ) {}
}
