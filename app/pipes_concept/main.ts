import "xterm/css/xterm.css";
import { Processes } from "../../lib/input-devices/processes";
import { Terminals } from "../../lib/input-devices/terminals";
import { EPeerPipeResourceTypes, PeerPipe } from "../../lib/pipes/peer-pipe";
import {
  EResourcePipeResources,
  ResourcePipe,
} from "../../lib/pipes/resource-pipe";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new ResourcePipe();
const peers = new PeerPipe();
const terminals = new Terminals();
const processes = new Processes();

const terminalRoot = document.getElementById("terminals")!;
const processRoot = document.getElementById("processes")!;

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

  document.getElementById("create-process")?.addEventListener("click", () =>
    peers.write(
      EPeerPipeResourceTypes.WORKLOAD,
      prompt("resourceId")!,
      new TextEncoder().encode(
        JSON.stringify({
          terminalHostNodeId: prompt("terminalHostNodeId")!,
        })
      ),
      prompt("nodeId")!
    )
  );

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
          case EResourcePipeResources.PROCESS: {
            await peers.write(
              EPeerPipeResourceTypes.STDOUT,
              resourceId,
              msg,
              nodeId // ID of node with process resource
            );

            break;
          }

          case EResourcePipeResources.TERMINAL: {
            await peers.write(
              EPeerPipeResourceTypes.STDIN,
              resourceId,
              msg,
              nodeId // ID of node with terminal resource
            );

            break;
          }

          case EResourcePipeResources.PROCESS_STDIN: {
            (await processes.get(resourceId)).write(
              new Uint8Array(Object.values(msg))
            );

            break;
          }

          case EResourcePipeResources.TERMINAL_STDOUT: {
            (await terminals.get(resourceId)).write(
              new Uint8Array(Object.values(msg))
            );

            break;
          }

          case EResourcePipeResources.WORKLOAD_INSTANCE: {
            const { terminalHostNodeId } = JSON.parse(
              new TextDecoder().decode(new Uint8Array(Object.values(msg)))
            );

            await peers.write(
              EPeerPipeResourceTypes.INPUT_DEVICE,
              resourceId,
              new Uint8Array(),
              terminalHostNodeId // ID of node with terminal resource
            );

            const process = await processes.create(async (key) => {
              process.write(key);

              await peers.write(
                EPeerPipeResourceTypes.STDOUT,
                resourceId,
                new TextEncoder().encode(key),
                terminalHostNodeId
              );
            }, resourceId);

            const processesEl = document.createElement("div");
            processRoot.appendChild(processesEl);

            process.open(processesEl);

            break;
          }

          case EResourcePipeResources.INPUT_DEVICE_INSTANCE: {
            const terminal = await terminals.create(async (key) => {
              terminal.write(key);

              await peers.write(
                EPeerPipeResourceTypes.STDIN,
                resourceId,
                new TextEncoder().encode(key),
                nodeId
              );
            }, resourceId);

            const terminalEl = document.createElement("div");
            terminalRoot.appendChild(terminalEl);

            terminal.open(terminalEl);

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
  })();

  (async () => {
    try {
      while (true) {
        const { resourceType, resourceId, msg, nodeId } = await peers.read();

        switch (resourceType) {
          case EPeerPipeResourceTypes.STDOUT: {
            await resources.write(
              EResourcePipeResources.TERMINAL,
              resourceId,
              msg,
              nodeId // ID of node with stdout resource
            );

            break;
          }

          case EPeerPipeResourceTypes.STDIN: {
            await resources.write(
              EResourcePipeResources.PROCESS,
              resourceId,
              msg,
              nodeId // ID of node with stdin resource
            );

            break;
          }

          case EPeerPipeResourceTypes.WORKLOAD: {
            await resources.write(
              EResourcePipeResources.PROCESS_INSTANCE,
              resourceId,
              msg,
              nodeId // ID of node with workload resource
            );

            break;
          }

          case EPeerPipeResourceTypes.INPUT_DEVICE: {
            await resources.write(
              EResourcePipeResources.TERMINAL_INSTANCE,
              resourceId,
              msg,
              nodeId // ID of node with input device resource
            );

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
      await peers.close();
    }
  })();
})();
