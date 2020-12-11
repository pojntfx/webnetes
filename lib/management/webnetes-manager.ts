import { InvalidReferenceError } from "../errors/invalid-reference";
import { UnimplementedResourceError } from "../errors/unimplemented-resource";
import { File } from "../models/file";
import { Network } from "../models/network";
import { Processor } from "../models/processor";
import { Repository } from "../models/repository";
import { API_VERSION, EResourceKind, IResource } from "../models/resource";
import { Subnet } from "../models/subnet";
import { Workload } from "../models/workload";
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
      case EResourceKind.PROCESSOR: {
        const processor = resource as Processor;

        processor.spec.runtimes.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.RUNTIME,
            "runtimes"
          )
        );
        processor.spec.capabilities.forEach((label) =>
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

      case EResourceKind.WORKLOAD: {
        const workload = resource as Workload;

        this.resolveReference(
          workload.spec.file,
          API_VERSION,
          EResourceKind.FILE,
          "file"
        );
        this.resolveReference(
          workload.spec.runtime,
          API_VERSION,
          EResourceKind.RUNTIME,
          "runtime"
        );
        this.resolveReference(
          workload.spec.subnet,
          API_VERSION,
          EResourceKind.SUBNET,
          "subnet"
        );
        this.resolveReference(
          workload.spec.arguments,
          API_VERSION,
          EResourceKind.ARGUMENTS,
          "arguments"
        );
        workload.spec.capabilities.forEach((label) =>
          this.resolveReference(
            label,
            API_VERSION,
            EResourceKind.CAPABILITY,
            "capabilities"
          )
        );

        break;
      }
    }

    if (
      this.findResource(
        resource.metadata.label,
        resource.apiVersion,
        resource.kind
      )
    ) {
      if (
        [
          EResourceKind.SUBNET,
          EResourceKind.REPOSITORY,
          EResourceKind.FILE,
          EResourceKind.WORKLOAD,
        ].includes(resource.kind)
      ) {
        this.logger.verbose("Handling update hooks for resource", { resource });
      }

      this.resources.map((r) =>
        this.resourcesMatch(r, resource) ? resource : r
      );

      this.logger.debug("Replaced resource", { resource });
    } else {
      if (
        [
          EResourceKind.SUBNET,
          EResourceKind.REPOSITORY,
          EResourceKind.FILE,
          EResourceKind.WORKLOAD,
        ].includes(resource.kind)
      ) {
        this.logger.verbose("Handling create hooks for resource", { resource });
      }

      this.resources.push(resource);

      this.logger.debug("Added resource", { resource });
    }
  }

  async deleteResource(resource: IResource<any>) {
    this.logger.debug("Deleting resource", { resource });

    if (
      [
        EResourceKind.SUBNET,
        EResourceKind.REPOSITORY,
        EResourceKind.FILE,
        EResourceKind.WORKLOAD,
      ].includes(resource.kind)
    ) {
      this.logger.verbose("Handling delete hooks for resource", { resource });
    }

    if (!Object.values(EResourceKind).includes(resource.kind)) {
      throw new UnimplementedResourceError();
    }

    this.resources.filter(
      (candidate) => !this.resourcesMatch(candidate, resource)
    );

    this.logger.debug("Deleted resource", { resource });
  }

  private resourcesMatch(actual: IResource<any>, expected: IResource<any>) {
    return (
      actual.apiVersion === expected.apiVersion &&
      actual.kind === expected.kind &&
      actual.metadata.label === expected.metadata.label
    );
  }

  private findResource<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind
  ) {
    return this.resources.find((candidate) =>
      this.resourcesMatch(candidate, {
        apiVersion,
        kind,
        metadata: {
          label,
        },
        spec: {},
      })
    ) as IResource<T>;
  }

  private resolveReference<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind,
    field: string
  ) {
    const res = this.findResource<T>(label, apiVersion, kind);

    if (!res) {
      throw new InvalidReferenceError(label, apiVersion, kind, field);
    }

    return res;
  }
}