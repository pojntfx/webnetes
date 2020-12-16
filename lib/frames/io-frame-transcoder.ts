import { IFrameTranscoder } from "./frame-transcoder";

export interface IIOFrame {
  resourceType: EPeerPipeResourceTypes;
  resourceId: string;
  msg: Uint8Array;
  nodeId: string;
}

export class IOFrameTranscoder implements IFrameTranscoder<IIOFrame> {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  encode(decoded: IIOFrame) {
    return this.encoder.encode(JSON.stringify(decoded));
  }

  decode(encoded: Uint8Array) {
    return JSON.parse(this.decoder.decode(encoded));
  }
}
