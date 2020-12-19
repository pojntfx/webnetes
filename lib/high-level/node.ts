import { IResource } from "../resources/resource";
import { Signaler } from "../resources/signaler";
import { StunServer } from "../resources/stunserver";
import { Subnet } from "../resources/subnet";
import { TurnServer } from "../resources/turnserver";

export class Node {
  constructor(
    private onCreateResource: (resource: IResource<any>) => Promise<void>,
    private onDeleteResource: (resource: IResource<any>) => Promise<void>
  ) {}

  async open(
    resources: string | (Signaler | StunServer | TurnServer | Subnet)[]
  ) {}

  async close() {}

  async seedFile(
    label: string,
    name: string,
    repository: string,
    fileInstance: Uint8Array
  ) {}

  async createResource(resources: string | IResource<any>[]) {}

  async deleteResource(resources: string | IResource<any>[]) {}
}
