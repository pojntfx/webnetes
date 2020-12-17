export class ResourceDoesAlreadyExistError extends Error {
  constructor() {
    super("resource does already exist");
  }
}
