import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import TeamPage from "../TeamPage";
import ContentBlock from "../ContentBlock";
import type { HomePage, PersonGroup } from "../../types";

const homepage = {
  organization_name: "Test Coalition",
} as HomePage;

const groups: PersonGroup[] = [
  {
    id: 1,
    name: "Community Fellows",
    slug: "community-fellows",
    description: "Leaders from across the region",
    order: 1,
    people: [
      {
        id: 1,
        name: "Jane Doe",
        slug: "jane-doe",
        title: "Executive Director",
        linkedin_url: "https://www.linkedin.com/in/jane-doe",
        order: 1,
        profile_page_enabled: true,
        headshot_url: "https://example.com/jane.jpg",
        headshot_alt_text: "",
        headshot_title: "Jane portrait",
        headshot_author: "Photographer",
        headshot_license: "CC BY 4.0",
        headshot_source_url: "https://example.com/source",
        headshot_caption: "Portrait credit",
        headshot_caption_display: "below",
      },
      {
        id: 2,
        name: "John Smith",
        slug: "john-smith",
        title: "Board Chair",
        linkedin_url: "",
        order: 2,
        profile_page_enabled: false,
        headshot_url: "",
        headshot_alt_text: "",
        headshot_title: "",
        headshot_author: "",
        headshot_license: "",
        headshot_source_url: "",
        headshot_caption: "",
        headshot_caption_display: "",
      },
    ],
  },
];

describe("TeamPage", () => {
  it("renders compact themed cards without biographies or summaries", () => {
    const { container } = render(
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={[]}
        ContentBlockComponent={ContentBlock}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Community Fellows" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Leaders from across the region")
    ).toBeInTheDocument();
    expect(screen.getByText("Executive Director")).toBeInTheDocument();
    expect(screen.getByText("Board Chair")).toBeInTheDocument();
    expect(container).toHaveTextContent("Jane Doe");
    expect(
      container.querySelector("[data-person-bio]")
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-person-summary]")
    ).not.toBeInTheDocument();
    expect(container.querySelector(".bg-theme-bg-section")).toBeInTheDocument();
    expect(container.querySelector(".bg-theme-bg-card")).toBeInTheDocument();
  });

  it("links only people with enabled profile pages", () => {
    render(
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={[]}
        ContentBlockComponent={ContentBlock}
      />
    );

    expect(screen.getByRole("link", { name: "Jane Doe" })).toHaveAttribute(
      "href",
      "/team/jane-doe"
    );
    expect(
      screen.queryByRole("link", { name: "John Smith" })
    ).not.toBeInTheDocument();
  });

  it("uses image alt fallback, credits, and a same-size missing-headshot placeholder", () => {
    render(
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={[]}
        ContentBlockComponent={ContentBlock}
      />
    );

    expect(screen.getByRole("img", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText("Portrait credit")).toBeInTheDocument();
    const placeholder = screen.getByTestId("headshot-placeholder");
    expect(placeholder).toHaveClass("aspect-square");
    expect(placeholder.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders LinkedIn only when present with a person-specific name", () => {
    render(
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={[]}
        ContentBlockComponent={ContentBlock}
      />
    );

    expect(
      screen.getByRole("link", { name: "View Jane Doe on LinkedIn" })
    ).toHaveAttribute("href", "https://www.linkedin.com/in/jane-doe");
    expect(
      screen.queryByText(/John Smith on LinkedIn/)
    ).not.toBeInTheDocument();
  });

  it("renders team-scoped content blocks alongside people", () => {
    const TestBlock = ({ block }: { block: { content: string } }) => (
      <div data-testid="team-content-block">{block.content}</div>
    );

    render(
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={[
          {
            id: 1,
            block_type: "text",
            page_type: "team",
            content: "Meet the coalition",
            order: 1,
            is_visible: true,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ]}
        ContentBlockComponent={TestBlock}
      />
    );

    expect(screen.getByTestId("team-content-block")).toHaveTextContent(
      "Meet the coalition"
    );
    const group = screen.getByTestId("person-group-community-fellows");
    expect(within(group).getByText("Jane Doe")).toBeInTheDocument();
  });
});
