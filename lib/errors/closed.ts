export class ClosedError extends Error {
  constructor(system: string) {
    super(`${system} is \`close\`d. Did you forget to \`open()\`?`);
  }
}
