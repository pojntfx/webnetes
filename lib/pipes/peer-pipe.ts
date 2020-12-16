import Emittery from "emittery";
import { getLogger } from "../utils/logger";
import { IPipe } from "./pipe";
import { ExtendedRTCConfiguration, Transporter } from "@pojntfx/unisockets";
import { UnknownResourceError } from "../errors/unknown-resource";
import { ClosedError } from "../errors/closed";

export interface IPeerPipeConfig {
  networkConfig: ExtendedRTCConfiguration;
}

export enum EPeerPipeResourceTypes {
  STDOUT = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdout",
  STDOUT_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutResolve",
  STDOUT_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdoutRejection",
  STDIN = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdin",
  STDIN_RESOLVE = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinResolve",
  STDIN_REJECTION = "webnetes.felicitas.pojtinger.com/v1alpha1/resources/stdinRejection",
}

interface IIOFrame {
  resourceType: EPeerPipeResourceTypes;
  resourceId: string;
  msg: Uint8Array;
  nodeId: string;
}

export class PeerPipe
  implements IPipe<IPeerPipeConfig, EPeerPipeResourceTypes> {
  private logger = getLogger();
  private bus = new Emittery();

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private transporter?: Transporter;

  private queuedReceivedIOs = [] as IIOFrame[];

  async open(config: IPeerPipeConfig) {}

  async close() {}

  async read() {
    let frame: IIOFrame;
    if (this.queuedReceivedIOs.length !== 0) {
      frame = this.queuedReceivedIOs.shift()!;
    } else {
      frame = (await this.bus.once(this.getReadKey())) as IIOFrame;

      this.queuedReceivedIOs.shift();
    }

    return frame;
  }

  async write(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    switch (resourceType) {
      case EPeerPipeResourceTypes.STDOUT: {
        await this.handleWrite(resourceType, resourceId, msg, nodeId);

        break;
      }

      case EPeerPipeResourceTypes.STDIN: {
        await this.handleWrite(resourceType, resourceId, msg, nodeId);

        break;
      }

      default: {
        throw new UnknownResourceError(resourceType);
      }
    }
  }

  private async handleWrite(
    resourceType: EPeerPipeResourceTypes,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) {
    if (this.transporter) {
      const frame: IIOFrame = {
        resourceType,
        resourceId,
        msg,
        nodeId,
      };

      await this.transporter.send(
        nodeId,
        this.encoder.encode(JSON.stringify(frame))
      );
    } else {
      throw new ClosedError("transporter");
    }
  }

  private getReadKey() {
    return "read";
  }
}
