#!/usr/bin/env node

import { FileRepository } from "../../lib/storage/file-repository";
import { NetworkInterface } from "../../lib/networking/network-interface";

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
          urls: "stun:global.stun.twilio.com:3478?transport=udp",
        },
        {
          username:
            "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
          urls: "turn:global.turn.twilio.com:3478?transport=udp",
          credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
        },
        {
          username:
            "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
          urls: "turn:global.turn.twilio.com:3478?transport=tcp",
          credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
        },
        {
          username:
            "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
          urls: "turn:global.turn.twilio.com:443?transport=tcp",
          credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
        },
      ],
    },
    "wss://unisockets.herokuapp.com",
    1000,
    "127.0.0"
  );

  try {
    await iface.open();
  } finally {
    await iface.close();
  }
})();
