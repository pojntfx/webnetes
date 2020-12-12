import { IModificationData } from "./modification";
import { IModificationConfirmationData } from "./modification-confirmation";

export enum EMANAGEMENT_OPCODES {
  MODIFICATION = "modification",
  MODIFICATION_CONFIRMATION = "modificationConfirmation",
}

export type TManagementData = IModificationData | IModificationConfirmationData;

export interface IManagementOperation<T> {
  opcode: EMANAGEMENT_OPCODES;

  data: T;
}
