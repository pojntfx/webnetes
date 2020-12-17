import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IFileSpec {
  repository: string;
  uri: string;
}

export class File implements IResource<IFileSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.FILE;

  constructor(public metadata: IResourceMetadata, public spec: IFileSpec) {}
}
