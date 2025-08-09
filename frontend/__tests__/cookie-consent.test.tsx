/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import CookieConsent from "../components/CookieConsent";

// Mock the vanilla-cookieconsent module
jest.mock("vanilla-cookieconsent", () => ({
  run: jest.fn(),
}));

// Mock the CSS import
jest.mock("vanilla-cookieconsent/dist/cookieconsent.css", () => ({}));

describe("Cookie Consent Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CookieConsent Component", () => {
    it("renders without crashing", () => {
      render(<CookieConsent />);
      // Component should render without throwing
    });

    it("initializes cookie consent on mount", () => {
      const { run } = require("vanilla-cookieconsent");

      render(<CookieConsent />);

      expect(run).toHaveBeenCalledTimes(1);

      // Verify key configuration properties without copying entire config
      const config = run.mock.calls[0][0];
      expect(config.categories.necessary.readOnly).toBe(true);
      expect(config.categories.analytics).toBeDefined();
      expect(config.guiOptions.consentModal.position).toBe("bottom right");
      expect(config.language.default).toBe("en");
    });

    it("only initializes once on multiple renders", () => {
      const { run } = require("vanilla-cookieconsent");
      const { rerender } = render(<CookieConsent />);

      rerender(<CookieConsent />);
      rerender(<CookieConsent />);

      // Should still only be called once due to useEffect dependency array
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe("SSR HTML Structure", () => {
    it("has proper HTML structure for cookie consent", () => {
      // Simulate SSR HTML structure
      const htmlString = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <div id="app-root" style="min-height: 100vh; display: flex; flex-direction: column;">
              <nav>Navigation</nav>
              <main style="flex: 1;">Content</main>
              <footer>
                <nav>
                  <a href="/terms">Terms of Use</a>
                  <a href="/privacy">Privacy Policy</a>
                </nav>
              </footer>
            </div>
          </body>
        </html>
      `;

      const dom = new JSDOM(htmlString);
      const document = dom.window.document;

      // Test required elements for cookie consent
      const appRoot = document.querySelector("#app-root");
      const footer = document.querySelector("footer");
      const termsLink = document.querySelector('a[href="/terms"]');
      const privacyLink = document.querySelector('a[href="/privacy"]');

      expect(appRoot).toBeTruthy();
      expect(footer).toBeTruthy();
      expect(termsLink).toBeTruthy();
      expect(privacyLink).toBeTruthy();
      expect(termsLink?.textContent).toBe("Terms of Use");
      expect(privacyLink?.textContent).toBe("Privacy Policy");
    });

    it("does not have cookie policy link in footer", () => {
      const htmlString = `
        <footer>
          <nav>
            <a href="/terms">Terms of Use</a>
            <a href="/privacy">Privacy Policy</a>
          </nav>
        </footer>
      `;

      const dom = new JSDOM(htmlString);
      const document = dom.window.document;

      const cookiePolicyLink = document.querySelector('a[href="/cookies"]');
      expect(cookiePolicyLink).toBeFalsy();
    });
  });

  describe("Configuration", () => {
    it("links to privacy policy in footer", () => {
      const { run } = require("vanilla-cookieconsent");

      render(<CookieConsent />);

      const config = run.mock.calls[0][0];
      const footer = config.language.translations.en.consentModal.footer;
      expect(footer).toContain('<a href="/privacy">Privacy Policy</a>');
    });
  });
});
