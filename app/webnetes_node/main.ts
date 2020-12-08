#!/usr/bin/env node

import { FileRepository } from "../../lib/file-repository";
import { NetworkInterface } from "../../lib/network-interface";

(async () => {
  const repo = new FileRepository();

  try {
    await repo.open();
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
