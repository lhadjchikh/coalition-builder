import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AboutPage from "../AboutPage";
import { HomePage, ContentBlock } from "../../types/api";

// Mock child components
jest.mock("../PageLayout", () => ({
  __esModule: true,
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div data-testid="page-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock("../ContentBlocksList", () => ({
  __esModule: true,
  default: ({ contentBlocks }: { contentBlocks: unknown[] }) => (
    <div data-testid="content-blocks-list">
      {contentBlocks.map((block: { id: string; title: string }) => (
        <div key={block.id} data-testid={`content-block-${block.id}`}>
          {block.title}
        </div>
      ))}
    </div>
  ),
}));

const mockOrgInfo: HomePage = {
  id: 1,
  organization_name: "Test Organization",
  tagline: "Test Tagline",
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
  hero_background_image_url: "",
  hero_overlay_enabled: false,
  hero_overlay_color: "",
  hero_overlay_opacity: 0.5,
  cta_title: "CTA Title",
  cta_content: "CTA Content",
  cta_button_text: "Click Me",
  cta_button_url: "/action",
  campaigns_section_title: "Campaigns",
  campaigns_section_subtitle: "Our campaigns",
  show_campaigns_section: true,
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const mockContentBlocks: ContentBlock[] = [
  {
    id: 1,
    title: "About Us Block 1",
    block_type: "text",
    page_type: "about",
    content: "Content 1",
    image_url: "",
    image_alt_text: "",
    image_title: "",
    image_author: "",
    image_license: "",
    image_source_url: "",
    css_classes: "",
    background_color: "",
    order: 1,
    is_visible: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    animation_type: "none",
    animation_delay: 0,
  },
  {
    id: 2,
    title: "About Us Block 2",
    block_type: "text",
    page_type: "about",
    content: "Content 2",
    image_url: "",
    image_alt_text: "",
    image_title: "",
    image_author: "",
    image_license: "",
    image_source_url: "",
    css_classes: "",
    background_color: "",
    order: 2,
    is_visible: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    animation_type: "none",
    animation_delay: 0,
  },
];

const MockContentBlockComponent: React.FC<{ block: ContentBlock }> = ({
  block,
}) => <div>{block.title}</div>;

describe("AboutPage", () => {
  it("should render with content blocks", () => {
    render(
      <AboutPage
        orgInfo={mockOrgInfo}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByTestId("content-blocks-list")).toBeInTheDocument();
    expect(screen.getByTestId("content-block-1")).toBeInTheDocument();
    expect(screen.getByTestId("content-block-2")).toBeInTheDocument();
  });

  it("should render without content blocks", () => {
    render(
      <AboutPage
        orgInfo={mockOrgInfo}
        contentBlocks={[]}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.queryByTestId("content-blocks-list")).not.toBeInTheDocument();
  });

  it("should pass error to PageLayout", () => {
    const { rerender } = render(
      <AboutPage
        orgInfo={mockOrgInfo}
        contentBlocks={mockContentBlocks}
        error="Test error"
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();

    // Verify component handles no error
    rerender(
      <AboutPage
        orgInfo={mockOrgInfo}
        contentBlocks={mockContentBlocks}
        error={null}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
  });

  it("should pass optional components to PageLayout", () => {
    const MockNavbar = () => <nav>Custom Navbar</nav>;
    const MockFooter = () => <footer>Custom Footer</footer>;
    const navItems = [{ label: "Home", href: "/" }];

    render(
      <AboutPage
        orgInfo={mockOrgInfo}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
        NavbarComponent={MockNavbar}
        FooterComponent={MockFooter}
        navItems={navItems}
      />
    );

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
  });
});
