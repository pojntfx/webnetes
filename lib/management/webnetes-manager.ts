import { SignalingClient, Transporter } from "@pojntfx/unisockets";
import Emittery from "emittery";
import yaml from "js-yaml";
import { v4 } from "uuid";
import { ClosedError } from "../errors/closed";
import { ConfigMissingError } from "../errors/config-missing";
import { KnockRejectedError } from "../errors/knock-rejected";
import { ModificationFailedError } from "../errors/modification-failed";
import { NodeNotKnownError } from "../errors/unknown-node";
import { EResourceKind, IResource } from "../models/resource";
import { Signaler } from "../models/signaler";
import { IStunServerSpec, StunServer } from "../models/stunserver";
import { Subnet } from "../models/subnet";
import { ITurnServerSpec, TurnServer } from "../models/turnserver";
import { IModificationData, Modification } from "../operations/modification";
import {
  IModificationConfirmationData,
  ModificationConfirmation,
} from "../operations/modification-confirmation";
import {
  EMANAGEMENT_OPCODES,
  IManagementOperation,
} from "../operations/operation";
import { UnimplementedOperationError } from "../operations/unimplemented-operation";
import { getLogger } from "../utils/logger";

export const LOCAL = "local";

export class WebnetesManager {
  private logger = getLogger();

  private signalingClient?: SignalingClient;
  private transporter?: Transporter;

  private nodes = [] as string[];
  private queuedModificationConfirmations = [] as IModificationConfirmationData[];
  private asyncResolver = new Emittery();

  constructor(
    private networkConfig:
      | (StunServer | TurnServer | Signaler | Subnet)[]
      | string,

    private onNodeJoin: (id: string) => Promise<void>,
    private onNodeLeave: (id: string) => Promise<void>,

    private onModificationRequest: (
      resources: IResource<any>[],
      remove: boolean,
      id: string
    ) => Promise<void>
  ) {}

  async open() {
    this.logger.verbose("Opening manager");

    if (typeof this.networkConfig === "string") {
      this.networkConfig = yaml.safeLoadAll(this.networkConfig);
    }

    const transporterConfig = {
      iceServers: this.networkConfig
        .filter((c) =>
          [EResourceKind.STUNSERVER, EResourceKind.TURNSERVER].includes(c.kind)
        )
        .map((c) =>
          c.kind === EResourceKind.STUNSERVER
            ? {
                urls: (c.spec as IStunServerSpec).urls,
              }
            : {
                urls: (c.spec as ITurnServerSpec).urls,
                username: (c.spec as ITurnServerSpec).username,
                credential: (c.spec as ITurnServerSpec).credential,
              }
        ),
    };
    const signalerConfig = this.networkConfig.find(
      (c) => c.kind === EResourceKind.SIGNALER
    ) as Signaler;
    if (!signalerConfig) {
      throw new ConfigMissingError("signaler");
    }

    const subnetConfig = this.networkConfig.find(
      (c) => c.kind === EResourceKind.SUBNET
    ) as Subnet;
    if (!subnetConfig) {
      throw new ConfigMissingError("subnet");
    }

    // State
    const ready = new Emittery();
    const aliases = new Map<string, string>();

    // Transporter
    const handleTransporterConnectionConnect = async (id: string) => {
      this.logger.verbose("Handling transporter connection connect", { id });
    };
    const handleTransporterConnectionDisconnect = async (id: string) => {
      this.logger.verbose("Handling transporter connection disconnect", { id });
    };
    const handleTransporterChannelOpen = async (id: string) => {
      this.logger.verbose("Handling transporter connection open", { id });

      this.nodes.push(id);

      (async () => {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        while (this.nodes.includes(id)) {
          const encodedMsg = await transporter.recv(id);

          const decodedMsg = JSON.parse(
            decoder.decode(encodedMsg)
          ) as IManagementOperation<any>;

          switch (decodedMsg.opcode) {
            case EMANAGEMENT_OPCODES.MODIFICATION: {
              const modificationData = decodedMsg.data as IModificationData;
              const resources = JSON.parse(modificationData.resources);

              try {
                await this.onModificationRequest(
                  resources,
                  modificationData.remove,
                  id
                );

                await transporter.send(
                  id,
                  encoder.encode(
                    JSON.stringify(
                      new ModificationConfirmation<any>(
                        modificationData.id,
                        true
                      )
                    )
                  )
                );
              } catch (e) {
                await transporter.send(
                  id,
                  encoder.encode(
                    JSON.stringify(
                      new ModificationConfirmation<any>(
                        modificationData.id,
                        false
                      )
                    )
                  )
                );
              }

              break;
            }

            case EMANAGEMENT_OPCODES.MODIFICATION_CONFIRMATION: {
              const modificationConfirmationData = decodedMsg.data as IModificationConfirmationData;

              this.queuedModificationConfirmations.push(
                modificationConfirmationData
              );

              this.asyncResolver.emit(
                this.getModificationConfirmationKey(
                  modificationConfirmationData.id
                ),
                modificationConfirmationData.success
              );

              break;
            }

            default: {
              throw new UnimplementedOperationError(decodedMsg.opcode);
            }
          }
        }
      })();

      await this.onNodeJoin(id);
    };

    const handleTransporterChannelClose = async (id: string) => {
      this.logger.verbose("Handling transporter connection close", { id });

      this.nodes = this.nodes.filter((n) => n !== id);

      await this.onNodeLeave(id);
    };

    const transporter = new Transporter(
      transporterConfig,
      handleTransporterConnectionConnect,
      handleTransporterConnectionDisconnect,
      handleTransporterChannelOpen,
      handleTransporterChannelClose
    );

    // Signaling client
    const handleConnect = async () => {
      this.logger.verbose("Handling connect");
    };
    const handleDisconnect = async () => {
      this.logger.verbose("Handling disconnect");
    };
    const handleAcknowledgement = async (id: string, rejected: boolean) => {
      this.logger.debug("Handling acknowledgement", { id, rejected });

      if (rejected) {
        throw new KnockRejectedError();
      }

      await ready.emit("ready", true);
    };
    const getOffer = async (
      answererId: string,
      handleCandidate: (candidate: string) => Promise<any>
    ) => {
      const offer = await transporter.getOffer(answererId, handleCandidate);

      this.logger.verbose("Created offer", { answererId, offer });

      return offer;
    };
    const handleOffer = async (
      offererId: string,
      offer: string,
      handleCandidate: (candidate: string) => Promise<any>
    ) => {
      const answer = await transporter.handleOffer(
        offererId,
        offer,
        handleCandidate
      );

      this.logger.verbose("Created answer for offer", {
        offererId,
        offer,
        answer,
      });

      return answer;
    };
    const handleAnswer = async (
      offererId: string,
      answererId: string,
      answer: string
    ) => {
      this.logger.verbose("Handling answer", { offererId, answererId, answer });

      await transporter.handleAnswer(answererId, answer);
    };
    const handleCandidate = async (
      offererId: string,
      answererId: string,
      candidate: string
    ) => {
      this.logger.verbose("Handling candidate", {
        offererId,
        answererId,
        candidate,
      });

      await transporter.handleCandidate(offererId, candidate);
    };
    const handleGoodbye = async (id: string) => {
      this.logger.verbose("Handling goodbye", { id });

      await transporter.shutdown(id);
    };
    const handleAlias = async (id: string, alias: string, set: boolean) => {
      this.logger.debug("Handling alias", { id });

      if (set) {
        this.logger.verbose("Setting alias", { id, alias });

        aliases.set(alias, id);

        this.logger.debug("New aliases", {
          aliases: JSON.stringify(Array.from(aliases)),
        });
      } else {
        this.logger.verbose("Removing alias", { id, alias });

        aliases.delete(alias);

        this.logger.debug("New aliases", {
          aliases: JSON.stringify(Array.from(aliases)),
        });
      }
    };

    const signalingClient = new SignalingClient(
      signalerConfig.spec.urls[0],
      signalerConfig.spec.retryAfter,
      subnetConfig.spec.prefix,
      handleConnect,
      handleDisconnect,
      handleAcknowledgement,
      getOffer,
      handleOffer,
      handleAnswer,
      handleCandidate,
      handleGoodbye,
      handleAlias
    );

    this.signalingClient = signalingClient;
    this.transporter = transporter;

    return new Promise<void>((res) => {
      (async () => {
        await ready.once("ready");

        res();
      })();

      signalingClient.open();
    });
  }

  async close() {
    this.logger.verbose("Closing manager");

    await this.transporter?.close();
    await this.signalingClient?.close();
  }

  async modifyResources<T>(
    resources: IResource<T>[] | string,
    remove: boolean,
    nodeId: string
  ) {
    if (typeof resources === "string") {
      resources = yaml.safeLoadAll(resources) as IResource<any>[];
    }

    if (nodeId === LOCAL) {
      await this.onModificationRequest(resources, remove, nodeId);
    } else {
      if (this.signalingClient && this.transporter) {
        if (this.nodes.includes(nodeId)) {
          const msgId = v4();

          await new Promise<void>(async (res, rej) => {
            (async () => {
              const success = await this.receiveModificationConfirmationRequest(
                msgId
              );

              success ? res() : rej(new ModificationFailedError());
            })();

            await this.transporter!.send(
              nodeId,
              new TextEncoder().encode(
                JSON.stringify(
                  new Modification<T>(
                    msgId,
                    resources as IResource<T>[],
                    remove
                  )
                )
              )
            ); // We check above

            this.logger.debug("Sent resource modification request");
          });

          this.logger.debug("Got confirmation for modification");
        } else {
          throw new NodeNotKnownError(nodeId);
        }
      } else {
        throw new ClosedError("signalingClient or transporter");
      }
    }
  }

  private getModificationConfirmationKey(id: string) {
    return `modificationConfirmation=${id}`;
  }

  private async receiveModificationConfirmationRequest(id: string) {
    if (this.queuedModificationConfirmations.find((c) => c.id === id)) {
      return this.queuedModificationConfirmations.find((c) => c.id === id)!
        .success; // We check above
    } else {
      const msg = await this.asyncResolver.once(
        this.getModificationConfirmationKey(id)
      );

      this.queuedModificationConfirmations = this.queuedModificationConfirmations.filter(
        (c) => c.id !== id
      );

      return msg! as boolean; // We check above
    }
  }
}
