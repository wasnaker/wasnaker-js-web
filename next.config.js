/** @type {import('next').NextConfig} */
const path = require("node:path");
const { existsSync } = require("node:fs");
const integrationRoot = path.resolve(__dirname, "../..");
const workspaceRoot = existsSync(
  path.join(integrationRoot, "packages/core/web/package.json")
)
  ? integrationRoot
  : __dirname;

const nextConfig = {
  transpilePackages: [
    "@wasnaker/core-web",
    "@wasnaker/region-web",
    "@wasnaker/region-contract",
  ],
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
};

module.exports = nextConfig;
