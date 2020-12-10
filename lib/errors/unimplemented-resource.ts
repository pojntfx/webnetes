export class UnimplementedResourceError extends Error {
  constructor() {
    super("unimplemented resource");
  }
}
