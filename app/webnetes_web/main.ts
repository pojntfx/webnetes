import "xterm/css/xterm.css";
import { Node } from "../../lib/high-level/node";
import { Terminals } from "../../lib/repositories/terminals";
import { INetworkInterfaceSpec } from "../../lib/resources/network-interface";
import { EResourceKind } from "../../lib/resources/resource";

(window as any).setImmediate = window.setInterval; // Polyfill

const terminalsRoot = document.getElementById("terminals")!;
const terminals = new Terminals();
const logRoot = document.getElementById("log")!;
const log = (msg: string, ...args: any) => {
  const toAppend = `${new Date().toISOString()}\t${msg}\t${JSON.stringify(
    args
  )}`;

  if (logRoot.textContent) {
    logRoot.textContent += "\n" + toAppend;
  } else {
    logRoot.textContent = toAppend;
  }
};

const node = new Node(
  async (resource) => {
    log("Created resource", resource);
  },
  async (resource) => {
    log("Deleted resource", resource);

    if (resource.kind === EResourceKind.WORKLOAD) window.location.reload();
  },
  async (frame) => {
    log("Rejected resource", frame);
  },
  async (id) => {
    log("Management node acknowledged", id);
  },
  async (id) => {
    log("Management node joined", id);
  },
  async (id) => {
    log("Management node left", id);
  },
  async (metadata, spec, id) => {
    log("Resource node acknowledged", metadata, spec, id);
  },
  async (metadata, spec: INetworkInterfaceSpec, id) => {
    log("Resource node joined", metadata, spec, id);
  },
  async (metadata, spec, id) => {
    log("Resource node left", metadata, spec, id);
  },
  async (onStdin: (key: string) => Promise<void>, id) => {
    log("Creating terminal", id);

    const terminal = await terminals.create(onStdin, id);

    const terminalWrapper = document.createElement("div");
    terminalWrapper.setAttribute("id", id);
    terminalsRoot.appendChild(terminalWrapper);

    const terminalHeader = document.createElement("h3");
    terminalHeader.textContent = id;
    terminalWrapper.appendChild(terminalHeader);

    const terminalEl = document.createElement("div");
    terminalWrapper.appendChild(terminalEl);

    terminal.open(terminalEl);
  },
  async (id, msg) => {
    await terminals.write(id, msg);
  },
  async (id) => {
    log("Deleting terminal", id);

    await terminals.delete(id);

    document.getElementById(id)?.remove();
  },
  (id) => {
    const rawInput = prompt(`Please enter standard input for ${id}\n`);

    if (rawInput) return new TextEncoder().encode(rawInput);

    return null;
  }
);

document.getElementById("start-node")?.addEventListener("click", async () => {
  await node.open(
    (document.getElementById("node-config-input") as HTMLInputElement).value
  );

  document.getElementById("prestart")!.style.cssText = "display: none";
  document.getElementById("poststart")!.style.cssText = "display: block";

  document
    .getElementById("create-resources")
    ?.addEventListener(
      "click",
      async () =>
        await node.createResources(
          (document.getElementById("resources") as HTMLInputElement).value,
          (document.getElementById("node-id") as HTMLInputElement).value
        )
    );

  document
    .getElementById("delete-resources")
    ?.addEventListener(
      "click",
      async () =>
        await node.deleteResources(
          (document.getElementById("resources") as HTMLInputElement).value,
          (document.getElementById("node-id") as HTMLInputElement).value
        )
    );

  document
    .getElementById("seed-file-start")
    ?.addEventListener("click", async () => {
      const label = (document.getElementById(
        "seed-file-label"
      ) as HTMLInputElement).value;
      const name = (document.getElementById(
        "seed-file-name"
      ) as HTMLInputElement).value;
      const repo = (document.getElementById(
        "seed-file-repo"
      ) as HTMLInputElement).value;
      const file = (document.getElementById(
        "seed-file-file"
      ) as HTMLInputElement)?.files![0];

      await node.seedFile(
        label,
        name,
        repo,
        new Uint8Array(await file.arrayBuffer())
      );
    });
});
