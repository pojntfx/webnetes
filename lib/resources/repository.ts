import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IRepositorySpec {
  trackers: string[];
  stunServers: string[];
  turnServers: string[];
}

export class Repository implements IResource<IRepositorySpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.REPOSITORY;

  constructor(
    public metadata: IResourceMetadata,
    public spec: IRepositorySpec
  ) {}
}
