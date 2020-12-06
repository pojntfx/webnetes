import { NetworkInterface } from "./network-interface";

const testTransporterConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

describe("NetworkInterface", () => {
  let instance: NetworkInterface;

  beforeEach(() => {
    instance = new NetworkInterface(testTransporterConfig);
  });

  describe("lifecycle", () => {
    describe("open", () => {
      it("should open", async () => {
        await instance.open();
      });

      it("should allow opening more than once", async () => {
        await instance.open();
        await instance.open();
      });

      afterEach(async () => {
        await instance.close();
      });
    });

    describe("close", () => {
      beforeEach(async () => {
        await instance.open();
      });

      it("should close", async () => {
        await instance.close();
      });
    });

    describe("close without opening", () => {
      it("should close", async () => {
        await instance.close();
      });

      it("should allow closing more than once", async () => {
        await instance.close();
        await instance.close();
      });
    });
  });
});
