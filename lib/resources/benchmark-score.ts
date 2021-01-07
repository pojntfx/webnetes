import {
  API_VERSION,
  EResourceKind,
  IResource,
  IResourceMetadata,
} from "./resource";

export enum EBenchmarkKind {
  CPU = "CPU",
  NET = "NET",
}

export interface IBenchmarkScoreSpec {
  kind: EBenchmarkKind;
  score: number;
}

export class BenchmarkScore implements IResource<IBenchmarkScoreSpec> {
  apiVersion = API_VERSION;
  kind = EResourceKind.BENCHMARK_SCORE;

  constructor(
    public metadata: IResourceMetadata,
    public spec: IBenchmarkScoreSpec
  ) {}
}
