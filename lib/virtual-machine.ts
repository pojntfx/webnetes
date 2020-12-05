import { getLogger } from "./logger";

export class VirtualMachine {
  private logger = getLogger();

  async open() {
    this.logger.info("Hello, world!");
  }
}
