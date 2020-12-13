import { Manager } from "../../lib/aggregates/manager";
import { Worker } from "../../lib/aggregates/worker";
import { IResource } from "../../lib/models/resource";

(window as any).setImmediate = window.setInterval; // Polyfill

const exampleServerResources = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Go JSSI
  label: jssi_go
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
kind: StunServer
metadata:
  name: Twillio STUN Server
  label: twillio
spec:
  urls:
  - stun:global.stun.twilio.com:3478?transport=udp
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server
  label: twillio
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
  - twillio
  turnServers:
  - twillio
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
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: Go Echo Server Binary
  label: go_echo_server
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:f5a6d3714d888711b32b32a5afff7f2db27113d7&dn=echo_server.wasm&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337
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
`;

const exampleClientResources = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Go JSSI
  label: jssi_go
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Capability
metadata:
  name: Connecting to aliases
  label: connect_to_alias
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
  - connect_to_alias
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
kind: StunServer
metadata:
  name: Twillio STUN Server
  label: twillio
spec:
  urls:
  - stun:global.stun.twilio.com:3478?transport=udp
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server
  label: twillio
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
  - twillio
  turnServers:
  - twillio
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
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: Go Echo Client Binary
  label: go_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:251cc6a9a733ea8b44b5cad0827895bb194f0e27&dn=echo_client.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Server Configuration
  label: echo_client
spec:
  argv:
  - "-raddr"
  - 127.0.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: Go Echo Client
  label: go_echo_client
spec:
  file: go_echo_client
  runtime: jssi_go
  capabilities:
  - connect_to_alias
  subnet: echo_network
  arguments: echo_client
`;

const exampleManagerConfig = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: StunServer
metadata:
  name: Google STUN Server
  label: google
spec:
  urls:
  - stun:stun.l.google.com:19302
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: StunServer
metadata:
  name: Twillio STUN Server
  label: twillio
spec:
  urls:
  - stun:global.stun.twilio.com:3478?transport=udp
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server
  label: twillio
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
kind: Subnet
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: ""
  prefix: 127.0.0`;

document
  .getElementById("load-example-manager-config")
  ?.addEventListener("click", async () => {
    (document.getElementById(
      "manager-config-input"
    ) as HTMLTextAreaElement).value = exampleManagerConfig;
  });

document.getElementById("start")?.addEventListener("click", async () => {
  (document.getElementById("management") as HTMLTextAreaElement).style.cssText =
    "";

  const worker = new Worker(async () => window.location.reload());
  const manager = new Manager(
    (document.getElementById(
      "manager-config-input"
    ) as HTMLTextAreaElement).value,
    async (id: string) => {
      console.log("Node joined", id);

      const nodeText = document.createTextNode(id);
      const nodeEl = document.createElement("li");
      nodeEl.appendChild(nodeText);

      const nodeOption = document.createElement("option");
      nodeOption.setAttribute("value", id);
      nodeOption.appendChild(nodeText.cloneNode());

      document.getElementById("node-list")?.appendChild(nodeEl);
      document.getElementById("node-id-input")?.appendChild(nodeOption);
    },
    async (id: string) => {
      console.log("Node left", id);

      document
        .getElementById("node-list")
        ?.childNodes.forEach(
          (node) => node.textContent === id && node.remove()
        );
      document
        .getElementById("node-id-input")
        ?.childNodes.forEach(
          (node) => (node as HTMLOptionElement).value === id && node.remove()
        );
    },
    async (resources: IResource<any>[], remove: boolean, id: string) => {
      console.log("Modifying resources", resources, remove, id);

      if (remove) {
        await worker.deleteResources(resources);
      } else {
        await worker.createResources(resources);
      }
    }
  );

  await manager.open();

  document.getElementById("create")?.addEventListener("click", async () => {
    await manager.modifyResources(
      (document.getElementById("resource-input") as HTMLTextAreaElement).value,
      false,
      (document.getElementById("node-id-input") as HTMLSelectElement).value
    );
  });

  document.getElementById("delete")?.addEventListener("click", async () => {
    await manager.modifyResources(
      (document.getElementById("resource-input") as HTMLTextAreaElement).value,
      true,
      (document.getElementById("node-id-input") as HTMLSelectElement).value
    );
  });

  document
    .getElementById("load-example-server-resources")
    ?.addEventListener("click", async () => {
      (document.getElementById(
        "resource-input"
      ) as HTMLTextAreaElement).value = exampleServerResources;
    });

  document
    .getElementById("load-example-client-resources")
    ?.addEventListener("click", async () => {
      (document.getElementById(
        "resource-input"
      ) as HTMLTextAreaElement).value = exampleClientResources;
    });
});
