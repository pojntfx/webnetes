import { WebnetesManager } from "../../lib/management/webnetes-manager";
import { IResource } from "../../lib/models/resource";

(window as any).setImmediate = window.setInterval; // Polyfill

const resources = [
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Runtime",
    metadata: {
      name: "Generic WASI",
      label: "wasi_generic",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Runtime",
    metadata: {
      name: "TinyGo WASI",
      label: "wasi_tinygo",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Runtime",
    metadata: {
      name: "Go JSSI",
      label: "jssi_go",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Runtime",
    metadata: {
      name: "TinyGo JSSI",
      label: "jssi_tinygo",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Capability",
    metadata: {
      name: "Binding aliases",
      label: "bind_alias",
    },
    spec: {
      privileged: true,
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Capability",
    metadata: {
      name: "Connecting to aliases",
      label: "connect_to_alias",
    },
    spec: {
      privileged: false,
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Processor",
    metadata: {
      name: "Felicitas's iPhone",
      label: "felicitass_iphone",
    },
    spec: {
      runtimes: ["wasi_generic", "wasi_tinygo", "jssi_go", "jssi_tinygo"],
      capabilities: ["bind_alias", "connect_to_alias"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "StunServer",
    metadata: {
      name: "Google STUN Server",
      label: "google",
    },
    spec: {
      urls: ["stun:stun.l.google.com:19302"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "StunServer",
    metadata: {
      name: "Twillio STUN Server",
      label: "twillio",
    },
    spec: {
      urls: ["stun:global.stun.twilio.com:3478?transport=udp"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "TurnServer",
    metadata: {
      name: "Twillio TURN Server",
      label: "twillio",
    },
    spec: {
      urls: ["turn:global.turn.twilio.com:3478?transport=tcp"],
      username:
        "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Signaler",
    metadata: {
      name: "Public unisockets Signaling Server",
      label: "unisockets_public",
    },
    spec: {
      urls: ["wss://unisockets.herokuapp.com"],
      retryAfter: 1000,
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Network",
    metadata: {
      name: "Public unisockets network",
      label: "unisockets_public",
    },
    spec: {
      signaler: "unisockets_public",
      stunServers: ["google", "twillio"],
      turnServers: ["twillio"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Subnet",
    metadata: {
      name: "Echo Network",
      label: "echo_network",
    },
    spec: {
      network: "unisockets_public",
      prefix: "127.0.0",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Tracker",
    metadata: {
      name: "OpenWebTorrent",
      label: "openwebtorrent",
    },
    spec: {
      urls: ["wss://tracker.openwebtorrent.com"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Tracker",
    metadata: {
      name: "Fastcast",
      label: "fastcast",
    },
    spec: {
      urls: ["wss://tracker.fastcast.nz"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Repository",
    metadata: {
      name: "Public WebTorrent",
      label: "webtorrent_public",
    },
    spec: {
      trackers: ["openwebtorrent", "fastcast"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "File",
    metadata: {
      name: "C Echo Server Binary",
      label: "c_echo_server",
    },
    spec: {
      repository: "webtorrent_public",
      uri:
        "magnet:?xt=urn:btih:9c2a3309dedf5a934569a40b0a739fb85e05f3ef&dn=echo_server_c.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "File",
    metadata: {
      name: "TinyGo WASI Echo Server Binary",
      label: "tinygo_wasi_echo_server",
    },
    spec: {
      repository: "webtorrent_public",
      uri:
        "magnet:?xt=urn:btih:a035f32c84233c3b8f465d7b4ba3a08b31fb8a55&dn=echo_server_wasi.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "File",
    metadata: {
      name: "TinyGo JSSI Echo Server Binary",
      label: "tinygo_jssi_echo_server",
    },
    spec: {
      repository: "webtorrent_public",
      uri:
        "magnet:?xt=urn:btih:b22689979afc5060480fe44304afd8e9d5f127d8&dn=echo_server_jssi.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "File",
    metadata: {
      name: "Go Echo Server Binary",
      label: "go_echo_server",
    },
    spec: {
      repository: "webtorrent_public",
      uri:
        "magnet:?xt=urn:btih:e7104e306f5daf22f8b5fb16e7e3e19949b7229b&dn=echo_server_go.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Arguments",
    metadata: {
      name: "Echo Server Configuration",
      label: "echo_server",
    },
    spec: {
      argv: ["-laddr", "127.0.0.1:1234"],
    },
  },
  {
    apiVersion: "webnetes.felicitas.pojtinger.com/v1alpha1",
    kind: "Workload",
    metadata: {
      name: "Echo Server",
      label: "echo_server",
    },
    spec: {
      file: "c_echo_server",
      runtime: "wasi_generic",
      capabilities: ["bind_alias"],
      subnet: "echo_network",
      arguments: "echo_server",
    },
  },
];

(async () => {
  const mgr = new WebnetesManager();

  try {
    for (let resource of resources) {
      await mgr.applyResource(resource as IResource<any>);
    }
  } finally {
    // await mgr.close();
  }
})();
