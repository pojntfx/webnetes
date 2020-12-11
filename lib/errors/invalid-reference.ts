export class InvalidReferenceError extends Error {
  constructor(kind: string, field: string, label: string) {
    super(`invalid reference for kind ${kind}, field ${field}, label ${label}`);
  }
}
