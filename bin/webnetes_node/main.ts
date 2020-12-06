#!/usr/bin/env node

import { NetworkInterface } from "../../lib/network-interface";

(async () => {
  const iface = new NetworkInterface();

  try {
    await iface.open();
  } finally {
    await iface.close();
  }
})();
