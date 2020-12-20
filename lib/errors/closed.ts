export class ClosedError extends Error {
  constructor(system: string) {
    super(`${system} is/are \`close\`d. Did you forget to \`open()\`?`);
  }
}
