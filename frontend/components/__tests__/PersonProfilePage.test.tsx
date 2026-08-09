import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import PersonProfilePage from "../PersonProfilePage";
import type { HomePage, PersonDetail } from "../../types";

const homepage = { organization_name: "Test Coalition" } as HomePage;
const person: PersonDetail = {
  id: 1,
  name: "Jane Doe",
  slug: "jane-doe",
  title: "Executive Director",
  bio: "<p>Jane leads <strong>coalition strategy</strong>.</p>",
  linkedin_url: "https://www.linkedin.com/in/jane-doe",
  order: 1,
  profile_page_enabled: true,
  profile_image_url: "",
  profile_image_alt_text: "",
  profile_image_title: "",
  profile_image_author: "",
  profile_image_license: "",
  profile_image_source_url: "",
  profile_image_caption: "",
  profile_image_caption_display: "",
};

describe("PersonProfilePage", () => {
  it("renders the full formatted biography only on the profile page", () => {
    const { container } = render(
      <PersonProfilePage orgInfo={homepage} person={person} />
    );

    const biography = container.querySelector("[data-person-bio]");
    expect(biography).toContainHTML(
      "<p>Jane leads <strong>coalition strategy</strong>.</p>"
    );
    expect(
      screen.getByRole("heading", { name: "Jane Doe" })
    ).toBeInTheDocument();
    expect(screen.getByText("Executive Director")).toBeInTheDocument();
  });

  it("renders the standard page error state without biography content", () => {
    const { container } = render(
      <PersonProfilePage
        orgInfo={homepage}
        person={null}
        error="People API unavailable"
      />
    );

    expect(container).toHaveTextContent("Unable to load profile at this time.");
    expect(
      container.querySelector("[data-person-bio]")
    ).not.toBeInTheDocument();
  });
});
