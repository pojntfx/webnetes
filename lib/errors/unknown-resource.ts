export class UnknownResourceError extends Error {
  constructor(resourceType: string) {
    super(`resource ${resourceType} is not known`);
  }
}
