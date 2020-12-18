export class InstanceDoesNotExistError extends Error {
  constructor(label: string) {
    super(`instance ${label} does not exist`);
  }
}
