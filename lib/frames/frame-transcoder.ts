export interface IFrameTranscoder<F> {
  encode: (decoded: F) => Uint8Array;
  decode: (encoded: Uint8Array) => F;
}
