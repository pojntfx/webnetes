export class TerminalDoesNotExistError extends Error {
  constructor() {
    super("terminal does not exist");
  }
}
