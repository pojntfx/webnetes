export class NodeNotKnownError extends Error {
  constructor(id: string) {
    super(`node ${id} not known`);
  }
}
