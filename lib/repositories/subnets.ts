import { NetworkInterface } from "../controllers/network-interface";
import { IInstance } from "../resources/instance";
import { INetworkSpec, Network } from "../resources/network";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { ISignalerSpec, Signaler } from "../resources/signaler";
import { IStunServerSpec, StunServer } from "../resources/stunserver";
import {
  INetworkInterfaceSpec,
  NetworkInterface as NetworkInterfaceResource,
} from "../resources/network-interface";
import { ITurnServerSpec, TurnServer } from "../resources/turnserver";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Subnets extends Repository<
  StunServer | TurnServer | Signaler | Network | NetworkInterfaceResource,
  IInstance<NetworkInterface>
> {
  private logger = getLogger();

  async createStunServer(metadata: IResourceMetadata, spec: IStunServerSpec) {
    this.logger.debug("Creating STUN server", { metadata });

    const stunServer = new StunServer(metadata, spec);

    await this.addResource<StunServer>(
      stunServer.apiVersion,
      stunServer.kind,
      stunServer.metadata,
      stunServer.spec
    );
  }

  async deleteStunServer(metadata: IResourceMetadata) {
    this.logger.debug("Deleting STUN server", { metadata });

    const stunServer = new StunServer(metadata, {} as any);

    await this.removeResource<StunServer>(
      stunServer.apiVersion,
      stunServer.kind,
      stunServer.metadata.label
    );
  }

  async createTurnServer(metadata: IResourceMetadata, spec: ITurnServerSpec) {
    this.logger.debug("Creating TURN server", { metadata });

    const turnServer = new TurnServer(metadata, spec);

    await this.addResource<TurnServer>(
      turnServer.apiVersion,
      turnServer.kind,
      turnServer.metadata,
      turnServer.spec
    );
  }

  async deleteTurnServer(metadata: IResourceMetadata) {
    this.logger.debug("Deleting TURN server", { metadata });

    const turnServer = new TurnServer(metadata, {} as any);

    await this.removeResource<TurnServer>(
      turnServer.apiVersion,
      turnServer.kind,
      turnServer.metadata.label
    );
  }

  async createSignaler(metadata: IResourceMetadata, spec: ISignalerSpec) {
    this.logger.debug("Creating signaler", { metadata });

    const signaler = new Signaler(metadata, spec);

    await this.addResource<Signaler>(
      signaler.apiVersion,
      signaler.kind,
      signaler.metadata,
      signaler.spec
    );
  }

  async deleteSignaler(metadata: IResourceMetadata) {
    this.logger.debug("Deleting signaler", { metadata });

    const signaler = new Signaler(metadata, {} as any);

    await this.removeResource<Signaler>(
      signaler.apiVersion,
      signaler.kind,
      signaler.metadata.label
    );
  }

  async createNetwork(metadata: IResourceMetadata, spec: INetworkSpec) {
    this.logger.debug("Creating network", { metadata });

    await Promise.all([
      await this.getSignaler(spec.signaler),
      ...spec.stunServers.map(
        async (stunServer) => await this.getStunServer(stunServer)
      ),
      ...spec.turnServers.map(
        async (turnServer) => await this.getTurnServer(turnServer)
      ),
    ]);

    const network = new Network(metadata, spec);

    await this.addResource<Network>(
      network.apiVersion,
      network.kind,
      network.metadata,
      network.spec
    );
  }

  async deleteNetwork(metadata: IResourceMetadata) {
    this.logger.debug("Deleting network", { metadata });

    const network = new Network(metadata, {} as any);

    await this.removeResource<Network>(
      network.apiVersion,
      network.kind,
      network.metadata.label
    );
  }

  async createNetworkInterface(
    metadata: IResourceMetadata,
    spec: INetworkInterfaceSpec,

    onNodeAcknowledged: (
      metadata: IResourceMetadata,
      spec: INetworkInterfaceSpec,
      id: string
    ) => Promise<void>,
    onNodeJoin: (
      metadata: IResourceMetadata,
      spec: INetworkInterfaceSpec,
      id: string
    ) => Promise<void>,
    onNodeLeave: (
      metadata: IResourceMetadata,
      spec: INetworkInterfaceSpec,
      id: string
    ) => Promise<void>
  ) {
    this.logger.debug("Creating networkInterface", { metadata });

    const network = await this.getNetwork(spec.network);

    const [stunServers, turnServers, signaler] = await Promise.all([
      Promise.all(
        network.spec.stunServers
          .map(async (stunServer) => await this.getStunServer(stunServer))
          .map(async (stunServer) => ({ urls: (await stunServer).spec.urls }))
      ),
      Promise.all(
        network.spec.turnServers
          .map(async (turnServer) => await this.getTurnServer(turnServer))
          .map(async (turnServer) => ({
            urls: (await turnServer).spec.urls,
            username: (await turnServer).spec.username,
            credential: (await turnServer).spec.credential,
          }))
      ),
      await this.getSignaler(network.spec.signaler),
    ]);

    const ifaceResource = new NetworkInterfaceResource(metadata, spec);

    const iface = new NetworkInterface(
      {
        iceServers: [...stunServers, ...turnServers],
      },
      signaler.spec.urls[0],
      signaler.spec.retryAfter,
      ifaceResource.spec.prefix,
      async (id: string) => await onNodeAcknowledged(metadata, spec, id),
      async (id: string) => await onNodeJoin(metadata, spec, id),
      async (id: string) => await onNodeLeave(metadata, spec, id)
    );

    (async () => {
      await iface.open();
    })();

    await this.addInstance<IInstance<NetworkInterface>>(
      ifaceResource.apiVersion,
      ifaceResource.kind,
      ifaceResource.metadata,
      iface
    );

    await this.addResource<NetworkInterfaceResource>(
      ifaceResource.apiVersion,
      ifaceResource.kind,
      ifaceResource.metadata,
      ifaceResource.spec
    );
  }

  async deleteNetworkInterface(metadata: IResourceMetadata) {
    this.logger.debug("Deleting networkInterface", { metadata });

    const networkInterface = new NetworkInterfaceResource(metadata, {} as any);

    const subnetInstance = await this.findInstance<IInstance<NetworkInterface>>(
      networkInterface.apiVersion,
      networkInterface.kind,
      networkInterface.metadata.label
    );

    await subnetInstance.instance.close();

    await this.removeResource<NetworkInterfaceResource>(
      networkInterface.apiVersion,
      networkInterface.kind,
      networkInterface.metadata.label
    );

    await this.removeInstance<IInstance<NetworkInterface>>(
      networkInterface.apiVersion,
      networkInterface.kind,
      networkInterface.metadata.label
    );
  }

  async getStunServer(label: StunServer["metadata"]["label"]) {
    this.logger.debug("Getting STUN server", { label });

    return this.findResource<StunServer>(
      API_VERSION,
      EResourceKind.STUNSERVER,
      label
    );
  }

  async getTurnServer(label: TurnServer["metadata"]["label"]) {
    this.logger.debug("Getting TURN server", { label });

    return this.findResource<TurnServer>(
      API_VERSION,
      EResourceKind.TURNSERVER,
      label
    );
  }

  async getSignaler(label: Signaler["metadata"]["label"]) {
    this.logger.debug("Getting signaler", { label });

    return this.findResource<Signaler>(
      API_VERSION,
      EResourceKind.SIGNALER,
      label
    );
  }

  async getNetwork(label: Network["metadata"]["label"]) {
    this.logger.debug("Getting network", { label });

    return this.findResource<Network>(
      API_VERSION,
      EResourceKind.NETWORK,
      label
    );
  }

  async getNetworkInterface(
    label: NetworkInterfaceResource["metadata"]["label"]
  ) {
    this.logger.debug("Getting networkInterface", { label });

    return this.findResource<NetworkInterfaceResource>(
      API_VERSION,
      EResourceKind.NETWORK_INTERFACE,
      label
    );
  }

  async getNetworkInterfaceInstance(
    label: IInstance<NetworkInterface>["metadata"]["label"]
  ) {
    this.logger.debug("Getting networkInterface instance", { label });

    return this.findInstance<IInstance<NetworkInterface>>(
      API_VERSION,
      EResourceKind.NETWORK_INTERFACE,
      label
    );
  }
}
