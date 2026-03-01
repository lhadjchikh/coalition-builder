/**
 * @jest-environment node
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextConfig = require("../next.config.js");

describe("next.config.js rewrites", () => {
  let rewrites;

  beforeAll(async () => {
    rewrites = await nextConfig.rewrites();
  });

  it("appends trailing slash to catch-all API rewrite destination", () => {
    const catchAll = rewrites.find((r) => r.source === "/api/:path*");
    expect(catchAll).toBeDefined();
    expect(catchAll.destination).toMatch(/\/$/);
  });

  it("includes explicit /api and /api/ rewrites to avoid double slash", () => {
    const sources = rewrites.map((r) => r.source);
    expect(sources).toContain("/api");
    expect(sources).toContain("/api/");
  });

  it("routes /api and /api/ to a single-slash destination", () => {
    const apiRoot = rewrites.find((r) => r.source === "/api");
    const apiSlash = rewrites.find((r) => r.source === "/api/");
    expect(apiRoot.destination).not.toMatch(/\/\/$/);
    expect(apiSlash.destination).not.toMatch(/\/\/$/);
  });
});
