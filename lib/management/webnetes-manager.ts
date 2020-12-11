import { InvalidReferenceError } from "../errors/invalid-reference";
import { UnimplementedResourceError } from "../errors/unimplemented-resource";
import { File } from "../models/file";
import { Network } from "../models/network";
import { Node } from "../models/node";
import { Repository } from "../models/repository";
import { API_VERSION, EResourceKind, IResource } from "../models/resource";
import { Subnet } from "../models/subnet";
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

        node.spec.runtimes.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.RUNTIME,
            "runtimes"
          )
        );
        node.spec.capabilities.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.CAPABILITY,
            "capabilities"
          )
        );

        break;
      }

      case EResourceKind.NETWORK: {
        const network = resource as Network;

        this.resolveReference(
          network.spec.signaler,
          API_VERSION,
          EResourceKind.SIGNALER,
          "signaler"
        );
        network.spec.stunServers.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.STUNSERVER,
            "stunServers"
          )
        );
        network.spec.turnServers.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.TURNSERVER,
            "turnServers"
          )
        );

        break;
      }

      case EResourceKind.SUBNET: {
        const subnet = resource as Subnet;

        this.resolveReference(
          subnet.spec.network,
          API_VERSION,
          EResourceKind.NETWORK,
          "network"
        );

        break;
      }

      case EResourceKind.REPOSITORY: {
        const repo = resource as Repository;

        repo.spec.trackers.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.TRACKER,
            "trackers"
          )
        );

        break;
      }

      case EResourceKind.FILE: {
        const file = resource as File;

        this.resolveReference(
          file.spec.repository,
          API_VERSION,
          EResourceKind.REPOSITORY,
          "repository"
        );

        break;
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

  private resolveReference<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind,
    field: string
  ) {
    const res = this.resources.find(
      (candidate) =>
        candidate.apiVersion === apiVersion &&
        candidate.kind === kind &&
        candidate.metadata.label === label
    ) as IResource<T>;

    if (!res) {
      throw new InvalidReferenceError(label, apiVersion, kind, field);
    }

    return res;
  }
}
