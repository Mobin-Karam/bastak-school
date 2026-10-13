module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": ["babel-jest", {
      plugins: ["@babel/plugin-transform-modules-commonjs", "./test/import-meta-url.cjs"]
    }]
  },
  // Nest 12 ships ESM; Jest on Node 22 needs a CJS transform for its packages.
  transformIgnorePatterns: ["node_modules/(?!@nestjs/)"],
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  testEnvironment: "node"
};
