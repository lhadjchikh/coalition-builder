import React from "react";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";

import TeamRoute, { generateMetadata } from "../page";
import { ssrApiClient } from "../../../lib/api";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("../../../lib/api", () => ({
  ssrApiClient: {
    getHomepage: jest.fn(),
    getPeople: jest.fn(),
    getTeamContentBlocks: jest.fn(),
  },
}));
jest.mock("../../../utils/theme", () => ({
  generateCSSVariables: jest.fn(() => ":root { --theme-primary: blue; }"),
}));
jest.mock("../../../utils/homepage-data", () => ({
  getFallbackHomepage: jest.fn(() => ({
    organization_name: "Fallback Coalition",
  })),
}));
jest.mock("../../../components/ContentBlock", () => ({
  __esModule: true,
  default: () => <div>Content block</div>,
}));
jest.mock("../../../components/TeamPage", () => ({
  __esModule: true,
  default: ({
    orgInfo,
    groups,
    contentBlocks,
    error,
  }: {
    orgInfo: { organization_name: string };
    groups: unknown[];
    contentBlocks: unknown[];
    error?: string | null;
  }) => (
    <div data-testid="team-page">
      <span>{orgInfo.organization_name}</span>
      <span>{groups.length} groups</span>
      <span>{contentBlocks.length} blocks</span>
      {error && <span data-testid="team-error">{error}</span>}
    </div>
  ),
}));

describe("/team route", () => {
  const homepage = { organization_name: "Test Coalition", theme: null };
  const groups = [{ id: 1, name: "Staff", people: [{ id: 1 }] }];

  beforeEach(() => {
    jest.clearAllMocks();
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(homepage);
    (ssrApiClient.getPeople as jest.Mock).mockResolvedValue(groups);
    (ssrApiClient.getTeamContentBlocks as jest.Mock).mockResolvedValue([]);
  });

  it("renders publishable groups and team content", async () => {
    (ssrApiClient.getTeamContentBlocks as jest.Mock).mockResolvedValue([
      { id: 1 },
    ]);

    render(await TeamRoute());

    expect(screen.getByTestId("team-page")).toHaveTextContent("Test Coalition");
    expect(screen.getByTestId("team-page")).toHaveTextContent("1 groups");
    expect(screen.getByTestId("team-page")).toHaveTextContent("1 blocks");
    expect(ssrApiClient.getTeamContentBlocks).toHaveBeenCalledTimes(1);
  });

  it("returns not found after a successful empty people response", async () => {
    (ssrApiClient.getPeople as jest.Mock).mockResolvedValue([]);

    await expect(TeamRoute()).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders the standard error path when the people request fails", async () => {
    const error = new Error("People API unavailable");
    (ssrApiClient.getPeople as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(await TeamRoute());

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByTestId("team-error")).toHaveTextContent(
      "People API unavailable"
    );
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching people:", error);
    consoleSpy.mockRestore();
  });

  it("generates organization metadata with a static fallback", async () => {
    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Our Team - Test Coalition",
    });

    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(
      new Error("Homepage unavailable")
    );

    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Our Team - Coalition Builder",
    });
  });
});
