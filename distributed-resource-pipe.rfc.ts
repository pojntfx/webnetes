interface IDistributedResourcePipe<C, T, S> {
  open: (config: C) => Promise<void>;
  close: () => Promise<void>;
  read: () => Promise<{
    resourceType: T;
    resourceId: string;
    stateType: S;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write: (
    resourceType: T,
    resourceId: string,
    stateType: S,
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
  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/terminal", // Writing to the terminal resource -> write to xterm.stdout, reading from the resource -> reading from xterm.stdin
}

enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdout", // Writing to the stdout resource -> send over WebRTC, reading from the stdout resource -> receive from WebRTC
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdin", // Writing to the stdin resource -> send over WebRTC, reading from the stdin resource -> receive from WebRTC
}

enum ECommonStateTypes {
  PENDING = "webnetes.felicitas.pojtinger.com/v1alpha1/states/pending", // When receiving a PENDING state, processing should be started
  RESOLVED = "webnetes.felicitas.pojtinger.com/v1alpha1/states/resolved", // Processing was successful
  REJECTED = "webnetes.felicitas.pojtinger.com/v1alpha1/states/rejected", // Processing was unsuccessful
}

class ResourcePipe
  implements
    IDistributedResourcePipe<
      {},
      EResourcePipeResourceTypes,
      ECommonStateTypes
    > {
  open!: (config: {}) => Promise<void>;
  close!: () => Promise<void>;
  read!: () => Promise<{
    resourceType: EResourcePipeResourceTypes;
    resourceId: string;
    stateType: ECommonStateTypes;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EResourcePipeResourceTypes,
    resourceId: string,
    stateType: ECommonStateTypes,
    msg: Uint8Array,
    nodeId: string
  ) => Promise<void>;
}

class PeerPipe
  implements
    IDistributedResourcePipe<{}, EPeerPipeResourceTypes, ECommonStateTypes> {
  open!: (config: {}) => Promise<void>;
  close!: () => Promise<void>;
  read!: () => Promise<{
    resourceType: EPeerPipeResourceTypes;
    resourceId: string;
    stateType: ECommonStateTypes;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    stateType: ECommonStateTypes,
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
          stateType,
          msg,
          nodeId,
        } = await resources.read();

        switch (resourceType) {
          case EResourcePipeResourceTypes.PROCESS: {
            try {
              await peers.write(
                EPeerPipeResourceTypes.STDOUT,
                resourceId,
                stateType,
                msg,
                nodeId // ID of node with process resource
              );

              await resources.write(
                resourceType,
                resourceId,
                ECommonStateTypes.RESOLVED,
                msg,
                nodeId // ID of node with process resource
              );
            } catch (e) {
              await resources.write(
                resourceType,
                resourceId,
                ECommonStateTypes.REJECTED,
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
                stateType,
                msg,
                nodeId // ID of node with terminal resource
              );

              await resources.write(
                resourceType,
                resourceId,
                ECommonStateTypes.RESOLVED,
                msg,
                nodeId // ID of node with terminal resource
              );
            } catch (e) {
              await resources.write(
                resourceType,
                resourceId,
                ECommonStateTypes.REJECTED,
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
        const {
          resourceType,
          resourceId,
          stateType,
          msg,
          nodeId,
        } = await peers.read();

        switch (resourceType) {
          case EPeerPipeResourceTypes.STDOUT: {
            try {
              await resources.write(
                EResourcePipeResourceTypes.TERMINAL,
                resourceId,
                stateType,
                msg,
                nodeId // ID of node with stdout resource
              );

              await peers.write(
                resourceType,
                resourceId,
                ECommonStateTypes.RESOLVED,
                msg,
                nodeId // ID of node with stdout resource
              );
            } catch (e) {
              await peers.write(
                resourceType,
                resourceId,
                ECommonStateTypes.REJECTED,
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
                stateType,
                msg,
                nodeId // ID of node with stdin resource
              );

              await peers.write(
                resourceType,
                resourceId,
                ECommonStateTypes.RESOLVED,
                msg,
                nodeId // ID of node with stdout resource
              );
            } catch (e) {
              await peers.write(
                resourceType,
                resourceId,
                ECommonStateTypes.REJECTED,
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
