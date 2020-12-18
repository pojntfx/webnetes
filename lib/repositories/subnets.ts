import { INetworkSpec, Network } from "../resources/network";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { ISignalerSpec, Signaler } from "../resources/signaler";
import { IStunServerSpec, StunServer } from "../resources/stunserver";
import { Subnet } from "../resources/subnet";
import { ITurnServerSpec, TurnServer } from "../resources/turnserver";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Subnets extends Repository<
  StunServer | TurnServer | Signaler | Network | Subnet
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
}
