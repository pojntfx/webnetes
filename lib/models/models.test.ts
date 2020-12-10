import { Arguments } from "./arguments";
import { EResourceKind, IResource } from "./resource";

const argumentsData = require("./arguments.data.json");

describe("Models", () => {
  test.each([[argumentsData, argumentsData]])(
    "% should be %",
    (resource: IResource<any>, expected: IResource<any>) => {
      let actual: any = {};

      switch (resource.kind) {
        case EResourceKind.ARGUMENTS: {
          actual = new Arguments(resource.metadata, resource.spec);

          break;
        }
      }

      expect(actual).toMatchObject(expected);
    }
  );
});
