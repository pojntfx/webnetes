import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { EPeerPipeResourceTypes, PeerPipe } from "../../lib/pipes/peer-pipe";
import {
  EResourcePipeTypes,
  ResourcePipe,
} from "../../lib/pipes/resource-pipe";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new ResourcePipe();
const peers = new PeerPipe();

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
      "testresource",
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
          case EResourcePipeTypes.PROCESS: {
            await peers.write(
              EPeerPipeResourceTypes.STDOUT,
              resourceId,
              msg,
              nodeId // ID of node with process resource
            );

            break;
          }

          case EResourcePipeTypes.TERMINAL: {
            await peers.write(
              EPeerPipeResourceTypes.STDIN,
              resourceId,
              msg,
              nodeId // ID of node with terminal resource
            );

            break;
          }

          case EResourcePipeTypes.PROCESS_WRITE_TO_STDIN: {
            console.log("Writing to process stdin", {
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.TERMINAL_WRITE_TO_STDOUT: {
            console.log("Writing to terminal stdout", {
              resourceId,
              msg,
              nodeId,
            });

            break;
          }

          case EResourcePipeTypes.CREATE_WORKLOAD: {
            console.log("CREATE_WORKLOAD", {
              resourceId,
              msg,
              nodeId,
            });

            const { terminalHostNodeId } = JSON.parse(
              new TextDecoder().decode(new Uint8Array(Object.values(msg)))
            );

            await peers.write(
              EPeerPipeResourceTypes.INPUT_DEVICE,
              resourceId,
              new TextEncoder().encode(
                JSON.stringify({
                  processHostNodeId: nodeId,
                })
              ),
              terminalHostNodeId // ID of node with terminal resource
            );

            (async () => {
              setInterval(
                async () =>
                  await peers.write(
                    EPeerPipeResourceTypes.STDOUT,
                    resourceId,
                    new TextEncoder().encode("test process stdout"),
                    terminalHostNodeId
                  ),
                1000
              );
            })();

            break;
          }

          case EResourcePipeTypes.CREATE_INPUT_DEVICE: {
            console.log("CREATE_INPUT_DEVICE", {
              resourceId,
              msg,
              nodeId,
            });

            const { processHostNodeId } = JSON.parse(
              new TextDecoder().decode(new Uint8Array(Object.values(msg)))
            );

            const terminal = new Terminal();
            terminal.onData(
              async (key) =>
                await peers.write(
                  EPeerPipeResourceTypes.STDIN,
                  resourceId,
                  new TextEncoder().encode(key),
                  processHostNodeId
                )
            );

            terminal.open(document.getElementById("terminal")!);

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
              EResourcePipeTypes.TERMINAL,
              resourceId,
              msg,
              nodeId // ID of node with stdout resource
            );

            break;
          }

          case EPeerPipeResourceTypes.STDIN: {
            await resources.write(
              EResourcePipeTypes.PROCESS,
              resourceId,
              msg,
              nodeId // ID of node with stdin resource
            );

            break;
          }

          case EPeerPipeResourceTypes.WORKLOAD: {
            await resources.write(
              EResourcePipeTypes.WORKLOAD_INSTANCE,
              resourceId,
              msg,
              nodeId // ID of node with workload resource
            );

            break;
          }

          case EPeerPipeResourceTypes.INPUT_DEVICE: {
            await resources.write(
              EResourcePipeTypes.INPUT_DEVICE_INSTANCE,
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
