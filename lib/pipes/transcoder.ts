export interface Frame<T> {
  resourceType: T;
  resourceId: string;
  msg: Uint8Array;
  nodeId: string;
}

export class FrameTranscoder<T> {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  encode(decoded: Frame<T>) {
    return this.encoder.encode(JSON.stringify(decoded));
  }

  decode(encoded: Uint8Array) {
    return JSON.parse(this.decoder.decode(encoded)) as Frame<T>;
  }
}
