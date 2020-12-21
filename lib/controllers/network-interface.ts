import { getLogger } from "../utils/logger";
import {
  ExtendedRTCConfiguration,
  SignalingClient,
  Sockets,
  Transporter,
} from "@pojntfx/unisockets";
import { ClosedError } from "../errors/closed";
import { AliasDoesNotExistError } from "../errors/alias-does-not-exist";
import Emittery from "emittery";
import { KnockRejectedError } from "../errors/knock-rejected";

export class NetworkInterface {
  private logger = getLogger();

  private signalingClient?: SignalingClient;
  private transporter?: Transporter;
  private sockets?: Sockets;
  private localNodeId?: String;

  constructor(
    private transporterConfig: ExtendedRTCConfiguration,
    private signalingServerConnectAddress: string,
    private reconnectTimeout: number,
    private networkInterfacePrefix: string,

    private onNodeAcknowledged: (id: string) => Promise<void>,
    private onNodeJoin: (id: string) => Promise<void>,
    private onNodeLeave: (id: string) => Promise<void>
  ) {}

  async open() {
    this.logger.debug("Opening network interface");

    // State
    const ready = new Emittery();
    const aliases = new Map<string, string>();

    // Transporter
    const handleTransporterConnectionConnect = async (id: string) => {
      this.logger.silly("Handling transporter connection connect", { id });
    };
    const handleTransporterConnectionDisconnect = async (id: string) => {
      this.logger.silly("Handling transporter connection disconnect", { id });
    };
    const handleTransporterChannelOpen = async (id: string) => {
      this.logger.silly("Handling transporter connection open", { id });

      if (id.startsWith(this.networkInterfacePrefix)) await this.onNodeJoin(id);
    };
    const handleTransporterChannelClose = async (id: string) => {
      this.logger.silly("Handling transporter connection close", { id });

      if (id.startsWith(this.networkInterfacePrefix))
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
      this.logger.silly("Handling connect");
    };
    const handleDisconnect = async () => {
      this.logger.silly("Handling disconnect");
    };
    const handleAcknowledgement = async (id: string, rejected: boolean) => {
      this.logger.silly("Handling acknowledgement", { id, rejected });

      if (rejected) {
        throw new KnockRejectedError();
      }

      this.localNodeId = id;
      await ready.emit("ready", true);

      await this.onNodeAcknowledged(id);
    };
    const getOffer = async (
      answererId: string,
      handleCandidate: (candidate: string) => Promise<any>
    ) => {
      const offer = await transporter.getOffer(answererId, handleCandidate);

      this.logger.silly("Created offer", { answererId, offer });

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

      this.logger.silly("Created answer for offer", {
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
      this.logger.silly("Handling answer", { offererId, answererId, answer });

      await transporter.handleAnswer(answererId, answer);
    };
    const handleCandidate = async (
      offererId: string,
      answererId: string,
      candidate: string
    ) => {
      this.logger.silly("Handling candidate", {
        offererId,
        answererId,
        candidate,
      });

      await transporter.handleCandidate(offererId, candidate);
    };
    const handleGoodbye = async (id: string) => {
      this.logger.silly("Handling goodbye", { id });

      await transporter.shutdown(id);
    };
    const handleAlias = async (id: string, alias: string, set: boolean) => {
      this.logger.silly("Handling alias", { id });

      if (set) {
        this.logger.silly("Setting alias", { id, alias });

        aliases.set(alias, id);

        this.logger.silly("New aliases", {
          aliases: JSON.stringify(Array.from(aliases)),
        });
      } else {
        this.logger.silly("Removing alias", { id, alias });

        aliases.delete(alias);

        this.logger.silly("New aliases", {
          aliases: JSON.stringify(Array.from(aliases)),
        });
      }
    };

    const signalingClient = new SignalingClient(
      this.signalingServerConnectAddress,
      this.reconnectTimeout,
      this.networkInterfacePrefix,
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

    // Socket
    const handleExternalBind = async (alias: string) => {
      this.logger.silly("Handling external bind", { alias });

      await signalingClient.bind(alias);
    };

    const handleExternalAccept = async (alias: string) => {
      this.logger.silly("Handling external accept", { alias });

      return await signalingClient.accept(alias);
    };

    const handleExternalConnect = async (alias: string) => {
      this.logger.silly("Handling external connect", { alias });

      await signalingClient.connect(alias);
    };

    const handleExternalSend = async (alias: string, msg: Uint8Array) => {
      this.logger.silly("Handling external send", { alias, msg });

      if (aliases.has(alias)) {
        return await transporter.send(aliases.get(alias)!, msg); // .has
      } else {
        throw new AliasDoesNotExistError();
      }
    };

    const handleExternalRecv = async (alias: string) => {
      if (aliases.has(alias)) {
        const msg = await transporter.recv(aliases.get(alias)!); // .has

        this.logger.silly("Handling external recv", { alias, msg });

        return msg;
      } else {
        throw new AliasDoesNotExistError();
      }
    };

    const sockets = new Sockets(
      handleExternalBind,
      handleExternalAccept,
      handleExternalConnect,
      handleExternalSend,
      handleExternalRecv
    );

    this.signalingClient = signalingClient;
    this.transporter = transporter;
    this.sockets = sockets;

    return new Promise<void>((res) => {
      (async () => {
        await ready.once("ready");

        res();
      })();

      signalingClient.open();
    });
  }

  async close() {
    this.logger.debug("Closing network interface");

    await this.transporter?.close();
    await this.signalingClient?.close();
  }

  async getImports(): Promise<any> {
    this.logger.debug("Getting imports");

    if (this.sockets) {
      return this.sockets.getImports();
    } else {
      throw new ClosedError("sockets");
    }
  }

  async setMemory(memoryId: string, memory: Uint8Array) {
    this.logger.debug("Setting memory", { memoryId, memory });

    if (this.sockets) {
      return this.sockets.setMemory(memoryId, memory);
    } else {
      throw new ClosedError("sockets");
    }
  }
}
