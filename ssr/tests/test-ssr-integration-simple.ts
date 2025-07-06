/**
 * Simple SSR Integration Test
 * A minimal version that tests the core functionality
 */

import {
  makeRequest,
  waitForService,
  createAuthenticatedRequestOptions,
  type ResponseData,
} from "./utils";

// Configuration
const SSR_URL = process.env.SSR_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8000";
const NGINX_URL = process.env.NGINX_URL || "http://localhost:80";
const MAX_TIMEOUT = 30000; // 30 seconds

interface TestResults {
  passed: number;
  failed: number;
}

// Main test function
async function runTests(): Promise<void> {
  console.log("🚀 Starting Simple SSR Integration Test\n");

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Wait for services
    console.log("⏳ Waiting for services to be ready...");
    await waitForService(`${API_URL}/api/health/`);
    await waitForService(`${SSR_URL}/health`);
    console.log("✅ All services are ready\n");

    // Test 2: API Health
    console.log("🔍 Testing API health endpoint...");
    const apiResponse: ResponseData = await makeRequest(
      `${API_URL}/api/health/`,
    );
    if (apiResponse.statusCode === 200) {
      console.log("✅ API health endpoint working");
      passed++;
    } else {
      console.log(`❌ API health endpoint failed: ${apiResponse.statusCode}`);
      failed++;
    }

    // Test 3: API Data Endpoint
    console.log("🔍 Testing API data endpoint...");
    const apiDataResponse: ResponseData = await makeRequest(
      `${API_URL}/api/campaigns/`,
    );
    if (apiDataResponse.statusCode === 200) {
      console.log("✅ API data endpoint working");
      passed++;
    } else {
      console.log(`❌ API data endpoint failed: ${apiDataResponse.statusCode}`);
      failed++;
    }

    // Test 4: SSR Health
    console.log("🔍 Testing SSR health...");
    const ssrHealthResponse: ResponseData = await makeRequest(
      `${SSR_URL}/health`,
    );
    if (ssrHealthResponse.statusCode === 200) {
      console.log("✅ SSR health endpoint working");
      passed++;
    } else {
      console.log(`❌ SSR health failed: ${ssrHealthResponse.statusCode}`);
      failed++;
    }

    // Test 5: SSR Homepage
    console.log("🔍 Testing SSR homepage...");

    const requestOptions = createAuthenticatedRequestOptions();
    const homepageResponse: ResponseData = await makeRequest(
      SSR_URL,
      requestOptions,
    );
    if (
      homepageResponse.statusCode === 200 &&
      homepageResponse.data.includes("<html")
    ) {
      console.log("✅ SSR homepage working");
      passed++;
    } else {
      if (homepageResponse.statusCode === 401) {
        console.log(
          `❌ SSR homepage authentication failed: ${homepageResponse.statusCode}. Check SITE_USERNAME and SITE_PASSWORD environment variables.`,
        );
      } else {
        console.log(`❌ SSR homepage failed: ${homepageResponse.statusCode}`);
      }
      failed++;
    }

    // Test 6: Load Balancer Routing (if available)
    console.log("🔍 Testing load balancer routing...");
    try {
      // First check if the load balancer is accessible
      let nginxAvailable = false;
      try {
        const checkResponse: ResponseData = await makeRequest(NGINX_URL);
        nginxAvailable = checkResponse.statusCode < 500; // Any non-server error is considered available
      } catch (error) {
        const err = error as Error;
        console.log(
          `⚠️  Load balancer at ${NGINX_URL} not accessible: ${err.message}`,
        );
      }

      if (nginxAvailable) {
        const lbApiResponse: ResponseData = await makeRequest(
          `${NGINX_URL}/api/campaigns/`,
        );
        const lbSSRResponse: ResponseData = await makeRequest(
          NGINX_URL,
          requestOptions,
        );

        if (
          lbApiResponse.statusCode === 200 &&
          lbSSRResponse.statusCode === 200
        ) {
          console.log("✅ Load balancer routing working");
          passed++;
        } else {
          console.log(
            `❌ Load balancer routing failed: API ${lbApiResponse.statusCode}, SSR ${lbSSRResponse.statusCode}`,
          );
          failed++;
        }
      } else {
        console.log("⚠️  Load balancer not available (test skipped)");
        // Don't fail the test if nginx is intentionally not running
      }
    } catch (error) {
      const err = error as Error;
      console.log(`⚠️  Load balancer test error: ${err.message} (skipping)`);
    }
  } catch (error) {
    const err = error as Error;
    console.error("💥 Test setup failed:", err.message);
    failed++;
  }

  // Summary
  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n💥 Some tests failed!");
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error: Error) => {
  console.error("💥 Test execution failed:", error.message);
  process.exit(1);
});

// Export for potential use in other test files
export { runTests, type TestResults };
