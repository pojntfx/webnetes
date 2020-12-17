import { Arguments } from "./arguments";
import { Capability } from "./capability";
import { File } from "./file";
import { Network } from "./network";
import { Processor } from "./processor";
import { Repository } from "./repository";
import { EResourceKind, IResource } from "./resource";
import { Runtime } from "./runtime";
import { Signaler } from "./signaler";
import { StunServer } from "./stunserver";
import { Subnet } from "./subnet";
import { Tracker } from "./tracker";
import { TurnServer } from "./turnserver";
import { Workload } from "./workload";

const argumentsData = require("./arguments.data.json");
const capabilityData = require("./capability.data.json");
const fileData = require("./file.data.json");
const networkData = require("./network.data.json");
const processorData = require("./processor.data.json");
const repositoryData = require("./repository.data.json");
const runtimeData = require("./runtime.data.json");
const signalerData = require("./signaler.data.json");
const stunserverData = require("./stunserver.data.json");
const subnetData = require("./subnet.data.json");
const trackerData = require("./tracker.data.json");
const turnserverData = require("./turnserver.data.json");
const workloadData = require("./workload.data.json");

describe("Models", () => {
  test.each([
    [argumentsData],
    [capabilityData],
    [fileData],
    [networkData],
    [processorData],
    [repositoryData],
    [runtimeData],
    [signalerData],
    [stunserverData],
    [subnetData],
    [trackerData],
    [turnserverData],
    [workloadData],
  ])("%s should be %s", (resource: IResource<any>) => {
    let actual: any = {};

    switch (resource.kind) {
      case EResourceKind.ARGUMENTS: {
        actual = new Arguments(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.CAPABILITY: {
        actual = new Capability(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.FILE: {
        actual = new File(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.NETWORK: {
        actual = new Network(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.PROCESSOR: {
        actual = new Processor(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.REPOSITORY: {
        actual = new Repository(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.RUNTIME: {
        actual = new Runtime(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.SIGNALER: {
        actual = new Signaler(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.STUNSERVER: {
        actual = new StunServer(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.SUBNET: {
        actual = new Subnet(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.TRACKER: {
        actual = new Tracker(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.TURNSERVER: {
        actual = new TurnServer(resource.metadata, resource.spec);

        break;
      }

      case EResourceKind.WORKLOAD: {
        actual = new Workload(resource.metadata, resource.spec);

        break;
      }
    }

    expect(actual).toMatchSnapshot();
  });
});
