import Emittery from "emittery";
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

const processIOBus = new Emittery();
const terminalIOBus = new Emittery();

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
        prefix: "127.0.5",
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
            await processIOBus.emit(
              "stdin",
              JSON.stringify({
                resourceId,
                msg,
                nodeId,
              })
            );

            break;
          }

          case EResourcePipeTypes.TERMINAL_WRITE_TO_STDOUT: {
            await terminalIOBus.emit(
              "stdout",
              JSON.stringify({
                resourceId,
                msg,
                nodeId,
              })
            );

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
              setInterval(() => {
                processIOBus.emit(
                  "stdout",
                  JSON.stringify({
                    resourceId,
                    msg: new TextEncoder().encode("test process stdout"),
                    terminalHostNodeId,
                  })
                );
              }, 1000);
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
            terminal.onData((key) =>
              terminalIOBus.emit(
                "stdin",
                JSON.stringify({
                  resourceId,
                  msg: new TextEncoder().encode(key),
                  processHostNodeId,
                })
              )
            );

            terminalIOBus.on("stdout", (rawMessage) => {
              const {
                resourceId: receivedResourceId,
                msg: receivedMsg,
                nodeId: receivedNodeId,
              } = JSON.parse(rawMessage as string);

              if (
                resourceId === receivedResourceId &&
                nodeId === receivedNodeId
              ) {
                terminal.write(receivedMsg);
              }
            });

            processIOBus.on("stdin", (rawMessage) => {
              const {
                resourceId: receivedResourceId,
                msg: receivedMsg,
                nodeId: receivedNodeId,
              } = JSON.parse(rawMessage as string);

              if (
                resourceId === receivedResourceId &&
                nodeId === receivedNodeId
              ) {
                terminal.write(receivedMsg);
              }
            });

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

  processIOBus.on("stdout", async (rawMessage) => {
    const { resourceId, msg, nodeId } = JSON.parse(rawMessage as string);

    await resources.write(
      EResourcePipeTypes.PROCESS_READ_FROM_STDOUT,
      resourceId,
      msg,
      nodeId
    );
  });

  terminalIOBus.on("stdin", async (rawMessage) => {
    const { resourceId, msg, nodeId } = JSON.parse(rawMessage as string);

    await resources.write(
      EResourcePipeTypes.TERMINAL_READ_FROM_STDIN,
      resourceId,
      msg,
      nodeId
    );
  });
})();
