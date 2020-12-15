import { EMANAGEMENT_OPCODES, IManagementOperation } from "./operation";

export interface IIOModificationData {
  id: string;
  content: string; // base64 encoded Uint8Array
  write: boolean;
}

export class IOModification
  implements IManagementOperation<IIOModificationData> {
  opcode = EMANAGEMENT_OPCODES.IO_MODIFICATION;

  data: IIOModificationData;

  constructor(id: string, content: string, write: boolean) {
    this.data = {
      id,
      content,
      write,
    };
  }
}
