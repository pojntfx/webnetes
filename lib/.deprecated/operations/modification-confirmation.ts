import { EMANAGEMENT_OPCODES, IManagementOperation } from "./operation";

export interface IModificationConfirmationData {
  id: string;
  success: boolean;
}

export class ModificationConfirmation<T>
  implements IManagementOperation<IModificationConfirmationData> {
  opcode = EMANAGEMENT_OPCODES.MODIFICATION_CONFIRMATION;

  data: IModificationConfirmationData;

  constructor(id: string, success: boolean) {
    this.data = {
      id,
      success,
    };
  }
}
