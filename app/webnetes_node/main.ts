#!/usr/bin/env node

import { spawn } from "child_process";
import Emittery from "emittery";
import fs from "fs";
import yargs from "yargs";
import { Node } from "../../lib/high-level/node";
import { INetworkInterfaceSpec } from "../../lib/resources/network-interface";
import { EResourceKind } from "../../lib/resources/resource";

const { config, resources, seed, seedLabel, seedName, seedRepository } = yargs(
  process.argv.slice(2)
).options({
  config: {
    description: "Node config resources",
    default: "node.yaml",
  },
  resources: {
    description:
      "Resources (see https://github.com/pojntfx/webnetes/tree/main/examples for examples)",
    default: "stack.yaml",
  },
  seed: {
    description: "Path to file to seed",
    default: "",
  },
  seedLabel: {
    description: "Label to give the file to seed",
    default: "data",
  },
  seedName: {
    description: "Name to give the file to seed",
    default: "data",
  },
  seedRepository: {
    description: "Repository to seed file from",
    default: "webtorrent_public",
  },
}).argv;

const log = (msg: string, ...args: any) => {
  const toAppend = `${new Date().toISOString()}\t${msg}\t${JSON.stringify(
    args
  )}`;

  console.log(toAppend);
};

const bus = new Emittery();

const node = new Node(
  async () => {
    log("Opened");

    await bus.emit("opened");
  },
  async (resource) => {
    log("Created resource", resource);
  },
  async (resource) => {
    log("Deleted resource", resource);

    if (resource.kind === EResourceKind.WORKLOAD) {
      spawn(process.execPath, process.argv.slice(1), {
        cwd: process.cwd(),
        detached: true,
        env: process.env,
        stdio: "inherit",
      }).unref();

      process.exit(0);
    }
  },
  async (frame) => {
    log("Rejected resource", frame);
  },
  async (id) => {
    log("Management node acknowledged", id);

    await bus.emit("acknowledged", id);
  },
  async (id) => {
    log("Management node joined", id);
  },
  async (id) => {
    log("Management node left", id);
  },
  async (metadata, spec, id) => {
    log("Resource node acknowledged", metadata, spec, id);
  },
  async (metadata, spec: INetworkInterfaceSpec, id) => {
    log("Resource node joined", metadata, spec, id);
  },
  async (metadata, spec, id) => {
    log("Resource node left", metadata, spec, id);
  },
  async (onStdin: (key: string) => Promise<void>, id) => {
    log("Creating terminal (STDOUT only)", id);
  },
  async (id, msg) => {
    console.log("STDOUT", id, msg);
  },
  async (id) => {
    log("Deleting terminal", id);
  },
  (id) => {
    console.error("STDIN not supported on node");

    process.exit(1);
  }
);

(async () => {
  (async () => {
    const [id]: any = await Promise.all([
      bus.once("acknowledged"),
      bus.once("opened"),
    ]);

    await node.createResources(
      new TextDecoder().decode(fs.readFileSync(resources)),
      id as string
    );

    if (seed !== "") {
      await node.seedFile(
        seedLabel,
        seedName,
        seedRepository,
        fs.readFileSync(seed)
      );
    }
  })();

  await node.open(new TextDecoder().decode(fs.readFileSync(config)));
})();
