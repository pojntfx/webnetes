import { SignalingServer } from "@pojntfx/unisockets";
import getPort from "get-port";
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
      "127.0.0"
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
});
