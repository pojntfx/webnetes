interface IDistributedResourcePipe<C, T, H> {
  open: (config: C) => Promise<void>;
  close: () => Promise<void>;
  read: () => Promise<{
    resourceType: T;
    resourceId: string;
    statusType: H;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write: (
    resourceType: T,
    resourceId: string,
    statusType: H,
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
  PROCESS = "webnetes.felix.pojtinger.com/v1alpha1/resources/process",
  TERMINAL = "webnetes.felix.pojtinger.com/v1alpha1/resources/terminal",
}

enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdout",
  STDIN = "webnetes.felix.pojtinger.com/v1alpha1/resources/stdin",
}

enum ECommonStateTypes {
  PENDING = "webnetes.felix.pojtinger.com/v1alpha1/states/pending",
  RESOLVED = "webnetes.felix.pojtinger.com/v1alpha1/states/resolved",
  REJECTED = "webnetes.felix.pojtinger.com/v1alpha1/states/rejected",
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
    statusType: ECommonStateTypes;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EResourcePipeResourceTypes,
    resourceId: string,
    statusType: ECommonStateTypes,
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
    statusType: ECommonStateTypes;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write!: (
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    statusType: ECommonStateTypes,
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
          statusType,
          msg,
          nodeId,
        } = await resources.read();

        switch (resourceType) {
          case EResourcePipeResourceTypes.PROCESS: {
            await peers.write(
              EPeerPipeResourceTypes.STDOUT,
              resourceId,
              ECommonStateTypes.PENDING,
              msg,
              nodeId // ID of node with process resource
            );

            break;
          }

          case EResourcePipeResourceTypes.TERMINAL: {
            await peers.write(
              EPeerPipeResourceTypes.STDIN,
              resourceId,
              ECommonStateTypes.PENDING,
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
        const {
          resourceType,
          resourceId,
          statusType,
          msg,
          nodeId,
        } = await peers.read();

        switch (resourceType) {
          case EPeerPipeResourceTypes.STDOUT: {
            try {
              await resources.write(
                EResourcePipeResourceTypes.TERMINAL,
                resourceId,
                statusType,
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
                statusType,
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
