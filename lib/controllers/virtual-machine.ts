import { WASI } from "@wasmer/wasi";
import { WasmFs } from "@wasmer/wasmfs";
import * as Asyncify from "asyncify-wasm";
import { v4 } from "uuid";
import Go from "../../vendor/go/wasm_exec.js";
import TinyGo from "../../vendor/tinygo/wasm_exec.js";
import TeaVM from "../../vendor/teavm/classes.wasm-runtime.js";
import { InstanceDoesNotExistError } from "../errors/instance-does-not-exist";
import { UnimplementedRuntimeError } from "../errors/unimplemented-runtime";
import { getLogger } from "../utils/logger";

export enum ERuntimes {
  WASI_GENERIC = "wasi_generic",
  WASI_TINYGO = "wasi_tinygo",
  JSSI_GO = "jssi_go",
  JSSI_TINYGO = "jssi_tinygo",
  JSSI_TEAVM = "jssi_teavm",
}

interface Container<T> {
  runtimeType: ERuntimes;
  instance: WebAssembly.Instance;
  runtime: T;
}

export class VirtualMachine {
  private containers = new Map<string, Container<any>>();

  private logger = getLogger();

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(
    private onStdout: (id: string, content: Uint8Array) => Promise<void>,
    private onStdin: (id: string) => Promise<Uint8Array>,
    private onStdinSync: (id: string) => Uint8Array | null
  ) {}

  async schedule(
    path: string,
    bin: Uint8Array,
    args: string[],
    env: any,
    imports: any,
    runtime: ERuntimes
  ) {
    this.logger.debug("Scheduling", {
      args: [path, ...args],
      env,
      imports,
      runtime,
    });

    const id = v4();

    let wasiBindings: any = {};
    if (typeof window !== "undefined") {
      wasiBindings = (await import("@wasmer/wasi/lib/bindings/browser"))
        .default;
    } else {
      wasiBindings = (await import("@wasmer/wasi/lib/bindings/node")).default;
    }

    let lowerI64Imports: any = async () => {};
    if (typeof window === "undefined") {
      lowerI64Imports = (await import("@wasmer/wasm-transformer"))
        .lowerI64Imports;
    } else {
      lowerI64Imports = (
        await import(
          "@wasmer/wasm-transformer/lib/unoptimized/wasm-transformer.esm.js"
        )
      ).lowerI64Imports;
    }

    switch (runtime) {
      case ERuntimes.WASI_GENERIC: {
        const wasmFs = new WasmFs();
        const wasi = new WASI({
          args: [path, ...args.map((arg) => arg.toString())],
          env,
          bindings: {
            ...wasiBindings,
            fs: wasmFs.fs,
          },
        });

        let stdinReadCounter = 0;
        wasmFs.volume.fds[0].node.read = (buffer: Buffer | Uint8Array) => {
          // First read is string, second read is end of string
          if (stdinReadCounter % 2 !== 0) {
            stdinReadCounter++;

            return 0;
          }

          let input = this.onStdinSync(id);
          if (input === null) return -1; // Canceled

          const rawStdin = this.decoder.decode(input) + "\n";

          const stdin = this.encoder.encode(rawStdin);
          buffer.set(stdin);

          return stdin.length;
        };
        wasmFs.volume.fds[1].node.write = (buffer: Buffer | Uint8Array) => {
          this.onStdout(id, new Uint8Array(buffer));

          return buffer.length;
        };
        wasmFs.volume.fds[2].node.write = (buffer: Buffer | Uint8Array) => {
          this.onStdout(id, new Uint8Array(buffer));

          return buffer.length;
        };

        const module = await WebAssembly.compile(await lowerI64Imports(bin));
        const instance = await Asyncify.instantiate(module, {
          ...wasi.getImports(module),
          ...imports,
          env,
        });

        this.containers.set(id, {
          runtimeType: runtime,
          instance,
          runtime: wasi,
        });

        return {
          id,
          memory: instance.exports.memory,
        };
      }

      case ERuntimes.WASI_TINYGO: {
        const wasmFs = new WasmFs();
        const wasi = new WASI({
          args: [path, ...args.map((arg) => arg.toString())],
          env,
          bindings: {
            ...wasiBindings,
            fs: wasmFs.fs,
          },
        });
        const go = new (TinyGo({
          read: (
            _: number,
            buffer: Uint8Array,
            ___: number,
            ____: number,
            _____: number,
            callback: Function
          ) => {
            new Promise<Uint8Array>(async (res) => {
              const input = await this.onStdin(id);

              buffer.set(input);

              res(input);
            }).then((input) => callback(null, input.length));
          },
          writeSync: (_: number, buffer: Uint8Array) => {
            this.onStdout(id, buffer);

            return buffer.length;
          },
        }))();

        go.argv = [path, ...args];
        go.env = env;

        let stdinReadCounter = 0;
        wasmFs.volume.fds[0].node.read = (buffer: Buffer | Uint8Array) => {
          // First read is string, second read is end of string
          if (stdinReadCounter % 2 !== 0) {
            stdinReadCounter++;

            return 0;
          }

          let input = this.onStdinSync(id);
          if (input === null) return -1; // Canceled

          const rawStdin = this.decoder.decode(input) + "\n";

          const stdin = this.encoder.encode(rawStdin);
          buffer.set(stdin);

          return stdin.length;
        };
        wasmFs.volume.fds[1].node.write = (buffer: Buffer | Uint8Array) => {
          this.onStdout(id, new Uint8Array(buffer));

          return buffer.length;
        };
        wasmFs.volume.fds[2].node.write = (buffer: Buffer | Uint8Array) => {
          this.onStdout(id, new Uint8Array(buffer));

          return buffer.length;
        };

        const module = await WebAssembly.compile(await lowerI64Imports(bin));
        const instance = await Asyncify.instantiate(module, {
          ...wasi.getImports(module),
          ...imports,
          env: {
            ...go.importObject.env,
            ...env,
          },
        });

        this.containers.set(id, {
          runtimeType: runtime,
          instance,
          runtime: wasi,
        });

        return {
          id,
          memory: instance.exports.memory,
        };
      }

      case ERuntimes.JSSI_GO: {
        const go = new (Go({
          read: (
            _: number,
            buffer: Uint8Array,
            ___: number,
            ____: number,
            _____: number,
            callback: Function
          ) => {
            new Promise<Uint8Array>(async (res) => {
              const input = await this.onStdin(id);

              buffer.set(input);

              res(input);
            }).then((input) => callback(null, input.length));
          },
          writeSync: (_: number, buffer: Uint8Array) => {
            this.onStdout(id, buffer);

            return buffer.length;
          },
        }))();

        go.argv = [path, ...args];
        go.env = env;

        const module = await WebAssembly.compile(bin);
        const instance = await WebAssembly.instantiate(module, go.importObject);

        (global as any).jssiImports = {
          ...(global as any).jssiImports,
          ...imports,
          ...env,
        };

        this.containers.set(id, {
          runtimeType: runtime,
          instance,
          runtime: go,
        });

        return {
          id,
          memory: instance.exports.mem,
        };
      }

      case ERuntimes.JSSI_TINYGO: {
        const go = new (TinyGo({
          read: (
            _: number,
            buffer: Uint8Array,
            ___: number,
            ____: number,
            _____: number,
            callback: Function
          ) => {
            new Promise<Uint8Array>(async (res) => {
              const input = await this.onStdin(id);

              buffer.set(input);

              res(input);
            }).then((input) => callback(null, input.length));
          },
          writeSync: (_: number, buffer: Uint8Array) => {
            this.onStdout(id, buffer);

            return buffer.length;
          },
        }))();

        go.argv = [path, ...args];
        go.env = env;

        const module = await WebAssembly.compile(bin);
        const instance = await WebAssembly.instantiate(module, go.importObject);

        (global as any).jssiImports = {
          ...(global as any).jssiImports,
          ...imports,
          ...env,
        };

        this.containers.set(id, {
          runtimeType: runtime,
          instance,
          runtime: go,
        });

        return {
          id,
          memory: instance.exports.memory,
        };
      }

      case ERuntimes.JSSI_TEAVM: {
        const teavm = TeaVM((stdout: string) =>
          this.onStdout(id, this.encoder.encode(stdout))
        );

        let importObject: any = {};
        teavm.wasm.importDefaults(importObject);

        const module = await WebAssembly.compile(bin);
        const instance = await WebAssembly.instantiate(module, importObject);

        importObject.teavm.logString.memory = instance.exports.memory;

        (global as any).jssiImports = {
          ...(global as any).jssiImports,
          ...imports,
          ...env,
        };

        this.containers.set(id, {
          runtimeType: runtime,
          instance,
          runtime: teavm,
        });

        return {
          id,
          memory: instance.exports.memory,
        };
      }

      default: {
        throw new UnimplementedRuntimeError();
      }
    }
  }

  async start(id: string) {
    this.logger.verbose("Starting", { id });

    if (this.containers.has(id)) {
      const container = this.containers.get(id)!; // We check with `.has`

      switch (container.runtimeType) {
        case ERuntimes.WASI_GENERIC: {
          (container as Container<WASI>).runtime.start(container.instance);

          break;
        }

        case ERuntimes.WASI_TINYGO: {
          (container as Container<WASI>).runtime.start(container.instance);

          break;
        }

        case ERuntimes.JSSI_GO: {
          await (container as Container<any>).runtime.run(container.instance);

          break;
        }

        case ERuntimes.JSSI_TINYGO: {
          await (container as Container<any>).runtime.run(container.instance);

          break;
        }

        case ERuntimes.JSSI_TEAVM: {
          ((container as Container<any>).instance.exports as any).main();

          break;
        }

        default: {
          throw new UnimplementedRuntimeError();
        }
      }
    } else {
      throw new InstanceDoesNotExistError(id);
    }
  }
}
