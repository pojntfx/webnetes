import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IRuntimeSpec {}

export class Runtime implements IResource<IRuntimeSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.RUNTIME;

  constructor(public metadata: IResourceMetadata, public spec: IRuntimeSpec) {}
}
