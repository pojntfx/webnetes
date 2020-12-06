import { getLogger } from "./logger";
import { ExtendedRTCConfiguration, Sockets } from "@pojntfx/unisockets";
import { ClosedError } from "./errors/closed";

export class NetworkInterface {
  private logger = getLogger();
  private sockets?: Sockets;

  constructor(private transporterConfig: ExtendedRTCConfiguration) {}

  async open() {
    this.logger.info("Opening network interface");
  }

  async close() {
    this.logger.info("Closing network interface");
  }

  async getImports() {
    if (this.sockets) {
      return this.sockets.getImports();
    } else {
      throw new ClosedError("sockets");
    }
  }

  async setMemory(memoryId: string, memory: Uint8Array) {
    if (this.sockets) {
      return this.sockets.setMemory(memoryId, memory);
    } else {
      throw new ClosedError("sockets");
    }
  }
}
