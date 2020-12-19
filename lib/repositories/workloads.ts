import Emittery from "emittery";
import { v4 } from "uuid";
import { NetworkInterface } from "../controllers/network-interface";
import {
  ECapabilities,
  ERuntimes,
  VirtualMachine,
} from "../controllers/virtual-machine";
import { Arguments, IArgumentsSpec } from "../resources/arguments";
import { Capability } from "../resources/capability";
import { File } from "../resources/file";
import { IInstance } from "../resources/instance";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { Runtime } from "../resources/runtime";
import { Subnet } from "../resources/subnet";
import { IWorkloadSpec, Workload } from "../resources/workload";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export interface ILabeledFrame {
  id: string;
  label: string;
  msg: Uint8Array;
}

export class Workloads extends Repository<
  Arguments | Workload,
  IInstance<VirtualMachine>
> {
  private logger = getLogger();
  private bus = new Emittery();
  private labeledFrames = [] as ILabeledFrame[];

  constructor(
    private getFile: (label: File["metadata"]["label"]) => Promise<File>,
    private getFileInstance: (
      label: File["metadata"]["label"]
    ) => Promise<Uint8Array>,
    private getRuntime: (
      label: Runtime["metadata"]["label"]
    ) => Promise<Runtime>,
    private getCapability: (
      label: Capability["metadata"]["label"]
    ) => Promise<Capability>,
    private getSubnet: (label: Subnet["metadata"]["label"]) => Promise<Subnet>,
    private getSubnetInstance: (
      label: Subnet["metadata"]["label"]
    ) => Promise<NetworkInterface>
  ) {
    super();
  }

  async createArguments(metadata: IResourceMetadata, spec: IArgumentsSpec) {
    this.logger.debug("Creating arguments", { metadata });

    const args = new Arguments(metadata, spec);

    await this.addResource<Arguments>(
      args.apiVersion,
      args.kind,
      args.metadata,
      args.spec
    );
  }

  async createWorkload(
    metadata: IResourceMetadata,
    spec: IWorkloadSpec,
    onStdout: (msg: Uint8Array) => Promise<void>
  ) {
    this.logger.debug("Creating workload", { metadata });

    const [
      _,
      fileInstance,
      runtime,
      capabilities,
      __,
      subnetInstance,
      args,
    ] = await Promise.all([
      this.getFile(spec.file),
      this.getFileInstance(spec.file),
      this.getRuntime(spec.runtime),
      Promise.all(
        spec.capabilities.map(
          async (capability) => await this.getCapability(capability)
        )
      ),
      this.getSubnet(spec.subnet),
      this.getSubnetInstance(spec.subnet),
      this.getArguments(spec.arguments),
    ]);

    const workload = new Workload(metadata, spec);

    const workloadInstance = new VirtualMachine(
      async (_: string, content: Uint8Array) => await onStdout(content),
      async (_: string) => await this.readFromStdin(metadata.label)
    );

    const { memoryId, imports } = await subnetInstance.getImports();

    const { id, memory } = await workloadInstance.schedule(
      fileInstance,
      args.spec.argv,
      imports,
      {},
      (capabilities as unknown) as ECapabilities[],
      (runtime.metadata.label as unknown) as ERuntimes
    );

    await subnetInstance.setMemory(memoryId, memory);

    (async () => await workloadInstance.start(id))();

    await this.addInstance<IInstance<VirtualMachine>>(
      workload.apiVersion,
      workload.kind,
      workload.metadata,
      workloadInstance
    );

    await this.addResource<Workload>(
      workload.apiVersion,
      workload.kind,
      workload.metadata,
      workload.spec
    );
  }

  async getArguments(label: Arguments["metadata"]["label"]) {
    this.logger.debug("Getting arguments", { label });

    return this.findResource<Arguments>(
      API_VERSION,
      EResourceKind.ARGUMENTS,
      label
    );
  }

  private async readFromStdin(label: string) {
    let foundLabeledFrame: ILabeledFrame;
    if (this.labeledFrames.find((candidate) => candidate.label === label)) {
      foundLabeledFrame = this.labeledFrames.find(
        (candidate) => candidate.label === label
      )!; // We check above
    } else {
      foundLabeledFrame = JSON.parse(
        (await this.bus.once(this.getReadKey(label))!) as string
      ) as ILabeledFrame;
    }

    this.labeledFrames = this.labeledFrames.filter(
      (candidate) => candidate.id === foundLabeledFrame.id
    );

    return foundLabeledFrame.msg;
  }

  async writeToStdin(label: string, msg: Uint8Array) {
    const labeledFrame = { id: v4(), label, msg } as ILabeledFrame;

    this.labeledFrames.push(labeledFrame);
    await this.bus.emit(this.getReadKey(label), msg);
  }

  private getReadKey(label: string) {
    return `read label=${label}`;
  }
}