module.exports = {
  rootDir: "lib",
  preset: "ts-jest",
  testMatch: ["<rootDir>/**/*.test.ts"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
