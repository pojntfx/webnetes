import { CapabilityNotImplementedError } from "../errors/capability-not-implemented";
import implementedCapabilities from "./capabilities";

export const filterImportsByCapabilities = (
  allowedCapabilities: string[],
  imports: any
) => {
  const enabledCapabilities: string[] = [];
  allowedCapabilities.forEach((label) => {
    const exposedImports = (implementedCapabilities as any)[label];

    if (exposedImports) {
      enabledCapabilities.push(...exposedImports);
    } else {
      throw new CapabilityNotImplementedError(label);
    }
  });

  const enabledImports: any = {};
  Object.keys(imports).forEach((key) => {
    if (enabledCapabilities.includes(key)) {
      enabledImports[key] = imports[key];
    }
  });

  console.log(enabledImports);

  return enabledImports;
};
