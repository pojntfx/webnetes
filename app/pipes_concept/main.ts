import { PeerPipe, EPeerPipeResourceTypes } from "../../lib/pipes/peer-pipe";
import {
  ResourcePipe,
  EResourcePipeTypes,
} from "../../lib/pipes/resource-pipe";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = new ResourcePipe();
const peers = new PeerPipe();

(async () => {
  await Promise.all([
    resources.open({
      process: {
        writeToStdin: async (
          resourceId: string,
          msg: Uint8Array,
          nodeId: string
        ) => {
          console.log("process.stdin", resourceId, msg, nodeId);
        },
        readFromStdout: async () => {
          await new Promise((res) => setTimeout(res, 1000000));

          const resourceId = prompt("process.processId")!;
          const msg = prompt("process.stdout")!;
          const nodeId = prompt("process.nodeId")!;

          return { resourceId, msg: new TextEncoder().encode(msg), nodeId };
        },
      },
      terminal: {
        writeToStdout: async (
          resourceId: string,
          msg: Uint8Array,
          nodeId: string
        ) => {
          console.log("terminal.stdout", resourceId, msg, nodeId);
        },
        readFromStdin: async () => {
          await new Promise((res) => setTimeout(res, 2000000));

          const resourceId = prompt("terminal.processId")!;
          const msg = prompt("terminal.stdin")!;
          const nodeId = prompt("terminal.nodeId")!;

          return { resourceId, msg: new TextEncoder().encode(msg), nodeId };
        },
      },
      workload: {
        createWorkload: async (
          resourceId: string,
          msg: Uint8Array,
          nodeId: string
        ) => {
          console.log(
            "creating terminal and process, attaching process and terminal stdio for",
            resourceId,
            msg,
            nodeId
          );
        },
      },
    }),
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
            // try {
            await peers.write(
              EPeerPipeResourceTypes.STDOUT,
              resourceId,
              msg,
              nodeId // ID of node with process resource
            );

            // await resources.write(
            //   EResourcePipeTypes.PROCESS_RESOLVE,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with process resource
            // );
            // } catch (e) {
            // await resources.write(
            //   EResourcePipeTypes.PROCESS_REJECTION,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with process resource
            // );
            // }

            break;
          }

          case EResourcePipeTypes.TERMINAL: {
            // try {
            await peers.write(
              EPeerPipeResourceTypes.STDIN,
              resourceId,
              msg,
              nodeId // ID of node with terminal resource
            );

            // await resources.write(
            //   EResourcePipeTypes.TERMINAL_RESOLVE,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with terminal resource
            // );
            // } catch (e) {
            // await resources.write(
            //   EResourcePipeTypes.TERMINAL_REJECTION,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with terminal resource
            // );
            // }

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
            // try {
            await resources.write(
              EResourcePipeTypes.TERMINAL,
              resourceId,
              msg,
              nodeId // ID of node with stdout resource
            );

            // await peers.write(
            //   EPeerPipeResourceTypes.STDOUT_RESOLVE,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with stdout resource
            // );
            // } catch (e) {
            // await peers.write(
            //   EPeerPipeResourceTypes.STDOUT_REJECTION,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with stdout resource
            // );
            // }

            break;
          }

          case EPeerPipeResourceTypes.STDIN: {
            // try {
            await resources.write(
              EResourcePipeTypes.PROCESS,
              resourceId,
              msg,
              nodeId // ID of node with stdin resource
            );

            // await peers.write(
            //   EPeerPipeResourceTypes.STDIN_RESOLVE,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with stdout resource
            // );
            // } catch (e) {
            // await peers.write(
            //   EPeerPipeResourceTypes.STDOUT_REJECTION,
            //   resourceId,
            //   msg,
            //   nodeId // ID of node with stdout resource
            // );
            // }

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
})();
