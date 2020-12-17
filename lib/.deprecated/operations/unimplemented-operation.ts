import { EMANAGEMENT_OPCODES } from "./operation";

export class UnimplementedOperationError extends Error {
  constructor(opcode: EMANAGEMENT_OPCODES) {
    super(`unimplemented operation ${opcode}`);
  }
}
