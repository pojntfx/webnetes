import { UnimplementedResourceError } from "../errors/unimplemented-resource";
import { EResourceKind, IResource } from "../models/resource";
import { getLogger } from "../utils/logger";

export class WebnetesManager {
  private logger = getLogger();

  private resources = [] as IResource<any>[];

  async close() {
    this.logger.verbose("Closing webnetes manager");

    // Close all closable resources
  }

  async applyResource(resource: IResource<any>) {
    this.logger.debug("Applying resource", { resource });

    if (!Object.values(EResourceKind).includes(resource.kind)) {
      throw new UnimplementedResourceError();
    }

    if ([EResourceKind.NODE, EResourceKind.WORKLOAD].includes(resource.kind)) {
      // Applying a node: Create & open all three subsystems if all dependencies (-> check labels) are set
      // Applying a workload: Schedule & start a VM
    } else {
      if (
        this.resources.find((actual) => this.resourcesMatch(actual, resource))
      ) {
        this.resources.map((r) =>
          this.resourcesMatch(r, resource) ? resource : r
        );

        this.logger.verbose("Replaced resource", { resource });
      } else {
        this.resources.push(resource);

        this.logger.verbose("Added resource", { resource });
      }
    }
  }

  async deleteResource(resource: IResource<any>) {
    this.logger.debug("Applying resource", { resource });

    if (!Object.values(EResourceKind).includes(resource.kind)) {
      throw new UnimplementedResourceError();
    }

    if ([EResourceKind.NODE, EResourceKind.WORKLOAD].includes(resource.kind)) {
      // Deleting a node: Close all three subsystems if all dependencies (-> check labels) are set
      // Deleting a workload: Stop a VM
    }

    this.resources.filter(
      (candidate) => !this.resourcesMatch(candidate, resource)
    );

    this.logger.verbose("Deleted resource", { resource });
  }

  private resourcesMatch(actual: IResource<any>, expected: IResource<any>) {
    return (
      actual.apiVersion === expected.apiVersion &&
      actual.kind === expected.kind &&
      actual.metadata.label === expected.metadata.label
    );
  }
}
