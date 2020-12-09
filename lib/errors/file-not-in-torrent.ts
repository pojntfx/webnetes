export class FileNotInTorrentError extends Error {
  constructor() {
    super("file is not included in torrent");
  }
}
