import { v4 } from "uuid";
import "xterm/css/xterm.css";
import { APIVersionNotImplementedError } from "../../lib/errors/apiversion-not-implemented";
import { ResourceNotImplementedError } from "../../lib/errors/resource-not-implemented";
import { EPeersResources, Peers } from "../../lib/pipes/peers";
import { EResourcesResources, Resources } from "../../lib/pipes/resources";
import { Processes } from "../../lib/repositories/processes";
import { Processors } from "../../lib/repositories/processors";
import { Terminals } from "../../lib/repositories/terminals";
import { Capability } from "../../lib/resources/capability";
import { Processor } from "../../lib/resources/processor";
import {
  API_VERSION,
  EResourceKind,
  IResource,
} from "../../lib/resources/resource";
import { Runtime } from "../../lib/resources/runtime";
import { ResourceTranscoder } from "../../lib/utils/resource-transcoder";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new Resources();
const peers = new Peers();

const terminalsRoot = document.getElementById("terminals")!;
const processesRoot = document.getElementById("processes")!;
const transcoder = new ResourceTranscoder();

const terminals = new Terminals();
const processes = new Processes();
const processors = new Processors();

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
          apiVersion: "webnetes.felix.pojtinger.com/v1alpha1",
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
          apiVersion: "webnetes.felix.pojtinger.com/v1alpha1",
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
          apiVersion: "webnetes.felix.pojtinger.com/v1alpha1",
          kind: "Processor",
          metadata: {
            name: "Felix's iPhone",
            label: "felixs_iphone",
          },
          spec: {
            runtimes: ["jssi_go"],
            capabilities: ["bind_alias"],
          },
        } as Processor),
        nodeId
      );

      // await peers.write(
      //   EPeersResources.WORKLOAD,
      //   prompt("resourceId")!,
      //   new TextEncoder().encode(
      //     JSON.stringify({
      //       terminalHostNodeId: prompt("terminalHostNodeId")!, // TODO: Make process a proper resource with this property
      //     })
      //   ),
      //   nodeId!
      // );
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
                nodeId // ID of node with process resource
              );

              break;
            }

            case EResourcesResources.TERMINAL: {
              await peers.write(
                EPeersResources.STDIN,
                resourceId,
                msg,
                nodeId // ID of node with terminal resource
              );

              break;
            }

            case EResourcesResources.PROCESS_STDIN: {
              (await processes.get(resourceId)).write(
                new Uint8Array(Object.values(msg))
              );

              break;
            }

            case EResourcesResources.TERMINAL_STDOUT: {
              (await terminals.get(resourceId)).write(
                new Uint8Array(Object.values(msg))
              );

              break;
            }

            case EResourcesResources.WORKLOAD_INSTANCE: {
              const { terminalHostNodeId } = JSON.parse(
                new TextDecoder().decode(new Uint8Array(Object.values(msg)))
              );

              await peers.write(
                EPeersResources.INPUT_DEVICE,
                resourceId,
                new Uint8Array(),
                terminalHostNodeId // ID of node with terminal resource
              );

              const process = await processes.create(async (key) => {
                process.write(key);

                await peers.write(
                  EPeersResources.STDOUT,
                  resourceId,
                  new TextEncoder().encode(key),
                  terminalHostNodeId
                );
              }, resourceId);

              const processesEl = document.createElement("div");
              processesRoot.appendChild(processesEl);

              process.open(processesEl);

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

                    case EPeersResources.WORKLOAD: {
                      return EResourcesResources.PROCESS_INSTANCE;
                    }

                    case EPeersResources.INPUT_DEVICE: {
                      return EResourcesResources.TERMINAL_INSTANCE;
                    }

                    case EPeersResources.MANAGEMENT_ENTITY: {
                      return EResourcesResources.MANAGEMENT_ENTITY_INSTANCE;
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
