export class ProcessDoesNotExistError extends Error {
  constructor() {
    super("terminal does not exist");
  }
}
