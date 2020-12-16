export interface IPipe<C, T> {
  open: (config: C) => Promise<void>;
  close: () => Promise<void>;
  read: () => Promise<{
    resourceType: T;
    resourceId: string;
    msg: Uint8Array;
    nodeId: string;
  }>;
  write: (
    resourceType: T,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ) => Promise<void>;
}
