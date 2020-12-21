export class InstanceDoesAlreadyExistError extends Error {
  constructor(label: string) {
    super(`instance ${label} does already exist`);
  }
}
