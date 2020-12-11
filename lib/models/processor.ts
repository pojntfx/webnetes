import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export interface IProcessorSpec {
  runtimes: string[];
  capabilities: string[];
}

export class Processor implements IResource<IProcessorSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.PROCESSOR;

  constructor(
    public metadata: IResourceMetadata,
    public spec: IProcessorSpec
  ) {}
}
