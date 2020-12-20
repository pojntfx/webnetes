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
import { ISubnetSpec, Subnet } from "../resources/subnet";
import { ITurnServerSpec, TurnServer } from "../resources/turnserver";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Subnets extends Repository<
  StunServer | TurnServer | Signaler | Network | Subnet,
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

  async createSubnet(
    metadata: IResourceMetadata,
    spec: ISubnetSpec,

    onNodeAcknowledged: (
      metadata: IResourceMetadata,
      spec: ISubnetSpec,
      id: string
    ) => Promise<void>,
    onNodeJoin: (
      metadata: IResourceMetadata,
      spec: ISubnetSpec,
      id: string
    ) => Promise<void>,
    onNodeLeave: (
      metadata: IResourceMetadata,
      spec: ISubnetSpec,
      id: string
    ) => Promise<void>
  ) {
    this.logger.debug("Creating subnet", { metadata });

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

    const subnet = new Subnet(metadata, spec);

    const iface = new NetworkInterface(
      {
        iceServers: [...stunServers, ...turnServers],
      },
      signaler.spec.urls[0],
      signaler.spec.retryAfter,
      subnet.spec.prefix,
      async (id: string) => await onNodeAcknowledged(metadata, spec, id),
      async (id: string) => await onNodeJoin(metadata, spec, id),
      async (id: string) => await onNodeLeave(metadata, spec, id)
    );

    (async () => {
      await iface.open();
    })();

    await this.addInstance<IInstance<NetworkInterface>>(
      subnet.apiVersion,
      subnet.kind,
      subnet.metadata,
      iface
    );

    await this.addResource<Subnet>(
      subnet.apiVersion,
      subnet.kind,
      subnet.metadata,
      subnet.spec
    );
  }

  async deleteSubnet(metadata: IResourceMetadata) {
    this.logger.debug("Deleting subnet", { metadata });

    const subnet = new Subnet(metadata, {} as any);

    const subnetInstance = await this.findInstance<IInstance<NetworkInterface>>(
      subnet.apiVersion,
      subnet.kind,
      subnet.metadata.label
    );

    await subnetInstance.instance.close();

    await this.removeResource<Subnet>(
      subnet.apiVersion,
      subnet.kind,
      subnet.metadata.label
    );

    await this.removeInstance<IInstance<NetworkInterface>>(
      subnet.apiVersion,
      subnet.kind,
      subnet.metadata.label
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

  async getSubnet(label: Subnet["metadata"]["label"]) {
    this.logger.debug("Getting subnet", { label });

    return this.findResource<Subnet>(API_VERSION, EResourceKind.SUBNET, label);
  }

  async getSubnetInstance(
    label: IInstance<NetworkInterface>["metadata"]["label"]
  ) {
    this.logger.debug("Getting subnet instance", { label });

    return this.findInstance<IInstance<NetworkInterface>>(
      API_VERSION,
      EResourceKind.SUBNET,
      label
    );
  }
}
