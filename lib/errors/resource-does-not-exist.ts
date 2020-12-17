export class ResourceDoesNotExistError extends Error {
  constructor(label: string) {
    super(`resource ${label} does not exist`);
  }
}
