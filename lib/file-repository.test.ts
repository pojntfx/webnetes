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

  describe("non-lifecycle", () => {
    describe("seed", () => {
      beforeEach(async () => {
        await fileRepository.open();
      });

      afterEach(async () => {
        await fileRepository.close();
      });

      it("should seed an empty Uint8Array", async () => {
        const magnetLink = await fileRepository.seed(new Uint8Array());

        expect(magnetLink).toMatchSnapshot();
      }, 20000);
    });
  });
});
