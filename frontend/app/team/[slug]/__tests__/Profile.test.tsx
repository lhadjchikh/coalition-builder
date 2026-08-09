import React from "react";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";

import ProfileRoute, { generateMetadata } from "../page";
import { ssrApiClient } from "../../../../lib/api";
import { ApiRequestError } from "../../../../services/api-client";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("../../../../lib/api", () => ({
  ssrApiClient: {
    getHomepage: jest.fn(),
    getPerson: jest.fn(),
  },
}));
jest.mock("../../../../utils/theme", () => ({
  generateCSSVariables: jest.fn(() => ":root { --theme-primary: blue; }"),
}));
jest.mock("../../../../utils/homepage-data", () => ({
  getFallbackHomepage: jest.fn(() => ({
    organization_name: "Fallback Coalition",
  })),
}));
jest.mock("../../../../components/PersonProfilePage", () => ({
  __esModule: true,
  default: ({
    person,
    error,
  }: {
    person: { name: string } | null;
    error?: string | null;
  }) => (
    <div data-testid="profile-page">
      {person?.name}
      {error && <span data-testid="profile-error">{error}</span>}
    </div>
  ),
}));

describe("/team/[slug] route", () => {
  const params = Promise.resolve({ slug: "jane-doe" });
  const homepage = { organization_name: "Test Coalition", theme: null };
  const person = {
    id: 1,
    name: "Jane Doe",
    title: "Executive Director",
    bio: "<p>Biography</p>",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(homepage);
    (ssrApiClient.getPerson as jest.Mock).mockResolvedValue(person);
  });

  it("renders an enabled public biography", async () => {
    render(await ProfileRoute({ params }));

    expect(screen.getByTestId("profile-page")).toHaveTextContent("Jane Doe");
    expect(ssrApiClient.getPerson).toHaveBeenCalledWith("jane-doe");
  });

  it("returns not found for a non-public profile", async () => {
    (ssrApiClient.getPerson as jest.Mock).mockRejectedValue(
      new ApiRequestError(404)
    );

    await expect(ProfileRoute({ params })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders the standard error path for a profile API outage", async () => {
    const error = new ApiRequestError(503);
    (ssrApiClient.getPerson as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(await ProfileRoute({ params }));

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByTestId("profile-error")).toHaveTextContent(
      "HTTP error! status: 503"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching person profile:",
      error
    );
    consoleSpy.mockRestore();
  });

  it("generates person metadata with a static fallback", async () => {
    await expect(generateMetadata({ params })).resolves.toMatchObject({
      title: "Jane Doe - Test Coalition",
      description: "Executive Director at Test Coalition",
    });

    (ssrApiClient.getPerson as jest.Mock).mockRejectedValue(
      new Error("Unavailable")
    );

    await expect(generateMetadata({ params })).resolves.toMatchObject({
      title: "Team Profile - Coalition Builder",
    });
  });
});
