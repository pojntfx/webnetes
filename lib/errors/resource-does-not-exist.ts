export class ResourceDoesNotExistError extends Error {
  constructor() {
    super("resource does not exist");
  }
}
