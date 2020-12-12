export class DuplicateResourceError extends Error {
  constructor(label: string, apiVersion: string, kind: string) {
    super(`resource ${label} of type ${apiVersion}/${kind} already exists`);
  }
}
