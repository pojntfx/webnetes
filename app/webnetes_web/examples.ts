export const exampleNodeConfig = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Management Network
  label: management_network
spec:
  network: ""
  prefix: 127.0.0
`;

export const exampleGoEchoServerResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: Go Echo Server Binary
  label: go_echo_server
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:ee17dadf0826c30fe52aa4bdc85f8622f2e67c4c&dn=net_echo_server.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Server Configuration
  label: echo_server
spec:
  argv:
  - "-laddr"
  - 127.19.0.1:1234
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
  networkInterface: echo_network
  arguments: echo_server
  terminalLabel: echo_server
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleGoEchoClientResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Go JSSI
  label: jssi_go
spec: {}
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: Go Echo Client Binary
  label: go_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:df460c0d984192e170a47d433813b6fb9c2a78e4&dn=net_echo_client.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
  - "-raddr"
  - 127.19.0.1:1234
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
  networkInterface: echo_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleCEchoServerResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Generic WASI
  label: wasi_generic
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
  - wasi_generic
  capabilities:
  - bind_alias
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: C Echo Server Binary
  label: c_echo_server
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:7ce4b8286d1990c740e2dc4b7f5cc0a80849cbf9&dn=echo_server.wasm+copy&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Server Configuration
  label: echo_server
spec:
  argv:
  - "-laddr"
  - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: C Echo Server
  label: c_echo_server
spec:
  file: c_echo_server
  runtime: wasi_generic
  capabilities:
  - bind_alias
  networkInterface: echo_network
  arguments: echo_server
  terminalLabel: echo_server
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleCEchoClientResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: Generic WASI
  label: wasi_generic
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
  - wasi_generic
  capabilities:
  - connect_to_alias
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: C Echo Client Binary
  label: c_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:f2756491cafdebdd99127005b6a72037c0de2aa2&dn=echo_client.wasm+copy&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
  - "-raddr"
  - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: C Echo Client
  label: c_echo_client
spec:
  file: c_echo_client
  runtime: wasi_generic
  capabilities:
  - connect_to_alias
  networkInterface: echo_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleTinyGoEchoServerResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: TinyGo WASI
  label: wasi_tinygo
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
  - wasi_tinygo
  capabilities:
  - bind_alias
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: TinyGo Echo Server Binary
  label: tinygo_echo_server
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:a035f32c84233c3b8f465d7b4ba3a08b31fb8a55&dn=echo_server_wasi.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Server Configuration
  label: echo_server
spec:
  argv:
  - "-laddr"
  - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: TinyGo Echo Server
  label: tinygo_echo_server
spec:
  file: tinygo_echo_server
  runtime: wasi_tinygo
  capabilities:
  - bind_alias
  networkInterface: echo_network
  arguments: echo_server
  terminalLabel: echo_server
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleTinyGoEchoClientResourcesToCreate = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Runtime
metadata:
  name: TinyGo WASI
  label: wasi_tinygo
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
  - wasi_tinygo
  capabilities:
  - connect_to_alias
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
  name: Twillio TURN Server (UDP)
  label: twillio_udp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server (TCP)
  label: twillio_tcp
spec:
  urls:
  - turn:global.turn.twilio.com:3478?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: TurnServer
metadata:
  name: Twillio TURN Server Fallback (TCP)
  label: twillio_tcp_fallback
spec:
  urls:
  - turn:global.turn.twilio.com:443?transport=tcp
  username: f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d
  credential: w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=
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
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  - twillio
  turnServers:
  - twillio_udp
  - twillio_tcp
  - twillio_tcp_fallback
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: TinyGo Echo Client Binary
  label: tinygo_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:5d6ebf85764703ec3c61dfb0a1b01e773c1659b5&dn=echo_client_wasi.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
  - "-raddr"
  - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: TinyGo Echo Client
  label: tinygo_echo_client
spec:
  file: tinygo_echo_client
  runtime: wasi_tinygo
  capabilities:
  - connect_to_alias
  networkInterface: echo_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleGoEchoClientResourcesToCreateFragment = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  name: Felicitas's iPhone 2
  label: felicitass_iphone_2
spec:
  runtimes:
    - jssi_go
  capabilities:
    - connect_to_alias
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_client_network
spec:
  network: unisockets_public
  prefix: 127.19.0
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
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
    - "-raddr"
    - 127.19.0.1:1234
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
  networkInterface: echo_client_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleCEchoClientResourcesToCreateFragment = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  name: Felicitas's iPhone 2
  label: felicitass_iphone_2
spec:
  runtimes:
    - wasi_generic
  capabilities:
    - connect_to_alias
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_client_network
spec:
  network: unisockets_public
  prefix: 127.19.0
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: C Echo Client Binary
  label: c_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:f2756491cafdebdd99127005b6a72037c0de2aa2&dn=echo_client.wasm+copy&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
    - "-raddr"
    - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: C Echo Client
  label: c_echo_client
spec:
  file: c_echo_client
  runtime: wasi_generic
  capabilities:
    - connect_to_alias
  networkInterface: echo_client_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;

export const exampleTinyGoEchoClientResourcesToCreateFragment = `apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
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
  name: Felicitas's iPhone 2
  label: felicitass_iphone_2
spec:
  runtimes:
    - wasi_tinygo
  capabilities:
    - connect_to_alias
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: NetworkInterface
metadata:
  name: Echo Network
  label: echo_client_network
spec:
  network: unisockets_public
  prefix: 127.19.0
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: File
metadata:
  name: TinyGo Echo Client Binary
  label: tinygo_echo_client
spec:
  repository: webtorrent_public
  uri: magnet:?xt=urn:btih:5d6ebf85764703ec3c61dfb0a1b01e773c1659b5&dn=echo_client_wasi.wasm&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Arguments
metadata:
  name: Echo Client Configuration
  label: echo_client
spec:
  argv:
    - "-raddr"
    - 127.19.0.1:1234
---
apiVersion: webnetes.felicitas.pojtinger.com/v1alpha1
kind: Workload
metadata:
  name: TinyGo Echo Client
  label: tinygo_echo_client
spec:
  file: tinygo_echo_client
  runtime: wasi_tinygo
  capabilities:
    - connect_to_alias
  networkInterface: echo_client_network
  arguments: echo_client
  terminalLabel: echo_client
  terminalHostNodeId: my_terminal_host_node_id
`;
