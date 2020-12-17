import { IResource } from "../resources/resource";

export class ResourceTranscoder {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  encode<T extends IResource<any>>(decoded: T) {
    return this.encoder.encode(JSON.stringify(decoded));
  }

  decode<T extends IResource<any>>(encoded: Uint8Array) {
    return JSON.parse(this.decoder.decode(encoded)) as T;
  }
}
