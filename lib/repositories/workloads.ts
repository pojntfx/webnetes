import { VirtualMachine } from "../controllers/virtual-machine";
import { Arguments, IArgumentsSpec } from "../resources/arguments";
import { IInstance } from "../resources/instance";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { Workload } from "../resources/workload";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Workloads extends Repository<
  Arguments | Workload,
  IInstance<VirtualMachine>
> {
  private logger = getLogger();

  async createArguments(metadata: IResourceMetadata, spec: IArgumentsSpec) {
    this.logger.debug("Creating arguments", { metadata });

    const args = new Arguments(metadata, spec);

    await this.addResource<Arguments>(
      args.apiVersion,
      args.kind,
      args.metadata,
      args.spec
    );
  }

  async getArguments(label: Arguments["metadata"]["label"]) {
    this.logger.debug("Getting arguments", { label });

    return this.findResource<Arguments>(
      API_VERSION,
      EResourceKind.ARGUMENTS,
      label
    );
  }
}
