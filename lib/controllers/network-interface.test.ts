import { SignalingServer } from "@pojntfx/unisockets";
import getPort from "get-port";
import { ClosedError } from "../errors/closed";
import { NetworkInterface } from "./network-interface";

describe("NetworkInterface", () => {
  let networkInterface: NetworkInterface;
  const host = "localhost";
  let port: number;
  let signalingServer: SignalingServer;

  beforeEach(async () => {
    port = await getPort();
    signalingServer = new SignalingServer(host, port);

    await signalingServer.open();

    networkInterface = new NetworkInterface(
      {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },
      `ws://${host}:${port}`,
      1000,
      "127.0.0",
      async () => {},
      async () => {},
      async () => {}
    );
  });

  afterEach(async () => {
    await signalingServer.close();
  });

  describe("lifecycle", () => {
    describe("open", () => {
      it("should open", async () => {
        await networkInterface.open();
      });

      afterEach(async () => {
        await networkInterface.close();
      });
    });

    describe("close", () => {
      beforeEach(async () => {
        await networkInterface.open();
      });

      it("should close", async () => {
        await networkInterface.close();
      });
    });
  });

  describe("non-lifecycle", () => {
    describe("getImports", () => {
      describe("positive", () => {
        afterEach(async () => {
          await networkInterface.close();
        });

        beforeEach(async () => {
          await networkInterface.open();
        });

        it("should get the correct exports", async () => {
          const imports = await networkInterface.getImports();

          expect({
            ...imports,
            memoryId: null, // This one is a UUID
          }).toMatchSnapshot();
        });
      });

      describe("negative", () => {
        it("should throw if not open", async () => {
          expect(
            async () => await networkInterface.getImports()
          ).rejects.toBeInstanceOf(ClosedError);
        });
      });
    });

    describe("setMemory", () => {
      describe("positive", () => {
        let id: string;

        afterEach(async () => {
          await networkInterface.close();
        });

        beforeEach(async () => {
          await networkInterface.open();

          const { memoryId } = await networkInterface.getImports();

          id = memoryId;
        });

        it("should be possible to set the memory", async () => {
          await networkInterface.setMemory(id, new Uint8Array());
        });
      });

      describe("negative", () => {
        it("should throw if not open", async () => {
          expect(
            async () => await networkInterface.setMemory("", new Uint8Array())
          ).rejects.toBeInstanceOf(ClosedError);
        });
      });
    });
  });
});
