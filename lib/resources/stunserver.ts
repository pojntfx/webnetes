import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IStunServerSpec {
  urls: string[];
}

export class StunServer implements IResource<IStunServerSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.STUNSERVER;

  constructor(
    public metadata: IResourceMetadata,
    public spec: IStunServerSpec
  ) {}
}
