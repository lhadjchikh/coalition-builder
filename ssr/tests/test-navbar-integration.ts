/**
 * Navbar SSR Integration Test
 * Tests that the Navbar component is properly integrated into SSR rendering
 */

import { makeRequest, waitForService } from "./utils";

// Configuration
const SSR_URL = process.env.SSR_URL || "http://localhost:3000";
const MAX_TIMEOUT = 10000; // 10 seconds

interface TestResults {
  passed: number;
  failed: number;
  tests: Array<{ name: string; status: "PASS" | "FAIL"; error?: string }>;
}

async function runNavbarIntegrationTests(): Promise<TestResults> {
  const results: TestResults = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  console.log("🧪 Running Navbar SSR Integration Tests");
  console.log(`📍 Testing SSR at: ${SSR_URL}`);

  // Test 1: Check if SSR service is responsive
  try {
    console.log("\n🔍 Test 1: SSR service health check");
    await waitForService(SSR_URL, MAX_TIMEOUT);
    results.tests.push({ name: "SSR service responsive", status: "PASS" });
    results.passed++;
    console.log("✅ SSR service is responsive");
  } catch (error) {
    results.tests.push({
      name: "SSR service responsive",
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    });
    results.failed++;
    console.log("❌ SSR service is not responsive");
    return results; // Early return if SSR is not working
  }

  // Test 2: Check if homepage contains navigation element
  try {
    console.log("\n🔍 Test 2: Navbar element present in SSR");
    const response = await makeRequest(`${SSR_URL}/`);
    const html = response.body;

    // Check if the HTML contains a nav element
    if (html.includes("<nav") || html.includes('role="navigation"')) {
      results.tests.push({
        name: "Navbar element in SSR HTML",
        status: "PASS",
      });
      results.passed++;
      console.log("✅ Navigation element found in SSR HTML");
    } else {
      throw new Error("No navigation element found in SSR HTML");
    }
  } catch (error) {
    results.tests.push({
      name: "Navbar element in SSR HTML",
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    });
    results.failed++;
    console.log("❌ Navigation element not found in SSR HTML");
  }

  // Test 3: Check if navbar contains expected navigation items
  try {
    console.log("\n🔍 Test 3: Navbar contains expected navigation items");
    const response = await makeRequest(`${SSR_URL}/`);
    const html = response.body;

    // Check for expected navigation items
    const expectedItems = ["About", "Campaigns", "Contact"];
    const missingItems = expectedItems.filter((item) => !html.includes(item));

    if (missingItems.length === 0) {
      results.tests.push({ name: "Navigation items present", status: "PASS" });
      results.passed++;
      console.log("✅ All expected navigation items found");
    } else {
      throw new Error(`Missing navigation items: ${missingItems.join(", ")}`);
    }
  } catch (error) {
    results.tests.push({
      name: "Navigation items present",
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    });
    results.failed++;
    console.log("❌ Some navigation items are missing");
  }

  // Test 4: Check if organization name is rendered
  try {
    console.log("\n🔍 Test 4: Organization name in navbar");
    const response = await makeRequest(`${SSR_URL}/`);
    const html = response.body;

    // The organization name should be visible in the navbar
    if (
      html.includes("Coalition Builder") ||
      html.includes("organization_name")
    ) {
      results.tests.push({
        name: "Organization name in navbar",
        status: "PASS",
      });
      results.passed++;
      console.log("✅ Organization name found in navbar");
    } else {
      throw new Error("Organization name not found in navbar");
    }
  } catch (error) {
    results.tests.push({
      name: "Organization name in navbar",
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    });
    results.failed++;
    console.log("❌ Organization name not found in navbar");
  }

  return results;
}

// Main execution
async function main() {
  console.log("🚀 Starting Navbar SSR Integration Tests\n");

  try {
    const results = await runNavbarIntegrationTests();

    console.log("\n📊 Test Results Summary:");
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.tests.length}`);

    if (results.failed > 0) {
      console.log("\n💥 Failed Tests:");
      results.tests
        .filter((test) => test.status === "FAIL")
        .forEach((test) => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error("💥 Test execution failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { runNavbarIntegrationTests };
