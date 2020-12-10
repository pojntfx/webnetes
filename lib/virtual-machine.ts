import { v4 } from "uuid";
import { UnimplementedRuntimeError } from "./errors/unimplemented-runtime";
import { WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import * as Asyncify from "asyncify-wasm";
import { InstanceDoesNotExistError } from "./errors/instance-does-not-exist";

export enum EPermissions {}

export enum ERuntimes {
  WASI_GENERIC = "wasi_generic",
  WASI_TINYGO = "wasi_tinygo",
  JSSI_GO = "jssi_go",
  JSSI_TINYGO = "jssi_tinygo",
}

interface Container {
  runtimeType: ERuntimes;
  instance: WebAssembly.Instance;
  runtime: WASI;
}

export class VirtualMachine {
  private containers = new Map<string, Container>();

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
          container.runtime.start(container.instance);

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
