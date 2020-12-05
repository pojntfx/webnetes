#!/usr/bin/env node

import { VirtualMachine } from "../../lib/virtual-machine";

(async () => {
  const vm = new VirtualMachine();

  await vm.open();
})();
