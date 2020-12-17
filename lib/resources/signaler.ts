import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ISignalerSpec {
  urls: string[];
  retryAfter: number;
}

export class Signaler implements IResource<ISignalerSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.SIGNALER;

  constructor(public metadata: IResourceMetadata, public spec: ISignalerSpec) {}
}
