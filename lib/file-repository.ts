import WebTorrent from "webtorrent-hybrid";
import { getLogger } from "./logger";

export class FileRepository {
  private logger = getLogger();

  private client?: WebTorrent.Instance;

  async open() {
    this.logger.verbose("Opening file repository");

    this.client = new WebTorrent();
  }

  async close() {
    this.logger.verbose("Closing file repository");

    await new Promise<void>((res, rej) =>
      this.client?.destroy((e: any) => (e ? rej(e) : res()))
    );
  }

  async seed(content: Uint8Array) {
    return "";
  }

  async add(magnetURI: string) {
    return new Uint8Array();
  }

  async remove(magnetURI: string) {}
}
