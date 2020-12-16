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
        writeToStdin: async (msg: Uint8Array, processId: string) => {
          console.log("process.stdin", processId, msg);
        },
        readFromStdout: async () => {
          const msg = prompt("process.stdout")!;
          const processId = prompt("process.processId")!;

          return { msg: new TextEncoder().encode(msg), processId };
        },
      },
      terminal: {
        writeToStdout: async (msg: Uint8Array, processId: string) => {
          console.log("terminal.stdout", processId, msg);
        },
        readFromStdin: async () => {
          const msg = prompt("terminal.stdin")!;
          const processId = prompt("terminal.processId")!;

          return { msg: new TextEncoder().encode(msg), processId };
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
