import "xterm/css/xterm.css";
import { Node } from "../../lib/high-level/node";
import { Terminals } from "../../lib/repositories/terminals";
import { ISubnetSpec } from "../../lib/resources/subnet";

(window as any).setImmediate = window.setInterval; // Polyfill

const exampleNodeConfig = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Signaler
metadata:
  name: Public unisockets Signaling Server
  label: unisockets_public
spec:
  urls:
    - wss://unisockets.herokuapp.com
  retryAfter: 1000
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: StunServer
metadata:
  name: Google STUN Server
  label: google
spec:
  urls:
    - stun:stun.l.google.com:19302
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
    - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Subnet
metadata:
  name: Management Network
  label: management_network
spec:
  network: ""
  prefix: 127.0.0
`;

const exampleServerResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Go JSSI
  label: jssi_go
spec: {}
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Capability
metadata:
  name: Binding aliases
  label: bind_alias
spec:
  privileged: true
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Processor
metadata:
  name: Felicitas's iPhone
  label: felicitass_iphone
spec:
  runtimes:
  - jssi_go
  capabilities:
  - bind_alias
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: StunServer
metadata:
  name: Google STUN Server
  label: google
spec:
  urls:
  - stun:stun.l.google.com:19302
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Signaler
metadata:
  name: Public unisockets Signaling Server
  label: unisockets_public
spec:
  urls:
  - wss://unisockets.herokuapp.com
  retryAfter: 1000
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Network
metadata:
  name: Public unisockets network
  label: unisockets_public
spec:
  signaler: unisockets_public
  stunServers:
  - google
  turnServers:
  - twillio_udp
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Subnet
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.0.0
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Tracker
metadata:
  name: OpenWebTorrent
  label: openwebtorrent
spec:
  urls:
  - wss://tracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Tracker
metadata:
  name: Fastcast
  label: fastcast
spec:
  urls:
  - wss://tracker.fastcast.nz
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Repository
metadata:
  name: Public WebTorrent
  label: webtorrent_public
spec:
  trackers:
  - openwebtorrent
  - fastcast
  stunServers:
  - google
  turnServers:
  - twillio_udp
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: Go Echo Server Binary
  label: go_echo_server
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:6891bba71f536bf8e80796cc3f6e4f99bc49faa9&dn=echo_server.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Server Configuration
  label: echo_server
spec:
  argv:
  - "-laddr"
  - 127.0.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: Go Echo Server
  label: go_echo_server
spec:
  file: go_echo_server
  runtime: jssi_go
  capabilities:
  - bind_alias
  subnet: echo_network
  arguments: echo_server
  terminalLabel: my_terminal_label
  terminalHostNodeId: my_terminal_host_node_id
`;

const exampleClientResourcesToCreate = exampleServerResourcesToCreate; // TODO: Create actual example resources

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
  async (metadata, spec: ISubnetSpec, id) => {
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
    log("Deleting terminal");

    await terminals.delete(id);

    document.getElementById(id)?.remove();
  }
);

document
  .getElementById("load-example-node-config")
  ?.addEventListener(
    "click",
    async () =>
      ((document.getElementById(
        "node-config-input"
      ) as HTMLInputElement).value = exampleNodeConfig)
  );

document
  .getElementById("load-example-server-resources")
  ?.addEventListener(
    "click",
    async () =>
      ((document.getElementById(
        "resources"
      ) as HTMLInputElement).value = exampleServerResourcesToCreate)
  );

document
  .getElementById("load-example-client-resources")
  ?.addEventListener(
    "click",
    async () =>
      ((document.getElementById(
        "resources"
      ) as HTMLInputElement).value = exampleClientResourcesToCreate)
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
