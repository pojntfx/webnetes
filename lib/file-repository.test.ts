import { FileRepository } from "./file-repository";

describe("FileRepository", () => {
  let fileRepository: FileRepository;

  beforeEach(() => {
    fileRepository = new FileRepository();
  });

  describe("lifecycle", () => {
    describe("open", () => {
      afterEach(async () => {
        await fileRepository.close();
      });

      it("should open", async () => {
        await fileRepository.open();
      });
    });
  });
});
