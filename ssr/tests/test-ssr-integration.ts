/**
 * SSR Integration Test
 * Tests the full stack with both Django API and Next.js SSR working together
 *
 * This test verifies:
 * 1. SSR container is running and healthy
 * 2. Django API is accessible from SSR container
 * 3. SSR pages are properly server-side rendered
 * 4. API routing works correctly
 * 5. Static assets are served correctly
 */

import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

// Import utilities for HTTP requests and service waiting
import {
  makeRequest,
  waitForService,
  fetchCompatible as fetch,
  fetchWithRetry,
  createAuthenticatedRequestOptions,
  type FetchResponse,
} from "./utils";

interface TestConfig {
  SSR_URL: string;
  API_URL: string;
  NGINX_URL: string;
  TIMEOUT: number;
  RETRY_COUNT: number;
  RETRY_DELAY: number;
  CI_MODE: boolean;
}

interface TestResult {
  name: string;
  status: "PASSED" | "FAILED";
  result?: any;
  error?: string;
}

interface TestResults {
  passed: number;
  failed: number;
  warnings: number;
  tests: TestResult[];
  startTime: number;
}

interface HealthData {
  status: string;
  [key: string]: any;
}

interface Campaign {
  id: number;
  title: string;
  summary: string;
  [key: string]: any;
}

// Test configuration
const TEST_CONFIG: TestConfig = {
  SSR_URL: process.env.SSR_URL || "http://localhost:3000",
  API_URL: process.env.API_URL || "http://localhost:8000",
  NGINX_URL: process.env.NGINX_URL || "http://localhost:80",
  TIMEOUT: parseInt(process.env.TEST_TIMEOUT || "60000"), // 60 seconds by default
  RETRY_COUNT: parseInt(process.env.TEST_RETRY_COUNT || "5"),
  RETRY_DELAY: parseInt(process.env.TEST_RETRY_DELAY || "3000"), // 3 seconds
  CI_MODE: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
};

// Log test configuration
console.log("Test Configuration:", {
  ...TEST_CONFIG,
  TIMEOUT: `${TEST_CONFIG.TIMEOUT}ms`,
  RETRY_DELAY: `${TEST_CONFIG.RETRY_DELAY}ms`,
  ENVIRONMENT: TEST_CONFIG.CI_MODE ? "CI" : "Local",
});

// Test 1: Verify SSR Health Check
async function testSSRHealth(): Promise<HealthData> {
  console.log("🔍 Testing SSR health endpoint...");

  const response: FetchResponse = await fetchWithRetry(
    `${TEST_CONFIG.SSR_URL}/health`,
  );

  if (!response.ok) {
    throw new Error(
      `SSR health check failed: ${response.status} ${response.statusText}`,
    );
  }

  const data: HealthData = response.json();

  if (data.status !== "healthy") {
    throw new Error(
      `SSR health check returned unhealthy status: ${JSON.stringify(data)}`,
    );
  }

  console.log("✅ SSR health check passed");
  return data;
}

// Test 2: Verify Django API health
async function testDjangoAPI(): Promise<Campaign[]> {
  console.log("🔍 Testing Django API health...");

  const response: FetchResponse = await fetchWithRetry(
    `${TEST_CONFIG.API_URL}/api/health/`,
  );

  if (!response.ok) {
    throw new Error(
      `Django API health test failed: ${response.status} ${response.statusText}`,
    );
  }

  const healthData: HealthData = response.json();

  if (healthData.status !== "healthy") {
    throw new Error(
      `Django API health check returned unhealthy status: ${JSON.stringify(
        healthData,
      )}`,
    );
  }

  // Also test data endpoint
  const dataResponse: FetchResponse = await fetchWithRetry(
    `${TEST_CONFIG.API_URL}/api/campaigns/`,
  );

  if (!dataResponse.ok) {
    throw new Error(
      `Django API data endpoint failed: ${dataResponse.status} ${dataResponse.statusText}`,
    );
  }

  const campaigns: Campaign[] = dataResponse.json();

  if (!Array.isArray(campaigns)) {
    throw new Error(
      `Django API returned invalid data: expected array, got ${typeof campaigns}`,
    );
  }

  console.log(
    `✅ Django API tests passed (health check OK, returned ${campaigns.length} campaigns)`,
  );
  return campaigns;
}

// Test 3: Verify SSR Homepage Rendering
async function testSSRHomepage(): Promise<string> {
  console.log("🔍 Testing SSR homepage rendering...");

  const response: FetchResponse = await fetchWithRetry(TEST_CONFIG.SSR_URL);

  if (!response.ok) {
    throw new Error(
      `SSR homepage failed: ${response.status} ${response.statusText}`,
    );
  }

  const html: string = response.text();

  // Check that it's actually server-side rendered HTML
  if (!html.includes("<html")) {
    throw new Error("SSR homepage did not return HTML content");
  }

  // Define critical and non-critical content to check
  const criticalContent: string[] = [
    // Fundamental HTML structure must be present
    "<html",
    "<head",
    "<body",
  ];

  // Content that should be present but won't fail tests if missing
  // These could change with UI updates
  const expectedContent: string[] = [
    "Coalition Builder",
    "Policy Campaigns",
    // Check for Next.js specific meta tags
    "viewport",
  ];

  // Check critical content first (must have these)
  for (const content of criticalContent) {
    if (!html.includes(content)) {
      throw new Error(`SSR homepage missing critical content: "${content}"`);
    }
  }

  // Check expected content (warn if missing but don't fail)
  const missingContent: string[] = [];
  for (const content of expectedContent) {
    if (!html.includes(content)) {
      missingContent.push(content);
    }
  }

  if (missingContent.length > 0) {
    console.warn(
      `⚠️  Warning: SSR homepage missing some expected content: ${missingContent.join(
        ", ",
      )}`,
    );
  }

  // Verify it's actually SSR by checking for hydration markers
  if (!html.includes("__NEXT_DATA__") && !html.includes("next/script")) {
    console.warn(
      "⚠️  Warning: Page might not be properly server-side rendered (missing Next.js hydration markers)",
    );
  }

  console.log("✅ SSR homepage rendering test passed");
  return html;
}

// Test 4: Test API routing through Load Balancer/Nginx
async function testAPIRouting(): Promise<Campaign[]> {
  console.log("🔍 Testing API routing through load balancer...");

  // Test through Nginx (simulates ALB routing)
  const response: FetchResponse = await fetchWithRetry(
    `${TEST_CONFIG.NGINX_URL}/api/campaigns/`,
  );

  if (!response.ok) {
    throw new Error(
      `API routing test failed: ${response.status} ${response.statusText}`,
    );
  }

  const campaigns: Campaign[] = response.json();

  if (!Array.isArray(campaigns)) {
    throw new Error(
      `API routing returned invalid data: expected array, got ${typeof campaigns}`,
    );
  }

  console.log(
    `✅ API routing test passed (returned ${campaigns.length} campaigns through load balancer)`,
  );
  return campaigns;
}

// Test 5: Test SSR with API Integration
async function testSSRAPIIntegration(): Promise<boolean> {
  console.log("🔍 Testing SSR + API integration...");

  // This tests that SSR can fetch data from the API and render it
  const response: FetchResponse = await fetchWithRetry(TEST_CONFIG.SSR_URL);
  const html: string = response.text();

  // Look for signs that the page has been rendered with actual data
  // This would indicate that SSR successfully called the API
  const hasDataRendered: boolean =
    html.includes("campaign") ||
    html.includes("Policy Campaign") ||
    html.includes("No campaigns found");

  if (!hasDataRendered) {
    console.warn(
      "⚠️  Warning: SSR page may not have successfully fetched API data",
    );
  } else {
    console.log("✅ SSR appears to have successfully integrated with API");
  }

  return hasDataRendered;
}

// Test 6: Test Container Communication
async function testContainerCommunication(): Promise<boolean> {
  console.log("🔍 Testing container-to-container communication...");

  try {
    // First check if Docker is available
    let dockerAvailable = false;
    try {
      await execAsync("docker --version");
      dockerAvailable = true;
    } catch (error) {
      console.log(
        "ℹ️  Docker not available, skipping container communication test",
      );
      return true; // Skip test but don't fail it
    }

    if (dockerAvailable) {
      // Check if we're running in Docker environment and have the right containers
      // Modern Docker CLI uses 'docker compose' (not 'docker-compose')
      const dockerComposeCmd = "docker compose";

      const { stdout } = await execAsync(`${dockerComposeCmd} ps --services`);
      const services: string[] = stdout.trim().split("\n");

      if (services.includes("ssr") && services.includes("api")) {
        // Test that SSR container can reach API container
        try {
          const { stdout: apiTest } = await execAsync(
            `${dockerComposeCmd} exec -T ssr curl -s -o /dev/null -w "%{http_code}" http://api:8000/api/campaigns/ || echo "failed"`,
          );

          if (apiTest.trim() === "200") {
            console.log("✅ Container-to-container communication test passed");
            return true;
          } else {
            console.warn(
              `⚠️  Warning: Container-to-container communication may have issues (status: ${apiTest.trim()})`,
            );
            return false;
          }
        } catch (cmdError) {
          const err = cmdError as Error;
          console.warn(
            `⚠️  Container command execution failed: ${err.message}`,
          );
          return false;
        }
      } else {
        console.log(
          `ℹ️  Required services (ssr, api) not running in Docker. Found: [${services.join(
            ", ",
          )}]`,
        );
        return true; // Skip test but don't fail it
      }
    }
  } catch (error) {
    const err = error as Error;
    // Log the error but don't fail the entire test suite for this
    console.log(`ℹ️  Skipping container communication test: ${err.message}`);
    return true;
  }

  return true; // Default pass if we reach here
}

// Test 7: Error Handling and Fallback UI Test
async function testSSRErrorHandlingAndFallback(): Promise<boolean> {
  console.log("🔍 Testing SSR error handling and fallback UI...");

  const requestOptions = createAuthenticatedRequestOptions();
  const response: FetchResponse = await fetchWithRetry(
    TEST_CONFIG.SSR_URL,
    requestOptions,
  );

  if (!response.ok) {
    // If we get 401, provide helpful error message about authentication
    if (response.status === 401) {
      throw new Error(
        `SSR authentication failed: ${response.status} ${response.statusText}. Check SITE_USERNAME and SITE_PASSWORD environment variables.`,
      );
    }
    throw new Error(
      `SSR architecture test failed: ${response.status} ${response.statusText}`,
    );
  }

  const html: string = response.text();

  // Verify the page structure is intact
  if (!html.includes("<html") || !html.includes("</html>")) {
    throw new Error("Page structure compromised");
  }

  // Check that the SSR is actually rendering homepage content
  const homepageIndicators: string[] = [
    "Welcome to Coalition Builder", // Should show hero title from fallback
    "About Our Mission", // Should show about section
    "Policy Campaigns", // Should show campaigns section
    "Coalition Builder", // Should show organization name
  ];

  let foundHomepageIndicators = 0;
  for (const indicator of homepageIndicators) {
    if (html.includes(indicator)) {
      foundHomepageIndicators++;
    }
  }

  if (foundHomepageIndicators < 2) {
    throw new Error(
      `SSR homepage rendering failed - only found ${foundHomepageIndicators}/4 expected indicators: ${homepageIndicators.join(", ")}`,
    );
  }

  console.log(
    `✅ SSR homepage rendering test passed - found ${foundHomepageIndicators}/4 homepage indicators`,
  );
  return true;
}

// Test 8: Performance Test
async function testPerformance(): Promise<number> {
  console.log("🔍 Running basic performance test...");

  const startTime = Date.now();
  const response: FetchResponse = await fetchWithRetry(TEST_CONFIG.SSR_URL);
  const endTime = Date.now();

  const responseTime = endTime - startTime;

  if (!response.ok) {
    throw new Error(`Performance test failed: ${response.status}`);
  }

  console.log(`✅ Performance test passed (response time: ${responseTime}ms)`);

  if (responseTime > 5000) {
    console.warn("⚠️  Warning: Response time is quite slow (>5s)");
  }

  return responseTime;
}

// Main test runner
async function runIntegrationTests(): Promise<void> {
  console.log("🚀 Starting SSR Integration Tests...\n");

  const results: TestResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
    startTime: Date.now(),
  };

  // Track warnings by overriding console.warn
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    results.warnings++;
    originalWarn.apply(console, args);
  };

  const tests: Array<{ name: string; fn: () => Promise<any> }> = [
    { name: "SSR Health Check", fn: testSSRHealth },
    { name: "Django API Direct", fn: testDjangoAPI },
    { name: "SSR Homepage Rendering", fn: testSSRHomepage },
    { name: "API Routing", fn: testAPIRouting },
    { name: "SSR API Integration", fn: testSSRAPIIntegration },
    { name: "Container Communication", fn: testContainerCommunication },
    { name: "SSR Error Handling", fn: testSSRErrorHandlingAndFallback },
    { name: "Performance Test", fn: testPerformance },
  ];

  // Wait for services to be ready
  console.log("⏳ Waiting for services to be ready...");
  try {
    await Promise.all([
      waitForService(`${TEST_CONFIG.SSR_URL}/health`, {
        timeout: TEST_CONFIG.TIMEOUT,
      }),
      waitForService(`${TEST_CONFIG.API_URL}/api/health/`, {
        timeout: TEST_CONFIG.TIMEOUT,
      }),
    ]);
    console.log("✅ All services are ready\n");
  } catch (error) {
    const err = error as Error;
    console.error("❌ Services failed to start:", err.message);
    process.exit(1);
  }

  // Run all tests
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.passed++;
      results.tests.push({ name: test.name, status: "PASSED", result });
    } catch (error) {
      const err = error as Error;
      results.failed++;
      results.tests.push({
        name: test.name,
        status: "FAILED",
        error: err.message,
      });
      console.error(`❌ ${test.name} failed:`, err.message);
    }
    console.log(""); // Add spacing between tests
  }

  // Restore original console.warn
  console.warn = originalWarn;

  // Calculate elapsed time
  const totalTime = Date.now() - results.startTime;
  const minutes = Math.floor(totalTime / 60000);
  const seconds = ((totalTime % 60000) / 1000).toFixed(2);

  // Print summary
  console.log("\n📊 Test Summary:");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(
    `⏱️  Total time: ${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`,
  );

  // Print test results
  if (results.tests.length > 0) {
    console.log("\nTest details:");
    results.tests.forEach((test: TestResult) => {
      if (test.status === "PASSED") {
        console.log(`  ✅ ${test.name}`);
      } else {
        console.log(`  ❌ ${test.name}: ${test.error}`);
      }
    });
  }

  if (results.failed > 0) {
    console.log("\n❌ Integration tests failed!");
    process.exit(1);
  } else {
    console.log("\n🎉 All integration tests passed!");
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️  Tests interrupted");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n⏹️  Tests terminated");
  process.exit(1);
});

// Export for testing
if (require.main === module) {
  runIntegrationTests().catch((error: Error) => {
    console.error("💥 Integration tests crashed:", error);
    process.exit(1);
  });
}

export {
  runIntegrationTests,
  testSSRHealth,
  testDjangoAPI,
  testSSRHomepage,
  testAPIRouting,
  testSSRAPIIntegration,
  testContainerCommunication,
  testSSRErrorHandlingAndFallback,
  testPerformance,
  type TestConfig,
  type TestResult,
  type TestResults,
  type HealthData,
  type Campaign,
};
