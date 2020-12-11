import { InvalidReferenceError } from "../errors/invalid-reference";
import { UnimplementedResourceError } from "../errors/unimplemented-resource";
import { Node } from "../models/node";
import { API_VERSION, EResourceKind, IResource } from "../models/resource";
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

    switch (resource.kind) {
      case EResourceKind.NODE: {
        const node = resource as Node;

        node.spec.capabilities.forEach((cap) => {
          if (!this.findResource(API_VERSION, EResourceKind.CAPABILITY, cap)) {
            throw new InvalidReferenceError(
              EResourceKind.CAPABILITY,
              "capabilities",
              cap
            );
          }
        });
      }
    }

    if ([EResourceKind.NODE, EResourceKind.WORKLOAD].includes(resource.kind)) {
      // Applying a node: Create & open all three subsystems if all dependencies (-> check labels) are set
      // Applying a workload: Schedule & start a VM
      this.logger.verbose("Creating node or workload", { resource });
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
      this.logger.verbose("Deleting node or workload", { resource });
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

  private findResource<T>(
    apiVersion: string,
    kind: EResourceKind,
    label: string
  ) {
    return this.resources.find(
      (candidate) =>
        candidate.apiVersion === apiVersion &&
        candidate.kind === kind &&
        candidate.metadata.label === label
    ) as IResource<T>;
  }
}
