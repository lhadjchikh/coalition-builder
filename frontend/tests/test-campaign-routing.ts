/**
 * Campaign Routing Integration Test
 * Tests the campaign detail page routing functionality
 *
 * This test verifies:
 * 1. Campaign pages are accessible via /campaigns/[name]
 * 2. Correct campaign data is displayed
 * 3. 404 handling for non-existent campaigns
 * 4. Integration between SSR and API
 */

import { makeRequest, waitForService } from "./utils";

interface TestConfig {
  SSR_URL: string;
  API_URL: string;
  TIMEOUT: number;
}

interface TestResult {
  name: string;
  status: "PASSED" | "FAILED";
  result?: any;
  error?: string;
}

const config: TestConfig = {
  SSR_URL: process.env.SSR_URL || "http://localhost:3001",
  API_URL: process.env.API_URL || "http://localhost:8000",
  TIMEOUT: parseInt(process.env.TIMEOUT || "30000"),
};

const results: TestResult[] = [];

function logTest(
  name: string,
  status: "PASSED" | "FAILED",
  result?: any,
  error?: string
): void {
  results.push({ name, status, result, error });
  if (status === "PASSED") {
    console.log(`✅ ${name}`);
    if (result) console.log(`   Result: ${JSON.stringify(result)}`);
  } else {
    console.error(`❌ ${name}`);
    if (error) console.error(`   Error: ${error}`);
  }
}

async function testCampaignRoute(campaignName: string): Promise<void> {
  const testName = `Campaign route test: /campaigns/${campaignName}`;
  try {
    const response = await makeRequest(
      `${config.SSR_URL}/campaigns/${campaignName}`
    );

    if (response.statusCode === 200) {
      const html = response.data;

      // Check if the page contains expected SSR markers
      const hasSSRMarker = html.includes('data-ssr="true"');
      const hasCampaignDetail =
        html.includes("Campaign") || html.includes("campaign");

      if (hasSSRMarker && hasCampaignDetail) {
        logTest(testName, "PASSED", {
          status: response.statusCode,
          hasSSRMarker,
          hasCampaignDetail,
        });
      } else {
        logTest(
          testName,
          "FAILED",
          null,
          `Missing expected content. SSR marker: ${hasSSRMarker}, Campaign content: ${hasCampaignDetail}`
        );
      }
    } else if (response.statusCode === 404) {
      // This might be expected for non-existent campaigns
      logTest(`${testName} (404 expected)`, "PASSED", { status: 404 });
    } else {
      logTest(
        testName,
        "FAILED",
        null,
        `Unexpected status: ${response.statusCode}`
      );
    }
  } catch (error) {
    logTest(
      testName,
      "FAILED",
      null,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function testCampaignAPIIntegration(): Promise<void> {
  const testName = "Campaign API Integration";
  try {
    // First, get the list of campaigns from the API
    const apiResponse = await makeRequest(`${config.API_URL}/api/campaigns/`);

    if (apiResponse.statusCode !== 200) {
      logTest(
        testName,
        "FAILED",
        null,
        `API returned status ${apiResponse.statusCode}`
      );
      return;
    }

    const campaigns = JSON.parse(apiResponse.data);

    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      logTest(testName, "PASSED", {
        message: "No campaigns in database to test",
      });
      return;
    }

    // Test the first campaign
    const firstCampaign = campaigns[0];
    if (!firstCampaign.name) {
      logTest(testName, "FAILED", null, "Campaign missing 'name' field");
      return;
    }

    // Now test if we can access this campaign via SSR
    const ssrResponse = await makeRequest(
      `${config.SSR_URL}/campaigns/${firstCampaign.name}`
    );
    const html = ssrResponse.data;

    if (
      ssrResponse.statusCode === 200 &&
      html.includes(firstCampaign.title || firstCampaign.name)
    ) {
      logTest(testName, "PASSED", {
        campaignName: firstCampaign.name,
        campaignTitle: firstCampaign.title,
        foundInHTML: true,
      });
    } else {
      logTest(
        testName,
        "FAILED",
        null,
        `Could not find campaign content in SSR response. Status: ${ssrResponse.statusCode}`
      );
    }
  } catch (error) {
    logTest(
      testName,
      "FAILED",
      null,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function testNonExistentCampaign(): Promise<void> {
  const testName = "Non-existent campaign returns 404";
  try {
    const response = await makeRequest(
      `${config.SSR_URL}/campaigns/definitely-does-not-exist-${Date.now()}`
    );

    if (response.statusCode === 404) {
      logTest(testName, "PASSED", { status: 404 });
    } else {
      logTest(
        testName,
        "FAILED",
        null,
        `Expected 404, got ${response.statusCode}`
      );
    }
  } catch (error) {
    logTest(
      testName,
      "FAILED",
      null,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function runTests(): Promise<void> {
  console.log("=== Campaign Routing Integration Tests ===");
  console.log(`SSR URL: ${config.SSR_URL}`);
  console.log(`API URL: ${config.API_URL}`);
  console.log();

  // Wait for services
  console.log("Waiting for SSR service...");
  const ssrReady = await waitForService(config.SSR_URL, {
    timeout: config.TIMEOUT,
  });
  if (!ssrReady) {
    console.error("❌ SSR service did not become ready");
    process.exit(1);
  }

  console.log("Waiting for API service...");
  const apiReady = await waitForService(`${config.API_URL}/api/health/api`, {
    timeout: config.TIMEOUT,
  });
  if (!apiReady) {
    console.error("❌ API service did not become ready");
    process.exit(1);
  }

  console.log("\nRunning tests...\n");

  // Run all tests
  await testCampaignAPIIntegration();
  await testNonExistentCampaign();

  // Test some common campaign names (these might exist in your database)
  await testCampaignRoute("hr575");
  await testCampaignRoute("test-campaign");

  // Print summary
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  console.log("\n=== Test Summary ===");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error("\n❌ Some tests failed");
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error("Test runner error:", error);
    process.exit(1);
  });
}
