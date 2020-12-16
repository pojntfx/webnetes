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
  PROCESS = "webnetes.felicitas.pojtinger.com/v1alpha1/process",
  TERMINAL = "webnetes.felicitas.pojtinger.com/v1alpha1/terminal",
}

enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/stdout",
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/stdin",
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
            await peers.write(
              EPeerPipeResourceTypes.STDOUT,
              resourceId,
              msg,
              nodeId // ID of node with process resource
            );

            break;
          }

          case EResourcePipeResourceTypes.TERMINAL: {
            await peers.write(
              EPeerPipeResourceTypes.STDIN,
              resourceId,
              msg,
              nodeId // ID of node with terminal resource
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
              EResourcePipeResourceTypes.TERMINAL,
              resourceId,
              msg,
              nodeId // ID of node with stdout resource
            );

            break;
          }

          case EPeerPipeResourceTypes.STDIN: {
            await resources.write(
              EResourcePipeResourceTypes.PROCESS,
              resourceId,
              msg,
              nodeId // ID of node with stdin resource
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
};
