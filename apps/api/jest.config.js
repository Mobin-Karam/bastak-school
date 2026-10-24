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
  // Nest 12 and Fastify's request injector ship ESM dependencies; Jest on
  // Node 22 needs a CJS transform for those packages and their nested cookie.
  transformIgnorePatterns: ["node_modules/(?!(?:@nestjs|light-my-request|cookie)/)"],
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  testEnvironment: "node"
};
