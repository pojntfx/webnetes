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

interface IFrame {
  resourceType: EPeerPipeResourceTypes;
  resourceId: string;
  msg: Uint8Array;
}

export class PeerPipe
  implements IPipe<IPeerPipeConfig, EPeerPipeResourceTypes> {
  private logger = getLogger();
  private bus = new Emittery();

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private transporter?: Transporter;

  async open(config: IPeerPipeConfig) {}

  async close() {}

  async read() {
    return {
      resourceType: EPeerPipeResourceTypes.STDIN,
      resourceId: "",
      msg: new Uint8Array(),
      nodeId: "",
    };
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
      const frame: IFrame = {
        resourceType,
        resourceId,
        msg,
      };

      await this.transporter.send(
        nodeId,
        this.encoder.encode(JSON.stringify(frame))
      );
    } else {
      throw new ClosedError("transporter");
    }
  }
}
