import { v4 } from "uuid";
import "xterm/css/xterm.css";
import { APIVersionNotImplementedError } from "../../lib/errors/apiversion-not-implemented";
import { ResourceNotImplementedError } from "../../lib/errors/resource-not-implemented";
import { EPeersResources, Peers } from "../../lib/pipes/peers";
import { EResourcesResources, Resources } from "../../lib/pipes/resources";
import { Files } from "../../lib/repositories/files";
import { Processors } from "../../lib/repositories/processors";
import { Subnets } from "../../lib/repositories/subnets";
import { Terminals } from "../../lib/repositories/terminals";
import { Workloads } from "../../lib/repositories/workloads";
import { Arguments } from "../../lib/resources/arguments";
import { Capability } from "../../lib/resources/capability";
import { File } from "../../lib/resources/file";
import { Network } from "../../lib/resources/network";
import { Processor } from "../../lib/resources/processor";
import { Repository } from "../../lib/resources/repository";
import {
  API_VERSION,
  EResourceKind,
  IResource,
} from "../../lib/resources/resource";
import { Runtime } from "../../lib/resources/runtime";
import { Signaler } from "../../lib/resources/signaler";
import { StunServer } from "../../lib/resources/stunserver";
import { Subnet } from "../../lib/resources/subnet";
import { Tracker } from "../../lib/resources/tracker";
import { TurnServer } from "../../lib/resources/turnserver";
import { Workload } from "../../lib/resources/workload";
import { ResourceTranscoder } from "../../lib/utils/resource-transcoder";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new Resources();
const peers = new Peers();

const terminalsRoot = document.getElementById("terminals")!;
const transcoder = new ResourceTranscoder();

const terminals = new Terminals();
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

(async () => {
  await Promise.all([
    resources.open({}),
    peers.open({
      transporter: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },
      signaler: {
        url: "wss://unisockets.herokuapp.com",
        retryAfter: 1000,
        prefix: "127.0.6",
      },
    }),
  ]);

  document
    .getElementById("create-server-resources")
    ?.addEventListener("click", async () => {
      const nodeId = prompt("nodeId")!;

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Runtime>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Runtime",
          metadata: {
            name: "Go JSSI",
            label: "jssi_go",
          },
          spec: {},
        } as Runtime),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Capability>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Capability",
          metadata: {
            name: "Binding aliases",
            label: "bind_alias",
          },
          spec: {
            privileged: true,
          },
        } as Capability),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Processor>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Processor",
          metadata: {
            name: "Felicitas's iPhone",
            label: "felicitass_iphone",
          },
          spec: {
            runtimes: ["jssi_go"],
            capabilities: ["bind_alias"],
          },
        } as Processor),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<StunServer>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "StunServer",
          metadata: {
            name: "Google STUN Server",
            label: "google",
          },
          spec: {
            urls: ["stun:stun.l.google.com:19302"],
          },
        } as StunServer),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<TurnServer>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "TurnServer",
          metadata: {
            name: "Twillio TURN Server (UDP)",
            label: "twillio_udp",
          },
          spec: {
            urls: ["turn:global.turn.twilio.com:3478?transport=tcp"],
            username:
              "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
            credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
          },
        } as TurnServer),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Signaler>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Signaler",
          metadata: {
            name: "Public unisockets Signaling Server",
            label: "unisockets_public",
          },
          spec: {
            urls: ["wss://unisockets.herokuapp.com"],
            retryAfter: 1000,
          },
        } as Signaler),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Network>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Network",
          metadata: {
            name: "Public unisockets network",
            label: "unisockets_public",
          },
          spec: {
            signaler: "unisockets_public",
            stunServers: ["google"],
            turnServers: ["twillio_udp"],
          },
        } as Network),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Subnet>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Subnet",
          metadata: {
            name: "Echo Network",
            label: "echo_network",
          },
          spec: {
            network: "unisockets_public",
            prefix: "127.0.0",
          },
        } as Subnet),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Tracker>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Tracker",
          metadata: {
            name: "OpenWebTorrent",
            label: "openwebtorrent",
          },
          spec: {
            urls: ["wss://tracker.openwebtorrent.com"],
          },
        } as Tracker),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Tracker>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Tracker",
          metadata: {
            name: "Fastcast",
            label: "fastcast",
          },
          spec: {
            urls: ["wss://tracker.fastcast.nz"],
          },
        } as Tracker),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Repository>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Repository",
          metadata: {
            name: "Public WebTorrent",
            label: "webtorrent_public",
          },
          spec: {
            trackers: ["openwebtorrent", "fastcast"],
            stunServers: ["google"],
            turnServers: ["twillio_udp"],
          },
        } as Repository),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<File>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "File",
          metadata: {
            name: "Go Echo Server Binary",
            label: "go_echo_server",
          },
          spec: {
            repository: "webtorrent_public",
            uri:
              "magnet:?xt=urn:btih:6891bba71f536bf8e80796cc3f6e4f99bc49faa9&dn=echo_server.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
          },
        } as File),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Arguments>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Arguments",
          metadata: {
            name: "Echo Server Configuration",
            label: "echo_server",
          },
          spec: {
            argv: ["-laddr", "127.0.0.1:1234"],
          },
        } as Arguments),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY,
        v4(),
        transcoder.encode<Workload>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Workload",
          metadata: {
            name: "Go Echo Server",
            label: "go_echo_server",
          },
          spec: {
            file: "go_echo_server",
            runtime: "jssi_go",
            capabilities: ["bind_alias"],
            subnet: "echo_network",
            arguments: "echo_server",
            terminalHostNodeId: prompt("terminalHostNodeId")!,
          },
        } as Workload),
        nodeId
      );

      await peers.write(
        EPeersResources.MANAGEMENT_ENTITY_DELETION,
        v4(),
        transcoder.encode<Runtime>({
          apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
          kind: "Runtime",
          metadata: {
            label: "jssi_go",
          },
          spec: {},
        } as Runtime),
        nodeId
      );
    });

  await Promise.all([
    (async () => {
      try {
        while (true) {
          const {
            resourceType,
            resourceId,
            msg,
            nodeId,
          } = await resources.read();

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
              await peers.write(EPeersResources.STDIN, resourceId, msg, nodeId);

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
              await terminals.writeToStdout(
                resourceId,
                new TextDecoder().decode(new Uint8Array(Object.values(msg)))
              );

              break;
            }

            case EResourcesResources.INPUT_DEVICE_INSTANCE: {
              const terminal = await terminals.create(async (key) => {
                terminal.write(key);

                await peers.write(
                  EPeersResources.STDIN,
                  resourceId,
                  new TextEncoder().encode(key),
                  nodeId
                );
              }, resourceId);

              const terminalEl = document.createElement("div");
              terminalsRoot.appendChild(terminalEl);

              terminal.open(terminalEl);

              break;
            }

            case EResourcesResources.WEBNETES_ENTITY: {
              const resource = transcoder.decode<IResource<any>>(
                new Uint8Array(Object.values(msg))
              );

              if (resource.apiVersion === API_VERSION) {
                switch (resource.kind) {
                  case EResourceKind.RUNTIME: {
                    const { metadata, spec } = resource as Runtime;

                    await processors.createRuntime(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Runtime>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.CAPABILITY: {
                    const { metadata, spec } = resource as Capability;

                    await processors.createCapability(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Capability>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.PROCESSOR: {
                    const { metadata, spec } = resource as Processor;

                    await processors.createProcessor(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Processor>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.STUNSERVER: {
                    const { metadata, spec } = resource as StunServer;

                    await subnets.createStunServer(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<StunServer>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.TURNSERVER: {
                    const { metadata, spec } = resource as TurnServer;

                    await subnets.createTurnServer(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<TurnServer>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.SIGNALER: {
                    const { metadata, spec } = resource as Signaler;

                    await subnets.createSignaler(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Signaler>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.NETWORK: {
                    const { metadata, spec } = resource as Network;

                    await subnets.createNetwork(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Network>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.SUBNET: {
                    const { metadata, spec } = resource as Subnet;

                    await subnets.createSubnet(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Subnet>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.TRACKER: {
                    const { metadata, spec } = resource as Tracker;

                    await files.createTracker(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Tracker>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.REPOSITORY: {
                    const { metadata, spec } = resource as Repository;

                    await files.createRepository(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Repository>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.FILE: {
                    const { metadata, spec } = resource as File;

                    await files.createFile(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<File>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.ARGUMENTS: {
                    const { metadata, spec } = resource as Arguments;

                    await workloads.createArguments(metadata, spec);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Arguments>(resource),
                      nodeId
                    );

                    break;
                  }

                  case EResourceKind.WORKLOAD: {
                    const { metadata, spec } = resource as Workload;

                    await workloads.createWorkload(
                      metadata,
                      spec,
                      async (msg: Uint8Array) => {
                        await peers.write(
                          EPeersResources.STDOUT,
                          resourceId,
                          msg,
                          spec.terminalHostNodeId
                        );
                      }
                    );

                    await peers.write(
                      EPeersResources.INPUT_DEVICE,
                      resourceId,
                      new Uint8Array(),
                      spec.terminalHostNodeId
                    );

                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Workload>(resource),
                      nodeId
                    );

                    break;
                  }

                  default: {
                    throw new ResourceNotImplementedError(resource.kind);
                  }
                }
              } else {
                throw new APIVersionNotImplementedError(resource.apiVersion);
              }

              break;
            }

            case EResourcesResources.WEBNETES_ENTITY_DELETION: {
              const resource = transcoder.decode<IResource<any>>(
                new Uint8Array(Object.values(msg))
              );

              if (resource.apiVersion === API_VERSION) {
                switch (resource.kind) {
                  case EResourceKind.RUNTIME: {
                    const { metadata } = resource as Runtime;

                    await processors.deleteRuntime(metadata);
                    await peers.write(
                      EPeersResources.MANAGEMENT_ENTITY_CONFIRM,
                      resourceId,
                      transcoder.encode<Runtime>(resource),
                      nodeId
                    );

                    break;
                  }
                  default: {
                    throw new ResourceNotImplementedError(resource.kind);
                  }
                }
              } else {
                throw new APIVersionNotImplementedError(resource.apiVersion);
              }

              break;
            }

            default: {
              throw new ResourceNotImplementedError(resourceType);
            }
          }
        }
      } catch (e) {
        throw e;
      } finally {
        await resources.close();
      }
    })(),

    (async () => {
      try {
        while (true) {
          const { resourceType, resourceId, msg, nodeId } = await peers.read();

          switch (resourceType) {
            case EPeersResources.MANAGEMENT_ENTITY_CONFIRM: {
              // Changed; resolves & rejections could be handled here

              break;
            }

            default: {
              await resources.write(
                (() => {
                  switch (resourceType) {
                    case EPeersResources.STDOUT: {
                      return EResourcesResources.TERMINAL;
                    }

                    case EPeersResources.STDIN: {
                      return EResourcesResources.PROCESS;
                    }

                    case EPeersResources.INPUT_DEVICE: {
                      return EResourcesResources.TERMINAL_INSTANCE;
                    }

                    case EPeersResources.MANAGEMENT_ENTITY: {
                      return EResourcesResources.MANAGEMENT_ENTITY_INSTANCE;
                    }

                    case EPeersResources.MANAGEMENT_ENTITY_DELETION: {
                      return EResourcesResources.MANAGEMENT_ENTITY_INSTANCE_DELETION;
                    }

                    default: {
                      throw new ResourceNotImplementedError(resourceType);
                    }
                  }
                })(),
                resourceId,
                msg,
                nodeId
              );
            }
          }
        }
      } catch (e) {
        throw e;
      } finally {
        await peers.close();
      }
    })(),
  ]);
})();
