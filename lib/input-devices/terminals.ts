import { Terminal } from "xterm";
import { TerminalDoesNotExistError } from "../errors/terminal-does-not-exist";

export class Terminals {
  private terminals = new Map<string, Terminal>();

  async create(onStdin: (key: string) => Promise<void>, id: string) {
    const terminal = new Terminal();

    terminal.onData(onStdin);
    this.terminals.set(id, terminal);

    return terminal;
  }

  async get(id: string) {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!; // We check above
    } else {
      throw new TerminalDoesNotExistError();
    }
  }
}
