import { IIOModificationData } from "./io-modification";
import { IModificationData } from "./modification";
import { IModificationConfirmationData } from "./modification-confirmation";

export enum EMANAGEMENT_OPCODES {
  MODIFICATION = "modification",
  MODIFICATION_CONFIRMATION = "modificationConfirmation",
  IO_MODIFICATION = "ioModification",
}

export type TManagementData =
  | IModificationData
  | IModificationConfirmationData
  | IIOModificationData;

export interface IManagementOperation<T> {
  opcode: EMANAGEMENT_OPCODES;

  data: T;
}
