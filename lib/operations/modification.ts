import { IResource } from "../models/resource";
import { EMANAGEMENT_OPCODES, IManagementOperation } from "./operation";

export interface IModificationData {
  id: string;
  resource: Uint8Array;
  remove: boolean;
}

export class Modification<T>
  implements IManagementOperation<IModificationData> {
  opcode = EMANAGEMENT_OPCODES.MODIFICATION;

  data: IModificationData;

  constructor(id: string, resource: IResource<T>[], remove: boolean) {
    this.data = {
      id,
      resource: new TextEncoder().encode(JSON.stringify(resource)),
      remove,
    };
  }
}