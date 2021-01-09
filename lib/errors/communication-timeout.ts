export class CommunicationTimeoutError extends Error {
  constructor() {
    super("communication timeout reached");
  }
}
