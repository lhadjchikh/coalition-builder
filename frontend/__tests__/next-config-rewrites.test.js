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

describe("next.config.js redirects", () => {
  let redirects;

  beforeAll(async () => {
    redirects = await nextConfig.redirects();
  });

  it("redirects /admin to the backend admin page", () => {
    expect(redirects).toContainEqual({
      source: "/admin",
      destination: `${nextConfig.env.API_URL.replace(/\/+$/, "")}/admin/`,
      permanent: false,
    });
  });

  it("normalizes the production API URL before appending /admin/", async () => {
    const productionRedirects = await loadRedirectsForApiUrls(
      "https://api.example.org/",
      "https://api.example.org/"
    );

    expect(productionRedirects).toContainEqual({
      source: "/admin",
      destination: "https://api.example.org/admin/",
      permanent: false,
    });
  });

  it("uses the browser-reachable API URL when server and public URLs differ", async () => {
    const developmentRedirects = await loadRedirectsForApiUrls(
      "http://api:8000",
      "http://localhost:8000"
    );

    expect(developmentRedirects).toContainEqual({
      source: "/admin",
      destination: "http://localhost:8000/admin/",
      permanent: false,
    });
  });
});

describe("next.config.js build type checking", () => {
  it("uses the test-excluding TypeScript build configuration", () => {
    expect(nextConfig.typescript.tsconfigPath).toBe("tsconfig.build.json");
  });
});

async function loadRedirectsForApiUrls(apiUrl, publicApiUrl) {
  const originalApiUrl = process.env.API_URL;
  const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.API_URL = apiUrl;
  process.env.NEXT_PUBLIC_API_URL = publicApiUrl;
  jest.resetModules();

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configuredNextConfig = require("../next.config.js");
    return await configuredNextConfig.redirects();
  } finally {
    restoreEnvironmentVariable("API_URL", originalApiUrl);
    restoreEnvironmentVariable("NEXT_PUBLIC_API_URL", originalPublicApiUrl);
    jest.resetModules();
  }
}

function restoreEnvironmentVariable(name, originalValue) {
  if (originalValue === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = originalValue;
}
