import {
  ExtendedRTCConfiguration,
  SignalingClient,
  Transporter,
} from "@pojntfx/unisockets";
import Emittery from "emittery";
import { v4 } from "uuid";
import { ClosedError } from "../errors/closed";
import { KnockRejectedError } from "../errors/knock-rejected";
import { NodeNotKnownError } from "../errors/unknown-node";
import { IResource } from "../models/resource";
import { Modification } from "../operations/modification";
import { getLogger } from "../utils/logger";

export class WebnetesManager {
  private logger = getLogger();

  private signalingClient?: SignalingClient;
  private transporter?: Transporter;

  private id = "";
  private nodes = [] as string[];

  constructor(
    private transporterConfig: ExtendedRTCConfiguration,
    private signalingServerConnectAddress: string,
    private reconnectTimeout: number,
    private subnetPrefix: string,

    private onNodeJoin: (id: string) => Promise<void>,
    private onNodeLeave: (id: string) => Promise<void>
  ) {}

  async open() {
    this.logger.verbose("Opening manager");

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

      await this.onNodeJoin(id);
    };
    const handleTransporterChannelClose = async (id: string) => {
      this.logger.verbose("Handling transporter connection close", { id });

      this.nodes = this.nodes.filter((n) => n !== id);

      await this.onNodeLeave(id);
    };

    const transporter = new Transporter(
      this.transporterConfig,
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

      this.id = id;

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
      this.signalingServerConnectAddress,
      this.reconnectTimeout,
      this.subnetPrefix,
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
    resources: IResource<T>[],
    id: string,
    remove: boolean
  ) {
    if (this.signalingClient && this.transporter) {
      if (this.nodes.includes(id)) {
        const msgId = v4();

        // TODO: Add receiver after getting local ID & subscribe till modificationConfirmation is returned, then resolve

        await this.transporter!.send(
          id,
          new TextEncoder().encode(
            JSON.stringify(new Modification<T>(msgId, resources, remove))
          )
        ); // We check above

        this.logger.debug("Sent resource modification request");
      } else {
        throw new NodeNotKnownError(id);
      }
    } else {
      throw new ClosedError("signalingClient or transporter");
    }
  }
}
