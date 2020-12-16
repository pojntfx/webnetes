import { IFrameTranscoder } from "./frame-transcoder";

export interface IIOFrame<T> {
  resourceType: T;
  resourceId: string;
  msg: Uint8Array;
  nodeId: string;
}

export class IOFrameTranscoder<T> implements IFrameTranscoder<IIOFrame<T>> {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  encode(decoded: IIOFrame<T>) {
    return this.encoder.encode(JSON.stringify(decoded));
  }

  decode(encoded: Uint8Array) {
    return JSON.parse(this.decoder.decode(encoded)) as IIOFrame<T>;
  }
}
