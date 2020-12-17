import Emittery from "emittery";
import { PeerPipe, EPeerPipeResourceTypes } from "../../lib/pipes/peer-pipe";
import {
  ResourcePipe,
  EResourcePipeTypes,
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

  document
    .getElementById("create-process")
    ?.addEventListener("click", () =>
      peers.write(
        EPeerPipeResourceTypes.WORKLOAD,
        "testresource",
        new TextEncoder().encode("testmsg"),
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
