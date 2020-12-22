export class CapabilityNotImplementedError extends Error {
  constructor(label: string) {
    super(`capability ${label} not implemented`);
  }
}
