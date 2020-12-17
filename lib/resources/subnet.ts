import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ISubnetSpec {
  network: string;
  prefix: string;
}

export class Subnet implements IResource<ISubnetSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.SUBNET;

  constructor(public metadata: IResourceMetadata, public spec: ISubnetSpec) {}
}
