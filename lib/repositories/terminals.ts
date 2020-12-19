import { Terminal } from "xterm";
import { TerminalDoesNotExistError } from "../errors/terminal-does-not-exist";

export class Terminals {
  private terminals = new Map<string, Terminal>();

  async create(onStdin: (key: string) => Promise<void>, id: string) {
    const terminal = new Terminal();

    terminal.onData(async (key: string) => {
      if (key.charCodeAt(0) === 13) {
        // Return
        await onStdin("\n\r");
      } else if (key.charCodeAt(0) === 127) {
        // Backspace
        await onStdin("\b \b");
      } else {
        await onStdin(key);
      }
    });

    this.terminals.set(id, terminal);

    return terminal;
  }

  async delete(id: string) {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!.dispose(); // We check above
    } else {
      throw new TerminalDoesNotExistError(id);
    }
  }

  async writeToStdout(id: string, msg: string) {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!.write(msg.replace(/\n/g, "\n\r")); // We check above
    } else {
      throw new TerminalDoesNotExistError(id);
    }
  }
}
