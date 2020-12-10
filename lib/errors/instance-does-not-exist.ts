export class InstanceDoesNotExistError extends Error {
  constructor() {
    super("instance does not exist");
  }
}
