// This is a fallback index for those who prefer not to use a bundler
// It will bundle all external dependencies and expose the global WebnetesNode object

import { Node } from "./lib/high-level/node";

(window as any).WebnetesNode = Node;
