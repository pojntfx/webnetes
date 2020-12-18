import { FileRepository } from "../controllers/file-repository";
import { File } from "../resources/file";
import { IInstance } from "../resources/instance";
import {
  IRepositorySpec,
  Repository as RepositoryResource,
} from "../resources/repository";
import {
  API_VERSION,
  EResourceKind,
  IResourceMetadata,
} from "../resources/resource";
import { StunServer } from "../resources/stunserver";
import { ITrackerSpec, Tracker } from "../resources/tracker";
import { TurnServer } from "../resources/turnserver";
import { getLogger } from "../utils/logger";
import { Repository } from "./repository";

export class Files extends Repository<
  Tracker | RepositoryResource | File,
  IInstance<FileRepository>
> {
  private logger = getLogger();

  constructor(
    private getStunServer: (
      label: StunServer["metadata"]["label"]
    ) => Promise<StunServer>,
    private getTurnServer: (
      label: TurnServer["metadata"]["label"]
    ) => Promise<TurnServer>
  ) {
    super();
  }

  async createTracker(metadata: IResourceMetadata, spec: ITrackerSpec) {
    this.logger.debug("Creating tracker", { metadata });

    const tracker = new Tracker(metadata, spec);

    await this.addResource<Tracker>(
      tracker.apiVersion,
      tracker.kind,
      tracker.metadata,
      tracker.spec
    );
  }

  async createRepository(metadata: IResourceMetadata, spec: IRepositorySpec) {
    this.logger.debug("Creating repository", { metadata });

    const [trackers, stunServers, turnServers] = await Promise.all([
      Promise.all(
        spec.trackers
          .map(async (tracker) => await this.getTracker(tracker))
          .map(async (tracker) => (await tracker).spec.urls)
      ),
      Promise.all(
        spec.stunServers
          .map(async (stunServer) => await this.getStunServer(stunServer))
          .map(async (stunServer) => ({ urls: (await stunServer).spec.urls }))
      ),
      Promise.all(
        spec.turnServers
          .map(async (turnServer) => await this.getTurnServer(turnServer))
          .map(async (turnServer) => ({
            urls: (await turnServer).spec.urls,
            username: (await turnServer).spec.username,
            credential: (await turnServer).spec.credential,
          }))
      ),
    ]);

    const repo = new RepositoryResource(metadata, spec);

    const fileRepo = new FileRepository(
      trackers.reduce((all, cur) => [...all, ...cur], []),
      {
        iceServers: [...stunServers, ...turnServers],
      }
    );

    await fileRepo.open();

    await this.addInstance<IInstance<FileRepository>>(
      repo.apiVersion,
      repo.kind,
      repo.metadata,
      fileRepo
    );

    await this.addResource<RepositoryResource>(
      repo.apiVersion,
      repo.kind,
      repo.metadata,
      repo.spec
    );
  }

  async getTracker(label: Tracker["metadata"]["label"]) {
    this.logger.debug("Getting tracker", { label });

    return this.findResource<Tracker>(
      API_VERSION,
      EResourceKind.TRACKER,
      label
    );
  }

  async getRepository(label: RepositoryResource["metadata"]["label"]) {
    this.logger.debug("Getting repository", { label });

    return this.findResource<RepositoryResource>(
      API_VERSION,
      EResourceKind.REPOSITORY,
      label
    );
  }
}
