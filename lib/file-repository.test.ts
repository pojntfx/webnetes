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

      describe("seeding", () => {
        it("should seed an empty Uint8Array", async () => {
          const magnetURI = await fileRepository.seed(new Uint8Array());

          expect(magnetURI).toMatchSnapshot();
        }, 20000);
      });

      describe("adding", () => {
        const inFile = new TextEncoder().encode("Hello, world!");
        let magnetURI = "";
        let seedingRepo: FileRepository;

        beforeAll(async () => {
          seedingRepo = new FileRepository();

          await seedingRepo.open();

          magnetURI = await seedingRepo.seed(inFile);
        }, 20000);

        afterAll(async () => {
          await seedingRepo.close();
        });

        it("should be able to add a file", async () => {
          const outFile = await fileRepository.add(magnetURI);

          expect(outFile).toStrictEqual(inFile);
        }, 20000);
      });
    });
  });
});
