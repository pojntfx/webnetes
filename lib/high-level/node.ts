import yaml from "js-yaml";
import { APIVersionNotImplementedError } from "../errors/apiversion-not-implemented";
import { ConfigMissingError } from "../errors/config-missing";
import { ResourceNotImplementedError } from "../errors/resource-not-implemented";
import { EPeersResources, Peers } from "../pipes/peers";
import { EResourcesResources, Resources } from "../pipes/resources";
import { Files } from "../repositories/files";
import { Processors } from "../repositories/processors";
import { Subnets } from "../repositories/subnets";
import { Workloads } from "../repositories/workloads";
import { API_VERSION, EResourceKind, IResource } from "../resources/resource";
import { Signaler } from "../resources/signaler";
import { StunServer } from "../resources/stunserver";
import { Subnet } from "../resources/subnet";
import { TurnServer } from "../resources/turnserver";
import { ResourceTranscoder } from "../utils/resource-transcoder";

export type TNodeConfiguration = (
  | Signaler
  | StunServer
  | TurnServer
  | Subnet
)[];

export class Node {
  private resources?: Resources;
  private peers?: Peers;

  constructor(
    private onCreateResource: (resource: IResource<any>) => Promise<void>,
    private onDeleteResource: (resource: IResource<any>) => Promise<void>,

    private onTerminalCreate: (
      onStdin: (key: string) => Promise<void>,
      id: string
    ) => Promise<void>,
    private onTerminalWriteToStdout: (id: string, msg: string) => Promise<void>,
    private onTerminalWriteToStdin: (
      resourceId: string,
      data: string | Uint8Array
    ) => Promise<void>,
    private onTerminalDelete: (id: string) => Promise<void>
  ) {}

  async open(resources: string | TNodeConfiguration) {
    if (typeof resources === "string") {
      resources = yaml.safeLoad(resources) as TNodeConfiguration;
    }

    const stunServers = resources
      .filter(
        (candidate) =>
          candidate.apiVersion === API_VERSION &&
          candidate.kind === EResourceKind.STUNSERVER
      )
      .map((stunServer) => ({ urls: (stunServer as StunServer).spec.urls }));
    const turnServers = resources
      .filter(
        (candidate) =>
          candidate.apiVersion === API_VERSION &&
          candidate.kind === EResourceKind.TURNSERVER
      )
      .map((turnServer) => ({
        urls: (turnServer as TurnServer).spec.urls,
        username: (turnServer as TurnServer).spec.username,
        credential: (turnServer as TurnServer).spec.credential,
      }));
    const signaler = resources.find(
      (candidate) =>
        candidate.apiVersion === API_VERSION &&
        candidate.kind === EResourceKind.SIGNALER
    ) as Signaler;
    const subnet = resources.find(
      (candidate) =>
        candidate.apiVersion === API_VERSION &&
        candidate.kind === EResourceKind.SUBNET
    ) as Subnet;

    if (!stunServers && !turnServers)
      throw new ConfigMissingError("STUN server or TURN server");
    if (!signaler) throw new ConfigMissingError("signaler");
    if (!subnet) throw new ConfigMissingError("subnet");

    const resourcesPipe = new Resources();
    const peers = new Peers();

    const transcoder = new ResourceTranscoder();
    const processors = new Processors();
    const subnets = new Subnets();
    const files = new Files(
      async (label: string) => await subnets.getStunServer(label),
      async (label: string) => await subnets.getTurnServer(label)
    );
    const workloads = new Workloads(
      async (label: string) => await files.getFile(label),
      async (label: string) => (await files.getFileInstance(label)).instance,
      async (label: string) => await processors.getRuntime(label),
      async (label: string) => await processors.getCapability(label),
      async (label: string) => await subnets.getSubnet(label),
      async (label: string) => (await subnets.getSubnetInstance(label)).instance
    );

    await Promise.all([
      resourcesPipe.open({}),
      peers.open({
        transporter: {
          iceServers: [...stunServers, ...turnServers],
        },
        signaler: {
          url: signaler.spec.urls[0],
          retryAfter: signaler.spec.retryAfter,
          prefix: subnet.spec.prefix,
        },
      }),
    ]);

    this.resources = resourcesPipe;
    this.peers = peers;

    await Promise.all([
      (async () => {
        try {
          while (true) {
            const {
              resourceType,
              resourceId,
              msg,
              nodeId,
            } = await resourcesPipe.read();

            switch (resourceType) {
              case EResourcesResources.PROCESS: {
                await peers.write(
                  EPeersResources.STDOUT,
                  resourceId,
                  msg,
                  nodeId
                );

                break;
              }

              case EResourcesResources.TERMINAL: {
                await peers.write(
                  EPeersResources.STDIN,
                  resourceId,
                  msg,
                  nodeId
                );

                break;
              }

              case EResourcesResources.PROCESS_STDIN: {
                await workloads.writeToStdin(
                  resourceId,
                  new Uint8Array(Object.values(msg))
                );

                break;
              }

              case EResourcesResources.TERMINAL_STDOUT: {
                await this.onTerminalWriteToStdout(
                  resourceId,
                  new TextDecoder().decode(new Uint8Array(Object.values(msg)))
                );

                break;
              }

              case EResourcesResources.INPUT_DEVICE_INSTANCE: {
                await this.onTerminalCreate(async (key) => {
                  await this.onTerminalWriteToStdin(resourceId, key);

                  await peers.write(
                    EPeersResources.STDIN,
                    resourceId,
                    new TextEncoder().encode(key),
                    nodeId
                  );
                }, resourceId);

                break;
              }

              case EResourcesResources.INPUT_DEVICE_INSTANCE_DELETION: {
                await this.onTerminalDelete(resourceId);

                break;
              }

              // case EResourcesResources.WEBNETES_ENTITY: {
              //   const resource = transcoder.decode<IResource<any>>(
              //     new Uint8Array(Object.values(msg))
              //   );

              //   if (resource.apiVersion === API_VERSION) {
              //     switch (resource.kind) {
              //       case EResourceKind.RUNTIME: {
              //         const { metadata, spec } = resource as Runtime;

              //         await processors.createRuntime(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Runtime>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.CAPABILITY: {
              //         const { metadata, spec } = resource as Capability;

              //         await processors.createCapability(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Capability>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.PROCESSOR: {
              //         const { metadata, spec } = resource as Processor;

              //         await processors.createProcessor(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Processor>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.STUNSERVER: {
              //         const { metadata, spec } = resource as StunServer;

              //         await subnets.createStunServer(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<StunServer>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.TURNSERVER: {
              //         const { metadata, spec } = resource as TurnServer;

              //         await subnets.createTurnServer(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<TurnServer>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.SIGNALER: {
              //         const { metadata, spec } = resource as Signaler;

              //         await subnets.createSignaler(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Signaler>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.NETWORK: {
              //         const { metadata, spec } = resource as Network;

              //         await subnets.createNetwork(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Network>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.SUBNET: {
              //         const { metadata, spec } = resource as Subnet;

              //         await subnets.createSubnet(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Subnet>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.TRACKER: {
              //         const { metadata, spec } = resource as Tracker;

              //         await files.createTracker(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Tracker>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.REPOSITORY: {
              //         const { metadata, spec } = resource as Repository;

              //         await files.createRepository(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Repository>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.FILE: {
              //         const { metadata, spec } = resource as File;

              //         await files.createFile(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<File>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.ARGUMENTS: {
              //         const { metadata, spec } = resource as Arguments;

              //         await workloads.createArguments(metadata, spec);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Arguments>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.WORKLOAD: {
              //         const { metadata, spec } = resource as Workload;

              //         await workloads.createWorkload(
              //           metadata,
              //           spec,
              //           async (msg: Uint8Array) => {
              //             await peers.write(
              //               EPeersResources.STDOUT,
              //               spec.terminalLabel,
              //               msg,
              //               spec.terminalHostNodeId
              //             );
              //           }
              //         );

              //         await peers.write(
              //           EPeersResources.INPUT_DEVICE,
              //           spec.terminalLabel,
              //           new Uint8Array(),
              //           spec.terminalHostNodeId
              //         );

              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Workload>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       default: {
              //         throw new ResourceNotImplementedError(resource.kind);
              //       }
              //     }
              //   } else {
              //     throw new APIVersionNotImplementedError(
              //       resource.apiVersion
              //     );
              //   }

              //   break;
              // }

              // case EResourcesResources.WEBNETES_ENTITY_DELETION: {
              //   const resource = transcoder.decode<IResource<any>>(
              //     new Uint8Array(Object.values(msg))
              //   );

              //   if (resource.apiVersion === API_VERSION) {
              //     switch (resource.kind) {
              //       case EResourceKind.RUNTIME: {
              //         const { metadata } = resource as Runtime;

              //         await processors.deleteRuntime(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Runtime>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.CAPABILITY: {
              //         const { metadata } = resource as Capability;

              //         await processors.deleteCapability(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Capability>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.PROCESSOR: {
              //         const { metadata } = resource as Processor;

              //         await processors.deleteProcessor(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Processor>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.STUNSERVER: {
              //         const { metadata } = resource as StunServer;

              //         await subnets.deleteStunServer(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<StunServer>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.TURNSERVER: {
              //         const { metadata } = resource as TurnServer;

              //         await subnets.deleteTurnServer(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<TurnServer>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.SIGNALER: {
              //         const { metadata } = resource as Signaler;

              //         await subnets.deleteSignaler(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Signaler>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.NETWORK: {
              //         const { metadata } = resource as Network;

              //         await subnets.deleteNetwork(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Network>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.SUBNET: {
              //         const { metadata } = resource as Subnet;

              //         await subnets.deleteSubnet(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Subnet>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.TRACKER: {
              //         const { metadata } = resource as Tracker;

              //         await files.deleteTracker(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Tracker>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.REPOSITORY: {
              //         const { metadata } = resource as Repository;

              //         await files.deleteRepository(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Repository>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.FILE: {
              //         const { metadata } = resource as File;

              //         await files.deleteFile(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<File>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.ARGUMENTS: {
              //         const { metadata } = resource as Arguments;

              //         await workloads.deleteArguments(metadata);
              //         await peers.write(
              //           EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //           resourceId,
              //           transcoder.encode<Arguments>(resource),
              //           nodeId
              //         );

              //         break;
              //       }

              //       case EResourceKind.WORKLOAD: {
              //         const { metadata, spec } = resource as Workload;

              //         await workloads.deleteWorkload(metadata, async () => {
              //           await peers.write(
              //             EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
              //             resourceId,
              //             transcoder.encode<Workload>(resource),
              //             nodeId
              //           );

              //           await peers.write(
              //             EPeersResources.INPUT_DEVICE_DELETION,
              //             spec.terminalLabel,
              //             new Uint8Array(),
              //             spec.terminalHostNodeId
              //           );

              //           setTimeout(() => window.location.reload(), 1000); // We can't manually stop WASM binaries, so we have to "restart" the node here
              //         });

              //         break;
              //       }

              //       default: {
              //         throw new ResourceNotImplementedError(resource.kind);
              //       }
              //     }
              //   } else {
              //     throw new APIVersionNotImplementedError(
              //       resource.apiVersion
              //     );
              //   }

              //   break;
              // }

              default: {
                throw new ResourceNotImplementedError(resourceType);
              }
            }
          }
        } catch (e) {
          throw e;
        } finally {
          await resourcesPipe.close();
        }
      })(),

      // (async () => {
      //   try {
      //     while (true) {
      //       const {
      //         resourceType,
      //         resourceId,
      //         msg,
      //         nodeId,
      //       } = await peers.read();

      //       switch (resourceType) {
      //         case EPeersResources.MANAGEMENT_ENTITY_CONFIRM: {
      //           // Changed; resolves & rejections could be handled here

      //           break;
      //         }

      //         default: {
      //           await resources.write(
      //             (() => {
      //               switch (resourceType) {
      //                 case EPeersResources.STDOUT: {
      //                   return EResourcesResources.TERMINAL;
      //                 }

      //                 case EPeersResources.STDIN: {
      //                   return EResourcesResources.PROCESS;
      //                 }

      //                 case EPeersResources.INPUT_DEVICE: {
      //                   return EResourcesResources.TERMINAL_INSTANCE;
      //                 }

      //                 case EPeersResources.INPUT_DEVICE_DELETION: {
      //                   return EResourcesResources.TERMINAL_INSTANCE_DELETION;
      //                 }

      //                 case EPeersResources.MANAGEMENT_ENTITY: {
      //                   return EResourcesResources.MANAGEMENT_ENTITY_INSTANCE;
      //                 }

      //                 case EPeersResources.MANAGEMENT_ENTITY_DELETION: {
      //                   return EResourcesResources.MANAGEMENT_ENTITY_INSTANCE_DELETION;
      //                 }

      //                 default: {
      //                   throw new ResourceNotImplementedError(resourceType);
      //                 }
      //               }
      //             })(),
      //             resourceId,
      //             msg,
      //             nodeId
      //           );
      //         }
      //       }
      //     }
      //   } catch (e) {
      //     throw e;
      //   } finally {
      //     await peers.close();
      //   }
      // })(),
    ]);
  }

  async close() {}

  async seedFile(
    label: string,
    name: string,
    repository: string,
    fileInstance: Uint8Array
  ) {}

  async createResource(resources: string | IResource<any>[]) {}

  async deleteResource(resources: string | IResource<any>[]) {}
}
