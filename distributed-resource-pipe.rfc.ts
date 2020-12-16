interface IDistributedResourcePipe<C, T> {
  open: (config: C) => Promise<void>;
  close: () => Promise<void>;
  read: () => Promise<{
    resourceType: T;
    resourceId: string;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write: (
    resourceType: T,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) => Promise<void>;
}

class UnknownResourceError extends Error {
  constructor(resourceType: string) {
    super(`resource ${resourceType} is not known`);
  }
}

enum EResourcePipeResourceTypes {
  PROCESS = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/process", // Writing to the process resource -> write to process.stdin, reading from the resource -> reading from process.stdout
  PROCESS_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processResolve",
  PROCESS_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/processRejection",
  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminal", // Writing to the terminal resource -> write to xterm.stdout, reading from the resource -> reading from xterm.stdin
  TERMINAL_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalResolve",
  TERMINAL_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminalRejection",
}

enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdout", // Writing to the stdout resource -> send over WebRTC, reading from the stdout resource -> receive from WebRTC
  STDOUT_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutResolve",
  STDOUT_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutRejection",
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdin", // Writing to the stdin resource -> send over WebRTC, reading from the stdin resource -> receive from WebRTC
  STDIN_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinResolve",
  STDIN_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinRejection",
}

class ResourcePipe
  implements IDistributedResourcePipe<{}, EResourcePipeResourceTypes> {
  open!: (config: {}) => Promise<void>;
  close!: () => Promise<void>;
  read!: () => Promise<{
    resourceType: EResourcePipeResourceTypes;
    resourceId: string;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EResourcePipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) => Promise<void>;
}

class PeerPipe implements IDistributedResourcePipe<{}, EPeerPipeResourceTypes> {
  open!: (config: {}) => Promise<void>;
  close!: () => Promise<void>;
  read!: () => Promise<{
    resourceType: EPeerPipeResourceTypes;
    resourceId: string;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) => Promise<void>;
}

const resources = new ResourcePipe();
const peers = new PeerPipe();

async () => {
  await Promise.all([resources.open({}), peers.open({})]);

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
          case EResourcePipeResourceTypes.PROCESS: {
            try {
              await peers.write(
                EPeerPipeResourceTypes.STDOUT,
                resourceId,
                msg,
                nodeId // ID of node with process resource
              );

              await resources.write(
                resourceType,
                resourceId,
                msg,
                nodeId // ID of node with process resource
              );
            } catch (e) {
              await resources.write(
                resourceType,
                resourceId,
                msg,
                nodeId // ID of node with process resource
              );
            }

            break;
          }

          case EResourcePipeResourceTypes.TERMINAL: {
            try {
              await peers.write(
                EPeerPipeResourceTypes.STDIN,
                resourceId,
                msg,
                nodeId // ID of node with terminal resource
              );

              await resources.write(
                EResourcePipeResourceTypes.TERMINAL_RESOLVE,
                resourceId,
                msg,
                nodeId // ID of node with terminal resource
              );
            } catch (e) {
              await resources.write(
                EResourcePipeResourceTypes.TERMINAL_REJECTION,
                resourceId,
                msg,
                nodeId // ID of node with terminal resource
              );
            }

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
            try {
              await resources.write(
                EResourcePipeResourceTypes.TERMINAL,
                resourceId,
                msg,
                nodeId // ID of node with stdout resource
              );

              await peers.write(
                EPeerPipeResourceTypes.STDOUT_RESOLVE,
                resourceId,
                msg,
                nodeId // ID of node with stdout resource
              );
            } catch (e) {
              await peers.write(
                EPeerPipeResourceTypes.STDOUT_REJECTION,
                resourceId,
                msg,
                nodeId // ID of node with stdout resource
              );
            }

            break;
          }

          case EPeerPipeResourceTypes.STDIN: {
            try {
              await resources.write(
                EResourcePipeResourceTypes.PROCESS,
                resourceId,
                msg,
                nodeId // ID of node with stdin resource
              );

              await peers.write(
                EPeerPipeResourceTypes.STDIN_RESOLVE,
                resourceId,
                msg,
                nodeId // ID of node with stdout resource
              );
            } catch (e) {
              await peers.write(
                EPeerPipeResourceTypes.STDOUT_REJECTION,
                resourceId,
                msg,
                nodeId // ID of node with stdout resource
              );
            }

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
};
