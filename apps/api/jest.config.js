module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": [
      "babel-jest",
      {
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          "./test/import-meta-url.cjs",
        ],
      },
    ],
  },
  // Both Fastify's async cookie plugin and light-my-request's synchronous
  // injector use `cookie`. Jest's VM cannot load its ESM package through both
  // paths, so tests use a compatibility adapter with the same small API.
  moduleNameMapper: {
    "^cookie$": "<rootDir>/test/cookie-compat.cjs",
  },
  transformIgnorePatterns: ["node_modules/(?!(?:@nestjs|light-my-request)/)"],
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  testEnvironment: "node",
};
