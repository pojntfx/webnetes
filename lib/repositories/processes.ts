import { Terminal } from "xterm";
import { TerminalDoesNotExistError } from "../errors/terminal-does-not-exist";

export class Processes {
  private processes = new Map<string, Terminal>();

  async create(onStdout: (key: string) => Promise<void>, id: string) {
    const terminal = new Terminal();

    terminal.onData(onStdout);
    this.processes.set(id, terminal);

    return terminal;
  }

  async get(id: string) {
    if (this.processes.has(id)) {
      return this.processes.get(id)!; // We check above
    } else {
      throw new TerminalDoesNotExistError();
    }
  }
}
