import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IArgumentsSpec {
  argv: string[];
}

export class Arguments implements IResource<IArgumentsSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.ARGUMENTS;

  constructor(
    public metadata: IResourceMetadata,
    public spec: IArgumentsSpec
  ) {}
}
