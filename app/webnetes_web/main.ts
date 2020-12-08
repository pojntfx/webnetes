(window as any).setImmediate = window.setInterval; // Polyfill

import { FileRepository } from "../../lib/file-repository";
import { NetworkInterface } from "../../lib/network-interface";

(async () => {
  const repo = new FileRepository();

  try {
    await repo.open();

    const magnetLink = await repo.seed(
      new TextEncoder().encode("Hello, world!")
    );

    console.log(magnetLink);
  } finally {
    // await repo.close();
  }
})();

(async () => {
  const iface = new NetworkInterface(
    {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    },
    "ws://localhost:6999",
    1000,
    "127.0.0"
  );

  try {
    await iface.open();
  } finally {
    await iface.close();
  }
})();
