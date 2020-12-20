import "xterm/css/xterm.css";
import { Node } from "../../lib/high-level/node";
import { EPeersResources } from "../../lib/pipes/peers";
import { Terminals } from "../../lib/repositories/terminals";
import { Arguments } from "../../lib/resources/arguments";
import { Capability } from "../../lib/resources/capability";
import { File } from "../../lib/resources/file";
import { Network } from "../../lib/resources/network";
import { Processor } from "../../lib/resources/processor";
import { Repository } from "../../lib/resources/repository";
import { IResource } from "../../lib/resources/resource";
import { Runtime } from "../../lib/resources/runtime";
import { Signaler } from "../../lib/resources/signaler";
import { StunServer } from "../../lib/resources/stunserver";
import { Subnet } from "../../lib/resources/subnet";
import { Tracker } from "../../lib/resources/tracker";
import { TurnServer } from "../../lib/resources/turnserver";
import { Workload } from "../../lib/resources/workload";
import { Frame } from "../../lib/utils/frame-transcoder";

(window as any).setImmediate = window.setInterval; // Polyfill

const nodeConfiguration = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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

const resourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  terminalLabel: $TERMINAL_LABEL
  terminalHostNodeId: $TERMINAL_HOST_NODE_ID
`;

const terminalsRoot = document.getElementById("terminals")!;
const terminals = new Terminals();
const node = new Node(
  async (resource: IResource<any>) => {
    console.log("Created resource", resource);
  },
  async (resource: IResource<any>) => {
    console.log("Deleted resource", resource);
  },
  async (frame: Frame<EPeersResources>) => {
    console.error("Rejected resource", frame);
  },
  async (onStdin: (key: string) => Promise<void>, id: string) => {
    console.log("Creating terminal", onStdin, id);

    const terminal = await terminals.create(onStdin, id);

    const terminalEl = document.createElement("div");
    terminalEl.setAttribute("id", id);
    terminalsRoot.appendChild(terminalEl);

    terminal.open(terminalEl);
  },
  async (id: string, msg: string) => {
    console.log("Writing to terminal");

    await terminals.write(id, msg);
  },
  async (id: string) => {
    console.log("Deleting terminal");

    await terminals.delete(id);

    document.getElementById(id)?.remove();
  }
);

(async () => {
  await node.open(nodeConfiguration);

  document
    .getElementById("create-server-resources")
    ?.addEventListener("click", async () => {
      const nodeId = prompt("nodeId")!;
      const terminalLabel = prompt("terminalLabel")!;
      const terminalHostNodeId = prompt("terminalHostNodeId")!;

      await node.createResources(
        resourcesToCreate
          .replace("$TERMINAL_LABEL", terminalLabel)
          .replace("$TERMINAL_HOST_NODE_ID", terminalHostNodeId),
        nodeId
      );
    });

  document
    .getElementById("delete-server-resources")
    ?.addEventListener("click", async () => {
      const nodeId = prompt("nodeId")!;
      const terminalLabel = prompt("terminalLabel")!;
      const terminalHostNodeId = prompt("terminalHostNodeId")!;

      await node.deleteResources(
        [
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Runtime",
            metadata: {
              label: "jssi_go",
            },
            spec: {},
          } as Runtime,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Capability",
            metadata: {
              label: "bind_alias",
            },
            spec: {},
          } as Capability,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Processor",
            metadata: {
              label: "felicitass_iphone",
            },
            spec: {},
          } as Processor,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "StunServer",
            metadata: {
              label: "google",
            },
            spec: {},
          } as StunServer,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "TurnServer",
            metadata: {
              label: "twillio_udp",
            },
            spec: {},
          } as TurnServer,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Signaler",
            metadata: {
              label: "unisockets_public",
            },
            spec: {},
          } as Signaler,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Network",
            metadata: {
              label: "unisockets_public",
            },
            spec: {},
          } as Network,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Subnet",
            metadata: {
              label: "echo_network",
            },
            spec: {},
          } as Subnet,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Tracker",
            metadata: {
              label: "openwebtorrent",
            },
            spec: {},
          } as Tracker,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Tracker",
            metadata: {
              label: "fastcast",
            },
            spec: {},
          } as Tracker,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Repository",
            metadata: {
              label: "webtorrent_public",
            },
            spec: {},
          } as Repository,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "File",
            metadata: {
              label: "go_echo_server",
            },
            spec: {},
          } as File,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Arguments",
            metadata: {
              label: "echo_server",
            },
            spec: {},
          } as Arguments,
          {
            apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
            kind: "Workload",
            metadata: {
              label: "go_echo_server",
            },
            spec: {
              terminalLabel,
              terminalHostNodeId,
            },
          } as Workload,
        ],
        nodeId
      );
    });
})();
