/**
 * Unit Tests for SSR Middleware
 * Tests the basic authentication middleware functionality
 */

import { middleware, NextResponse } from "./middleware-testable";

interface Headers {
  [key: string]: string;
}

// Mock NextRequest
class MockNextRequest {
  public nextUrl: { pathname: string };
  public headers: Map<string, string>;

  constructor(url: string, headers: Headers = {}) {
    this.nextUrl = { pathname: new URL(url, "http://localhost").pathname };
    this.headers = new Map(Object.entries(headers));
  }

  get(key: string): string | undefined {
    return this.headers.get(key);
  }
}

// Test runner
async function runMiddlewareTests(): Promise<boolean> {
  console.log("🧪 Starting Middleware Unit Tests\n");

  let passed = 0;
  let failed = 0;

  // Helper function to run a test
  function runTest(testName: string, testFn: () => void): void {
    try {
      console.log(`🔍 Testing: ${testName}`);
      testFn();
      console.log(`✅ ${testName} passed`);
      passed++;
    } catch (error) {
      const err = error as Error;
      console.log(`❌ ${testName} failed: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Health endpoints should be excluded from auth
  runTest("Health endpoints bypass authentication", () => {
    // Save original env
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    // Enable auth
    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/health/app");
      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error("Health endpoint should bypass auth and return 200");
      }
    } finally {
      // Restore env
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 2: Metrics endpoints should be excluded from auth
  runTest("Metrics endpoints bypass authentication", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/metrics");
      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error("Metrics endpoint should bypass auth and return 200");
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 3: Public API endpoints should be excluded from auth
  runTest("Public API endpoints bypass authentication", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest(
        "http://localhost/api/public/something"
      );
      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error(
          "Public API endpoint should bypass auth and return 200"
        );
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 4: When auth is disabled, all requests should pass through
  runTest("Disabled auth allows all requests", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "false";

    try {
      const request = new MockNextRequest("http://localhost/protected-page");
      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error("Request should pass through when auth is disabled");
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 5: Missing auth header should return 401
  runTest("Missing auth header returns 401", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/protected-page");
      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }

      if (!response.headers.get("WWW-Authenticate")) {
        throw new Error("Missing WWW-Authenticate header");
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 6: Valid credentials should allow access
  runTest("Valid credentials allow access", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      // Create valid basic auth header
      const credentials = Buffer.from("admin:secret").toString("base64");
      const request = new MockNextRequest("http://localhost/protected-page", {
        authorization: `Basic ${credentials}`,
      });

      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error("Valid credentials should allow access");
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 7: Invalid credentials should return 401
  runTest("Invalid credentials return 401", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      // Create invalid basic auth header
      const credentials = Buffer.from("admin:wrongpassword").toString("base64");
      const request = new MockNextRequest("http://localhost/protected-page", {
        authorization: `Basic ${credentials}`,
      });

      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 8: Invalid base64 should return 401
  runTest("Invalid base64 auth returns 401", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "true";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/protected-page", {
        authorization: "Basic invalid-base64!",
      });

      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 9: Alternative truthy values for SITE_PASSWORD_ENABLED
  runTest('SITE_PASSWORD_ENABLED accepts "1" as truthy', () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "1";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/protected-page");
      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(
          'Should require auth when SITE_PASSWORD_ENABLED is "1"'
        );
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 10: Case insensitive SITE_PASSWORD_ENABLED
  runTest("SITE_PASSWORD_ENABLED is case insensitive", () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "TRUE";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/protected-page");
      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(
          'Should require auth when SITE_PASSWORD_ENABLED is "TRUE"'
        );
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 11: "yes" is accepted as truthy
  runTest('SITE_PASSWORD_ENABLED accepts "yes" as truthy', () => {
    const originalEnv = process.env.SITE_PASSWORD_ENABLED;

    process.env.SITE_PASSWORD_ENABLED = "yes";
    process.env.SITE_USERNAME = "admin";
    process.env.SITE_PASSWORD = "secret";

    try {
      const request = new MockNextRequest("http://localhost/protected-page");
      const response = middleware(request);

      if (response.status !== 401) {
        throw new Error(
          'Should require auth when SITE_PASSWORD_ENABLED is "yes"'
        );
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnv;
    }
  });

  // Test 12: Default username should work when SITE_USERNAME not set
  runTest("Default username works when SITE_USERNAME not set", () => {
    const originalEnabled = process.env.SITE_PASSWORD_ENABLED;
    const originalUsername = process.env.SITE_USERNAME;
    const originalPassword = process.env.SITE_PASSWORD;

    process.env.SITE_PASSWORD_ENABLED = "true";
    delete process.env.SITE_USERNAME; // Should default to 'admin'
    process.env.SITE_PASSWORD = "secret";

    try {
      const credentials = Buffer.from("admin:secret").toString("base64");
      const request = new MockNextRequest("http://localhost/protected-page", {
        authorization: `Basic ${credentials}`,
      });

      const response = middleware(request);

      if (!(response instanceof NextResponse) || response.status !== 200) {
        throw new Error("Default username should work");
      }
    } finally {
      process.env.SITE_PASSWORD_ENABLED = originalEnabled;
      if (originalUsername !== undefined)
        process.env.SITE_USERNAME = originalUsername;
      if (originalPassword !== undefined)
        process.env.SITE_PASSWORD = originalPassword;
    }
  });

  // Summary
  console.log("\n📊 Middleware Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 All middleware tests passed!");
    return true;
  } else {
    console.log("\n💥 Some middleware tests failed!");
    return false;
  }
}

// Export for use in other test files
export { runMiddlewareTests, MockNextRequest, type Headers };

// Run tests if this file is executed directly
if (require.main === module) {
  runMiddlewareTests()
    .then((success: boolean) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error: Error) => {
      console.error("💥 Test execution failed:", error.message);
      process.exit(1);
    });
}
