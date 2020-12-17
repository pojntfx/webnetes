export class ResourceNotImplementedError extends Error {
  constructor(resourceType: string) {
    super(`resource ${resourceType} not implemented`);
  }
}
