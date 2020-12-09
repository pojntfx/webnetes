#!/usr/bin/env node

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

    const secondRepo = new FileRepository();
    try {
      await secondRepo.open();

      const contents = await secondRepo.add(magnetURI);

      console.log("Added:", contents);

      await secondRepo.remove(magnetURI);

      console.log("Removed from second repo:", magnetURI);
    } catch (e) {
      console.error("FileRepository error:", e);
    } finally {
      await secondRepo.close();
    }

    await repo.remove(magnetURI);

    console.log("Removed from first repo:", magnetURI);
  } catch (e) {
    console.error("FileRepository error:", e);
  } finally {
    await repo.close();
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
