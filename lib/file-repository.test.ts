import { FileRepository } from "./file-repository";

describe("FileRepository", () => {
  let fileRepository: FileRepository;

  beforeEach(() => {
    fileRepository = new FileRepository();
  });

  describe("lifecycle", () => {
    describe("open", () => {
      it("should open", async () => {
        await fileRepository.open();
      });

      afterEach(async () => {
        await fileRepository.close();
      });
    });

    describe("close", () => {
      beforeEach(async () => {
        await fileRepository.open();
      });

      it("should close", async () => {
        await fileRepository.close();
      });
    });
  });
});
