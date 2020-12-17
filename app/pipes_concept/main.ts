import "xterm/css/xterm.css";
import { EPeersResources, Peers } from "../../lib/pipes/peers";
import { EResourcesResources, Resources } from "../../lib/pipes/resources";
import { Processes } from "../../lib/repositories/processes";
import { Terminals } from "../../lib/repositories/terminals";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new Resources();
const peers = new Peers();

const terminals = new Terminals();
const processes = new Processes();

const terminalsRoot = document.getElementById("terminals")!;
const processesRoot = document.getElementById("processes")!;

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

  document.getElementById("create-workload")?.addEventListener("click", () =>
    peers.write(
      EPeersResources.WORKLOAD,
      prompt("resourceId")!,
      new TextEncoder().encode(
        JSON.stringify({
          terminalHostNodeId: prompt("terminalHostNodeId")!,
        })
      ),
      prompt("nodeId")!
    )
  );

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

            case EResourcesResources.VMRUNTIME: {
              console.log("Creating VMRuntime");

              break;
            }

            default: {
              throw new UnknownResourceError(resourceType);
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

                case EPeersResources.RUNTIME: {
                  return EResourcesResources.RUNTIME_INSTANCE;
                }

                default: {
                  throw new UnknownResourceError(resourceType);
                }
              }
            })(),
            resourceId,
            msg,
            nodeId
          );
        }
      } catch (e) {
        throw e;
      } finally {
        await peers.close();
      }
    })(),
  ]);
})();
