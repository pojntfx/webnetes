import { PeerPipe } from "../../lib/pipes/peer-pipe";

(window as any).setImmediate = window.setInterval; // Polyfill

const peers = new PeerPipe();

(async () => {
  await Promise.all([
    peers.open({
      transporter: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },
      signaler: {
        url: "wss://unisockets.herokuapp.com",
        retryAfter: 1000,
        prefix: "127.0.5",
      },
    }),
  ]);

  (async () => {
    try {
      while (true) {
        const { resourceType, resourceId, msg, nodeId } = await peers.read();

        console.log(resourceType, resourceId, msg, nodeId);
      }
    } catch (e) {
      throw e;
    } finally {
      await peers.close();
    }
  })();
})();
