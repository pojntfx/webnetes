export class TerminalDoesNotExistError extends Error {
  constructor(id: string) {
    super(`terminal ${id} does not exist`);
  }
}
