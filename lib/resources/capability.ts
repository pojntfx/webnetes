import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ICapabilitySpec {}

export class Capability implements IResource<ICapabilitySpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.CAPABILITY;

  constructor(
    public metadata: IResourceMetadata,
    public spec: ICapabilitySpec
  ) {}
}
