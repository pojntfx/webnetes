import yaml from "js-yaml";
import {
  ECapabilities,
  ERuntimes,
  VirtualMachine,
} from "../compute/virtual-machine";
import { DuplicateResourceError } from "../errors/duplicate-resource";
import { InstanceDoesNotExistError } from "../errors/instance-does-not-exist";
import { InvalidReferenceError } from "../errors/invalid-reference";
import { UnimplementedResourceError } from "../errors/unimplemented-resource";
import { IArgumentsSpec } from "../models/arguments";
import { ICapabilitySpec } from "../models/capability";
import { File } from "../models/file";
import { INetworkSpec, Network } from "../models/network";
import { Processor } from "../models/processor";
import { IRepositorySpec, Repository } from "../models/repository";
import { API_VERSION, EResourceKind, IResource } from "../models/resource";
import { IRuntimeSpec } from "../models/runtime";
import { ISignalerSpec } from "../models/signaler";
import { IStunServerSpec } from "../models/stunserver";
import { Subnet } from "../models/subnet";
import { ITrackerSpec } from "../models/tracker";
import { ITurnServerSpec } from "../models/turnserver";
import { Workload } from "../models/workload";
import { NetworkInterface } from "../networking/network-interface";
import { FileRepository } from "../storage/file-repository";
import { getLogger } from "../utils/logger";

export class Worker {
  private logger = getLogger();

  private resources = [] as IResource<any>[];
  private instances = new Map<string, any>();

  constructor(private onRestart: () => Promise<void>) {}

  async createResources(resources: IResource<any>[] | string) {
    this.logger.debug("Creating resources", { resources });

    if (typeof resources === "string") {
      resources = yaml.safeLoadAll(resources) as IResource<any>[];
    }

    for (let resource of resources) {
      this.logger.silly("Creating resource", { resource });

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
        throw new DuplicateResourceError(
          resource.metadata.label,
          resource.apiVersion,
          resource.kind
        );
      } else {
        if (
          [
            EResourceKind.SUBNET,
            EResourceKind.REPOSITORY,
            EResourceKind.FILE,
            EResourceKind.WORKLOAD,
          ].includes(resource.kind)
        ) {
          this.logger.silly("Handling create hooks for resource", {
            resource,
          });

          switch (resource.kind) {
            case EResourceKind.SUBNET: {
              const subnetSpec = (resource as Subnet).spec;

              const network = this.resolveReference<INetworkSpec>(
                subnetSpec.network,
                API_VERSION,
                EResourceKind.NETWORK,
                "network"
              );

              const signaler = this.resolveReference<ISignalerSpec>(
                network.spec.signaler,
                API_VERSION,
                EResourceKind.SIGNALER,
                "signaler"
              );
              const stunServers = network.spec.stunServers
                .map((label) =>
                  this.findResource<IStunServerSpec>(
                    label,
                    API_VERSION,
                    EResourceKind.STUNSERVER
                  )
                )
                .map((s) => ({
                  urls: s.spec.urls,
                }));
              const turnServers = network.spec.turnServers
                .map((label) =>
                  this.findResource<ITurnServerSpec>(
                    label,
                    API_VERSION,
                    EResourceKind.TURNSERVER
                  )
                )
                .map((s) => ({
                  urls: s.spec.urls,
                  username: s.spec.username,
                  credential: s.spec.credential,
                }));

              const iface = new NetworkInterface(
                {
                  iceServers: [...stunServers, ...turnServers],
                },
                signaler.spec.urls[0],
                signaler.spec.retryAfter,
                subnetSpec.prefix
              );

              this.setInstance<NetworkInterface>(
                resource.metadata.label,
                resource.apiVersion,
                EResourceKind.SUBNET,
                iface
              );

              (async () => {
                await iface.open();
              })();

              break;
            }

            case EResourceKind.REPOSITORY: {
              const repoSpec = (resource as Repository).spec;

              const trackers = repoSpec.trackers
                .map(
                  (label) =>
                    this.findResource<ITrackerSpec>(
                      label,
                      API_VERSION,
                      EResourceKind.TRACKER
                    ).spec.urls
                )
                .reduce((all, cur) => [...all, ...cur], []);

              const repo = new FileRepository(trackers);

              this.setInstance<FileRepository>(
                resource.metadata.label,
                resource.apiVersion,
                EResourceKind.REPOSITORY,
                repo
              );

              await repo.open();

              break;
            }

            case EResourceKind.FILE: {
              const fileSpec = (resource as File).spec;

              const repoRef = this.resolveReference<IRepositorySpec>(
                fileSpec.repository,
                API_VERSION,
                EResourceKind.REPOSITORY,
                "repository"
              );

              const repo = this.getInstance<FileRepository>(
                repoRef.metadata.label,
                repoRef.apiVersion,
                EResourceKind.REPOSITORY
              );

              const file = await repo.add(fileSpec.uri);

              this.setInstance<Uint8Array>(
                resource.metadata.label,
                resource.apiVersion,
                EResourceKind.FILE,
                file
              );

              break;
            }

            case EResourceKind.WORKLOAD: {
              const workloadSpec = (resource as Workload).spec;

              const file = this.getInstance<Uint8Array>(
                workloadSpec.file,
                API_VERSION,
                EResourceKind.FILE
              );

              const runtimeMetadata = this.resolveReference<IRuntimeSpec>(
                workloadSpec.runtime,
                API_VERSION,
                EResourceKind.RUNTIME,
                "runtime"
              ).metadata;
              const capabilities = workloadSpec.capabilities
                .map((label) =>
                  this.resolveReference<ICapabilitySpec>(
                    label,
                    API_VERSION,
                    EResourceKind.CAPABILITY,
                    "capabilites"
                  )
                )
                .map((c) => c.metadata.label); // TODO: Handle privileged capabilities
              const argumentsSpec = this.resolveReference<IArgumentsSpec>(
                workloadSpec.arguments,
                API_VERSION,
                EResourceKind.ARGUMENTS,
                "arguments"
              );

              const subnet = this.getInstance<NetworkInterface>(
                workloadSpec.subnet,
                API_VERSION,
                EResourceKind.SUBNET
              );

              const vm = new VirtualMachine();

              this.setInstance<VirtualMachine>(
                resource.metadata.label,
                resource.apiVersion,
                EResourceKind.WORKLOAD,
                vm
              );

              const { memoryId, imports } = await subnet.getImports();

              const { id, memory } = await vm.schedule(
                file,
                argumentsSpec.spec.argv,
                imports,
                {},
                (capabilities as unknown) as ECapabilities[], // TODO: Validate above
                (runtimeMetadata.label as unknown) as ERuntimes // TODO: Validate above
              );

              await subnet.setMemory(memoryId, memory);

              (async () => await vm.start(id))();

              break;
            }
          }
        }

        this.resources.push(resource);

        this.logger.verbose("Added resource", { resource });
      }
    }
  }

  async deleteResources(resources: IResource<any>[] | string) {
    this.logger.debug("Deleting resources", { resources });

    if (typeof resources === "string") {
      resources = yaml.safeLoadAll(resources) as IResource<any>[];
    }

    for (let resource of resources) {
      this.logger.silly("Deleting resource", { resource });

      if (!Object.values(EResourceKind).includes(resource.kind)) {
        throw new UnimplementedResourceError();
      }

      if (
        [
          EResourceKind.SUBNET,
          EResourceKind.REPOSITORY,
          EResourceKind.FILE,
          EResourceKind.WORKLOAD,
        ].includes(resource.kind)
      ) {
        this.logger.silly("Handling delete hooks for resource", { resource });

        switch (resource.kind) {
          case EResourceKind.SUBNET: {
            const subnet = this.getInstance<NetworkInterface>(
              resource.metadata.label,
              API_VERSION,
              EResourceKind.SUBNET
            );

            await subnet.close();

            this.deleteInstance(
              resource.metadata.label,
              API_VERSION,
              EResourceKind.SUBNET
            );

            break;
          }

          case EResourceKind.REPOSITORY: {
            const repo = this.getInstance<FileRepository>(
              resource.metadata.label,
              API_VERSION,
              EResourceKind.REPOSITORY
            );

            await repo.close();

            this.deleteInstance(
              resource.metadata.label,
              API_VERSION,
              EResourceKind.REPOSITORY
            );

            break;
          }

          case EResourceKind.FILE: {
            this.deleteInstance(
              resource.metadata.label,
              API_VERSION,
              EResourceKind.FILE
            );

            break;
          }

          case EResourceKind.WORKLOAD: {
            await this.onRestart();

            break;
          }
        }
      }

      this.resources.filter(
        (candidate) => !this.compareResources(candidate, resource)
      );

      this.logger.verbose("Deleted resource", { resource });
    }
  }

  private compareResources(actual: IResource<any>, expected: IResource<any>) {
    this.logger.silly("Comparing resources", { actual, expected });

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
    this.logger.silly("Finding resource", { label, apiVersion, kind });

    return this.resources.find((candidate) =>
      this.compareResources(candidate, {
        apiVersion,
        kind,
        metadata: {
          label,
        },
        spec: {},
      })
    ) as IResource<T>;
  }

  private setInstance<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind,
    instance: T
  ) {
    this.logger.silly("Setting instance", { label, apiVersion, kind });

    this.instances.set(this.getInstanceKey(apiVersion, kind, label), instance);
  }

  private getInstance<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind
  ) {
    this.logger.silly("Getting instance", { label, apiVersion, kind });

    if (this.instances.has(this.getInstanceKey(apiVersion, kind, label))) {
      return this.instances.get(
        this.getInstanceKey(apiVersion, kind, label)
      )! as T; // We check with .has
    } else {
      throw new InstanceDoesNotExistError();
    }
  }

  private deleteInstance(
    label: string,
    apiVersion: string,
    kind: EResourceKind
  ) {
    this.logger.silly("Deleting instance", { label, apiVersion, kind });

    if (this.instances.has(this.getInstanceKey(apiVersion, kind, label))) {
      this.instances.delete(this.getInstanceKey(apiVersion, kind, label)); // We check with .has
    } else {
      throw new InstanceDoesNotExistError();
    }
  }

  private resolveReference<T>(
    label: string,
    apiVersion: string,
    kind: EResourceKind,
    field: string
  ) {
    this.logger.silly("Resolving reference", { label, apiVersion, kind });

    const res = this.findResource<T>(label, apiVersion, kind);

    if (!res) {
      throw new InvalidReferenceError(label, apiVersion, kind, field);
    }

    return res;
  }

  private getInstanceKey(
    apiVersion: string,
    kind: EResourceKind,
    label: string
  ) {
    this.logger.silly("Getting instance key", { label, apiVersion, kind });

    return `apiVersion=${apiVersion} kind=${kind} label=${label}`;
  }
}
