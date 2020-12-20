import Emittery from "emittery";
import { Terminal } from "xterm";

export class Terminals {
  private bus = new Emittery();
  private terminals = new Map<string, Terminal>();

  async create(onStdin: (key: string) => Promise<void>, id: string) {
    const terminal = new Terminal();

    terminal.onData(async (key: string) => {
      if (key.charCodeAt(0) === 13) {
        // Return
        await onStdin("\n");
      } else if (key.charCodeAt(0) === 127) {
        // Backspace
        await onStdin("\b \b");
      } else {
        await onStdin(key);
      }
    });

    this.terminals.set(id, terminal);
    await this.bus.emit(this.getExistsKey(id), true);

    return terminal;
  }

  async delete(id: string) {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!.dispose(); // We check above
    } else {
      await this.bus.once(this.getExistsKey(id));

      await this.delete(id);
    }
  }

  async write(id: string, msg: string) {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!.write(msg.replace(/\n/g, "\n\r")); // We check above
    } else {
      await this.bus.once(this.getExistsKey(id));

      await this.write(id, msg);
    }
  }

  private getExistsKey(id: string) {
    return `exists id=${id}`;
  }
}
