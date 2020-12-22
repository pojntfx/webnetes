import Emittery from "emittery";
import { v4 } from "uuid";
import { filterImportsByCapabilities } from "../capabilities/filter";
import { NetworkInterface } from "../controllers/network-interface";
import { ERuntimes, VirtualMachine } from "../controllers/virtual-machine";
import { Arguments, IArgumentsSpec } from "../resources/arguments";
import { Capability } from "../resources/capability";
import { File } from "../resources/file";
import { IInstance } from "../resources/instance";
import { NetworkInterface as NetworkInterfaceResource } from "../resources/network-interface";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { Runtime } from "../resources/runtime";
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
    private getNetworkInterface: (
      label: NetworkInterfaceResource["metadata"]["label"]
    ) => Promise<NetworkInterfaceResource>,
    private getNetworkInterfaceInstance: (
      label: NetworkInterfaceResource["metadata"]["label"]
    ) => Promise<NetworkInterface>,
    private readFromStdinSync: (label: string) => Uint8Array | null
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

  async deleteArguments(metadata: IResourceMetadata) {
    this.logger.debug("Deleting arguments", { metadata });

    const args = new Arguments(metadata, {} as any);

    await this.removeResource<Arguments>(
      args.apiVersion,
      args.kind,
      args.metadata.label
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
      this.getNetworkInterface(spec.networkInterface),
      this.getNetworkInterfaceInstance(spec.networkInterface),
      this.getArguments(spec.arguments),
    ]);

    const workload = new Workload(metadata, spec);

    const workloadInstance = new VirtualMachine(
      async (_: string, content: Uint8Array) => await onStdout(content),
      async (_: string) => await this.readFromStdin(spec.terminalLabel),
      (_: string) => this.readFromStdinSync(spec.terminalLabel)
    );

    const { memoryId, imports } = await subnetInstance.getImports();

    const { id, memory } = await workloadInstance.schedule(
      `/bin/${metadata.label}`,
      fileInstance,
      args.spec.argv,
      filterImportsByCapabilities(
        capabilities.map((capability) => capability.metadata.label),
        imports
      ),
      {},
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

  async deleteWorkload(
    metadata: IResourceMetadata,
    onHandleInstanceDeletion: () => Promise<void>
  ) {
    this.logger.debug("Deleting workload", { metadata });

    const workload = new Workload(metadata, {} as any);

    await this.removeResource<Workload>(
      workload.apiVersion,
      workload.kind,
      workload.metadata.label
    );

    await this.removeInstance<IInstance<VirtualMachine>>(
      workload.apiVersion,
      workload.kind,
      workload.metadata.label
    );

    await onHandleInstanceDeletion();
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
      const found = JSON.parse(
        (await this.bus.once(this.getReadKey(label))!) as string
      ) as ILabeledFrame;

      found.msg = new Uint8Array(Object.values(found.msg));

      foundLabeledFrame = found;
    }

    this.labeledFrames = this.labeledFrames.filter(
      (candidate) => candidate.id !== foundLabeledFrame.id
    );

    return foundLabeledFrame.msg;
  }

  async writeToStdin(label: string, msg: Uint8Array) {
    const labeledFrame = { id: v4(), label, msg } as ILabeledFrame;

    this.labeledFrames.push(labeledFrame);
    await this.bus.emit(this.getReadKey(label), JSON.stringify(labeledFrame));
  }

  private getReadKey(label: string) {
    return `read label=${label}`;
  }
}
