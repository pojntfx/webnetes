import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IPublicIPSpec {
  publicIP: string;
}

export class PublicIP implements IResource<IPublicIPSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.PUBLIC_IP;

  constructor(public metadata: IResourceMetadata, public spec: IPublicIPSpec) {}
}
