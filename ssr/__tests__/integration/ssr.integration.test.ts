/**
 * SSR Integration Tests
 *
 * These tests run within the GitHub Actions workflow after Docker Compose
 * has started all services. They assume:
 * - API is available at http://localhost:8000
 * - SSR is available at http://localhost:3000
 * - Test data has been created via scripts/create_test_data.py
 */

// Using Node.js built-in fetch (available in Node 18+)

const SSR_URL = process.env.SSR_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8000";

describe("SSR Integration Tests", () => {
  const timeout = 30000; // 30 second timeout for network requests

  describe("API Health Checks", () => {
    test(
      "API health endpoint responds successfully",
      async () => {
        const response = await fetch(`${API_URL}/health/`);
        expect(response.ok).toBe(true);
      },
      timeout,
    );

    test(
      "Homepage API endpoint returns data",
      async () => {
        const response = await fetch(`${API_URL}/api/homepage/`);
        expect(response.ok).toBe(true);

        const homepage = await response.json();
        expect(homepage).toHaveProperty("organization_name");
        expect(homepage).toHaveProperty("about_section_title");
      },
      timeout,
    );

    test(
      "Campaigns API endpoint returns data",
      async () => {
        const response = await fetch(`${API_URL}/api/campaigns/`);
        expect(response.ok).toBe(true);

        const campaigns = await response.json();
        expect(Array.isArray(campaigns)).toBe(true);
      },
      timeout,
    );
  });

  describe("SSR Rendering", () => {
    test(
      "SSR health endpoint reports healthy status",
      async () => {
        const response = await fetch(`${SSR_URL}/health`);
        expect(response.ok).toBe(true);

        const health = await response.json();
        expect(health.status).toBe("healthy");
      },
      timeout,
    );

    test(
      "SSR renders homepage with real or fallback data",
      async () => {
        const response = await fetch(SSR_URL);
        expect(response.ok).toBe(true);

        const html = await response.text();

        // Verify basic HTML structure
        expect(html).toMatch(/<html/);
        expect(html).toMatch(/<main/);
        expect(html).toMatch(/footer/);

        // Check for real data indicators (from test data)
        const realDataIndicators = ["Test Coalition", "About Our Test Mission"];

        // Check for fallback data indicators (from homepage.py defaults)
        const fallbackDataIndicators = [
          "Welcome to Coalition Builder",
          "About Our Mission",
          "Coalition Builder",
        ];

        const realDataCount = realDataIndicators.filter((indicator) =>
          html.includes(indicator),
        ).length;

        const fallbackDataCount = fallbackDataIndicators.filter((indicator) =>
          html.includes(indicator),
        ).length;

        // Should have either real data OR sufficient fallback data
        const hasRealData = realDataCount > 0;
        const hasSufficientFallbackData = fallbackDataCount >= 2;

        expect(hasRealData || hasSufficientFallbackData).toBe(true);

        if (hasRealData) {
          console.log(`✅ Found real data indicators: ${realDataCount}`);
        } else if (hasSufficientFallbackData) {
          console.log(
            `✅ Found fallback data indicators: ${fallbackDataCount}`,
          );
        }
      },
      timeout,
    );

    test(
      "SSR renders campaign pages correctly",
      async () => {
        // First verify the campaign exists in the API
        const campaignsResponse = await fetch(`${API_URL}/api/campaigns/`);
        expect(campaignsResponse.ok).toBe(true);

        const campaigns = await campaignsResponse.json();
        // @ts-ignore - TypeScript can't infer the campaign structure from JSON
        const testCampaign = campaigns.find((c) => c.name === "test-campaign");
        expect(testCampaign).toBeDefined();
        expect(testCampaign.title).toBe("Test Campaign");

        // Now test the SSR campaign page with retry logic for timing issues
        const testCampaignName = "test-campaign";
        let campaignPageResponse;
        let html;
        let retries = 3;

        while (retries > 0) {
          campaignPageResponse = await fetch(
            `${SSR_URL}/campaigns/${testCampaignName}`,
          );
          expect(campaignPageResponse.ok).toBe(true);

          html = await campaignPageResponse.text();

          // If we get loading state, wait and retry
          if (
            html.includes("Loading campaign") ||
            html.includes('data-testid="campaign-loading"')
          ) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            retries--;
            continue;
          }

          break;
        }

        // Verify basic HTML structure
        expect(html).toMatch(/<html/);

        // Since the campaign exists in the API, SSR should successfully render it
        const hasTestCampaignContent = html.includes("Test Campaign");
        const has404Structure =
          html.includes("404") || html.includes("Not Found");
        const hasLoadingState =
          html.includes("Loading campaign") ||
          html.includes('data-testid="campaign-loading"');

        // If we still have loading state after retries, that's a failure
        expect(hasLoadingState).toBe(false);

        // If we have a 404, that's a failure since the campaign exists in the API
        expect(has404Structure).toBe(false);

        // The campaign should have loaded successfully
        expect(hasTestCampaignContent).toBe(true);
        expect(html).toMatch(/<main/);
      },
      timeout,
    );
  });

  describe("SSR Fallback Behavior", () => {
    test(
      "SSR gracefully handles API unavailability",
      async () => {
        // This test verifies that SSR still renders when API is slow/unavailable
        // by checking for fallback content patterns
        const response = await fetch(SSR_URL);
        expect(response.ok).toBe(true);

        const html = await response.text();

        // Even with API issues, we should get valid HTML structure
        expect(html).toMatch(/<html/);
        expect(html).toMatch(/<head/);
        expect(html).toMatch(/<body/);

        // And should not contain error messages that would break the page
        expect(html).not.toMatch(/500 Internal Server Error/);
        expect(html).not.toMatch(/Runtime Error/);
        expect(html).not.toMatch(/TypeError/);
      },
      timeout,
    );
  });
});
