export class ResourceDoesAlreadyExistError extends Error {
  constructor(label: string) {
    super(`resource ${label} does already exist`);
  }
}
