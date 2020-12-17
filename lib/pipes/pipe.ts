import Emittery from "emittery";
import { Frame, FrameTranscoder } from "../utils/transcoder";

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

export abstract class Pipe<C, T> implements IPipe<C, T> {
  protected bus = new Emittery();
  protected frames = [] as Uint8Array[];
  protected transcoder = new FrameTranscoder<T>();

  abstract open(config: C): Promise<void>;
  abstract close(): Promise<void>;

  async read() {
    let msg: Uint8Array;
    if (this.frames.length !== 0) {
      msg = this.frames.shift()!;
    } else {
      msg = (await this.bus.once(this.getReadKey())) as Uint8Array;

      this.frames.shift();
    }

    const frame = this.transcoder.decode(msg);

    return frame;
  }

  abstract write(
    resourceType: T,
    resourceId: string,
    msg: Uint8Array,
    nodeId: string
  ): Promise<void>;

  protected async queue(frame: Frame<T>) {
    const encodedFrame = this.transcoder.encode(frame);

    this.frames.push(encodedFrame);
    await this.bus.emit(this.getReadKey(), encodedFrame);
  }

  protected getReadKey() {
    return "read";
  }
}
