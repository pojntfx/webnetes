export class ConfigMissingError extends Error {
  constructor(name: string) {
    super(`config ${name} is missing`);
  }
}
