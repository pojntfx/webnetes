export class InvalidReferenceError extends Error {
  constructor(label: string, apiVersion: string, kind: string, field: string) {
    super(`invalid reference ${label} to ${apiVersion}/${kind} at ${field}`);
  }
}
