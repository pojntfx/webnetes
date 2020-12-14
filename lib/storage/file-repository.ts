import { ExtendedRTCConfiguration } from "@pojntfx/unisockets";
import WebTorrent from "webtorrent-hybrid";
import { ClosedError } from "../errors/closed";
import { FileNotInTorrentError } from "../errors/file-not-in-torrent";
import { getLogger } from "../utils/logger";

const FILE_NAME = "data";

export class FileRepository {
  private logger = getLogger();

  private client?: WebTorrent.Instance;

  constructor(
    private trackers: string[],
    private transporterConfig: ExtendedRTCConfiguration
  ) {}

  async open() {
    this.logger.debug("Opening file repository");

    this.client = new WebTorrent({
      tracker: {
        rtcConfig: this.transporterConfig,
        announce: this.trackers,
      },
    });
  }

  async close() {
    this.logger.debug("Closing file repository");

    await new Promise<void>((res, rej) =>
      this.client?.destroy((e: any) => (e ? rej(e) : res()))
    );
  }

  async seed(content: Uint8Array) {
    this.logger.debug("Seeding");

    if (this.client) {
      return await new Promise<string>((res, rej) => {
        try {
          const dataToSeed = Buffer.from(content);

          (dataToSeed as any)["name"] = FILE_NAME;

          this.client!.seed(dataToSeed, {}, (
            torrent // We check above
          ) => res(torrent.magnetURI));
        } catch (e) {
          rej(e);
        }
      });
    } else {
      throw new ClosedError("FileRepository");
    }
  }

  async add(magnetURI: string) {
    this.logger.debug("Adding", { magnetURI });

    if (this.client) {
      const existingTorrent = this.client!.get(magnetURI); // We check above

      if (existingTorrent) {
        return await new Promise<Uint8Array>((res, rej) => {
          try {
            // We check above
            const file = existingTorrent.files[0];

            if (file) {
              file!.getBuffer((e, buf) => {
                if (e) {
                  rej(e);
                } else {
                  res(new Uint8Array(buf!)); // We check with e above
                }
              }); // We check above
            } else {
              rej(new FileNotInTorrentError());
            }
          } catch (e) {
            rej(e);
          }
        });
      } else {
        return await new Promise<Uint8Array>((res, rej) => {
          try {
            this.client!.add(magnetURI, {}, (torrent) => {
              // We check above
              const file = torrent.files[0];

              if (file) {
                file!.getBuffer((e, buf) => {
                  if (e) {
                    rej(e);
                  } else {
                    res(new Uint8Array(buf!)); // We check with e above
                  }
                }); // We check above
              } else {
                rej(new FileNotInTorrentError());
              }
            });
          } catch (e) {
            rej(e);
          }
        });
      }
    } else {
      throw new ClosedError("FileRepository");
    }
  }

  async remove(magnetURI: string) {
    this.logger.debug("Removing", { magnetURI });

    if (this.client) {
      await new Promise<void>((res, rej) =>
        this.client!.remove(magnetURI, {}, (e) => (e ? rej(e) : res()))
      ); // We check above
    } else {
      throw new ClosedError("FileRepository");
    }
  }
}
