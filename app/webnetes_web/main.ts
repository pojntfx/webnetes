(window as any).setImmediate = window.setInterval; // Polyfill

import { FileRepository } from "../../lib/file-repository";
import { NetworkInterface } from "../../lib/network-interface";

(async () => {
  const repo = new FileRepository();

  try {
    await repo.open();

    const magnetURI = await repo.seed(
      new TextEncoder().encode("Hello, world!")
    );

    console.log("Seeding:", magnetURI);

    try {
      const secondRepo = new FileRepository();
      await secondRepo.open();

      const contents = await secondRepo.add(magnetURI);

      console.log("Added:", contents);
    } finally {
      // await repo.close()
    }
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
