/** @jest-environment node */

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { config, proxy } from "../proxy";

type SitePasswordVariable =
  | "SITE_PASSWORD_ENABLED"
  | "SITE_USERNAME"
  | "SITE_PASSWORD";

const originalEnvironment = {
  SITE_PASSWORD_ENABLED: process.env.SITE_PASSWORD_ENABLED,
  SITE_USERNAME: process.env.SITE_USERNAME,
  SITE_PASSWORD: process.env.SITE_PASSWORD,
};

describe("proxy routing", () => {
  it("matches protected application routes", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/campaigns",
      })
    ).toBe(true);
  });

  it.each([
    "/health",
    "/metrics",
    "/api/public/status",
    "/_next/static/chunk.js",
    "/_next/image",
    "/favicon.ico",
  ])("excludes public route %s", (url: string) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(
      false
    );
  });
});

describe("proxy authentication", () => {
  beforeEach(() => {
    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "reviewer";
    process.env.SITE_PASSWORD = "correct-password";
  });

  afterEach(() => {
    restoreEnvironmentVariable(
      "SITE_PASSWORD_ENABLED",
      originalEnvironment.SITE_PASSWORD_ENABLED
    );
    restoreEnvironmentVariable(
      "SITE_USERNAME",
      originalEnvironment.SITE_USERNAME
    );
    restoreEnvironmentVariable(
      "SITE_PASSWORD",
      originalEnvironment.SITE_PASSWORD
    );
  });

  it("allows valid basic credentials", () => {
    const authorization = `Basic ${Buffer.from(
      "reviewer:correct-password"
    ).toString("base64")}`;

    const response = proxy(createProtectedRequest(authorization));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    `Basic ${Buffer.from("reviewer:wrong-password").toString("base64")}`,
    "Basic not-valid-base64!",
    "Bearer opaque-token",
  ])("rejects invalid authorization header %s", (authorization: string) => {
    const response = proxy(createProtectedRequest(authorization));

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe(
      'Basic realm="Protected Site"'
    );
  });
});

function createProtectedRequest(authorization: string): NextRequest {
  return new NextRequest("https://coalition.example/campaigns", {
    headers: { authorization },
  });
}

function restoreEnvironmentVariable(
  name: SitePasswordVariable,
  originalValue: string | undefined
): void {
  if (originalValue === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = originalValue;
}
