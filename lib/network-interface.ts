import { getLogger } from "./logger";

export class NetworkInterface {
  private logger = getLogger();

  async open() {
    this.logger.info("Opening network interface");
  }

  async close() {
    this.logger.info("Closing network interface");
  }
}
