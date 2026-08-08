const path = require("path");

const tailwindConfig = require("../tailwind.config.js");

function contentRoot(contentPattern) {
  const globStart = contentPattern.search(/[*!?[{]/);
  const pathPrefix =
    globStart === -1 ? contentPattern : contentPattern.slice(0, globStart);

  return pathPrefix.replace(/\/$/, "");
}

describe("Tailwind content boundaries", () => {
  it("keeps content scan roots inside the frontend project", () => {
    const frontendRoot = path.resolve(__dirname, "..");
    const contentPatterns = tailwindConfig.content.filter(
      (contentEntry) => typeof contentEntry === "string"
    );

    expect(contentPatterns).not.toHaveLength(0);

    for (const contentPattern of contentPatterns) {
      const scanRoot = path.resolve(frontendRoot, contentRoot(contentPattern));
      const relativeScanRoot = path.relative(frontendRoot, scanRoot);

      expect(relativeScanRoot).not.toMatch(/^\.\.(?:[/\\]|$)/);
    }
  });
});
