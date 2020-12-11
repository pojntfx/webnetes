import { v4 } from "uuid";
import { UnimplementedRuntimeError } from "../errors/unimplemented-runtime";
import { WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import * as Asyncify from "asyncify-wasm";
import { InstanceDoesNotExistError } from "../errors/instance-does-not-exist";
const TinyGo = require("../../vendor/tinygo/wasm_exec.js");
const Go = require("../../vendor/go/wasm_exec.js");

export enum EPermissions {}

export enum ERuntimes {
  WASI_GENERIC = "wasi_generic",
  WASI_TINYGO = "wasi_tinygo",
  JSSI_GO = "jssi_go",
  JSSI_TINYGO = "jssi_tinygo",
}

interface Container<T> {
  runtimeType: ERuntimes;
  instance: WebAssembly.Instance;
  runtime: T;
}

export class VirtualMachine {
  private containers = new Map<string, Container<any>>();

  async schedule(
    bin: Uint8Array,
    args: string[],
    env: any,
    imports: any,
    permissions: EPermissions[],
    runtime: ERuntimes
  ) {
    const id = v4();

    switch (runtime) {
      case ERuntimes.WASI_GENERIC: {
        const wasmFs = new WasmFs();
        const wasi = new WASI({
          args,
          env: {},
          bindings: {
            ...wasiBindings,
            fs: wasmFs.fs,
          },
        });

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
          args,
          env: {},
          bindings: {
            ...wasiBindings,
            fs: wasmFs.fs,
          },
        });
        const go = new TinyGo();

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
        const go = new Go();

        const module = await WebAssembly.compile(bin);
        const instance = await WebAssembly.instantiate(module, go.importObject);

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
        const go = new TinyGo();

        const module = await WebAssembly.compile(bin);
        const instance = await WebAssembly.instantiate(module, go.importObject);

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

      default: {
        throw new UnimplementedRuntimeError();
      }
    }
  }

  async start(id: string) {
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
          await (container as Container<typeof Go>).runtime.run(
            container.instance
          );

          break;
        }

        case ERuntimes.JSSI_TINYGO: {
          await (container as Container<typeof TinyGo>).runtime.run(
            container.instance
          );

          break;
        }

        default: {
          throw new UnimplementedRuntimeError();
        }
      }
    } else {
      throw new InstanceDoesNotExistError();
    }
  }
}
