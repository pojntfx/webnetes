import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ITrackerSpec {
  urls: string[];
}

export class Tracker implements IResource<ITrackerSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.TRACKER;

  constructor(public metadata: IResourceMetadata, public spec: ITrackerSpec) {}
}
