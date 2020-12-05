(window as any).setImmediate = window.setInterval; // Polyfill

import { VirtualMachine } from "../../lib/virtual-machine";

(async () => {
  const vm = new VirtualMachine();

  await vm.open();
})();
