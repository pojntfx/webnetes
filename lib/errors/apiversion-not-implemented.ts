export class APIVersionNotImplementedError extends Error {
  constructor(apiVersion: string) {
    super(`API ${apiVersion} version not implemented`);
  }
}
