import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface ICoordinatesSpec {
  describes: string;
  latitude: number;
  longitude: number;
}

export class Coordinates implements IResource<ICoordinatesSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.COORDINATES;

  constructor(
    public metadata: IResourceMetadata,
    public spec: ICoordinatesSpec
  ) {}
}
