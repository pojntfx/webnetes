import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ITurnServerSpec {
  urls: string[];
  username: string;
  credential: string;
}

export class TurnServer implements IResource<ITurnServerSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.TURNSERVER;

  constructor(
    public metadata: IResourceMetadata,
    public spec: ITurnServerSpec
  ) {}
}
