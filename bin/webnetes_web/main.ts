(window as any).setImmediate = window.setInterval; // Polyfill

import { NetworkInterface } from "../../lib/network-interface";

(async () => {
  const iface = new NetworkInterface();

  try {
    await iface.open();
  } finally {
    await iface.close();
  }
})();
