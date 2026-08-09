import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePathname } from "next/navigation";

import Navbar from "../Navbar";
import { DEFAULT_NAV_ITEMS, getDefaultNavItems } from "../../types";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

describe("Navbar submenus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/");
  });

  it("defines About Us as a linked parent with About Us and Our Team children", () => {
    const about = DEFAULT_NAV_ITEMS[0];

    expect(about).toMatchObject({ label: "About Us", href: "/about" });
    expect(about.children).toEqual([
      { label: "About Us", href: "/about" },
      { label: "Our Team", href: "/team" },
    ]);
  });

  it("filters only Our Team when no publishable team exists", () => {
    expect(getDefaultNavItems(false)[0].children).toEqual([
      { label: "About Us", href: "/about" },
    ]);
    expect(getDefaultNavItems(true)[0].children).toHaveLength(2);
  });

  it("keeps closed desktop children inaccessible and out of the tab order", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);

    const trigger = screen.getByLabelText("Toggle About Us submenu");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "Our Team" })
    ).not.toBeInTheDocument();
  });

  it("opens on pointer hover and closes when the pointer leaves", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    const group = screen.getByTestId("desktop-nav-group-about-us");

    fireEvent.mouseEnter(group);
    expect(screen.getByRole("link", { name: "Our Team" })).toBeInTheDocument();

    fireEvent.mouseLeave(group);
    expect(
      screen.queryByRole("link", { name: "Our Team" })
    ).not.toBeInTheDocument();
  });

  it("stays open when the pointer leaves while focus remains inside", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    const group = screen.getByTestId("desktop-nav-group-about-us");
    const trigger = screen.getByLabelText("Toggle About Us submenu");
    fireEvent.focus(trigger);
    const teamLink = screen.getByRole("link", { name: "Our Team" });
    teamLink.focus();

    fireEvent.mouseLeave(group);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(teamLink).toHaveFocus();
  });

  it("opens on trigger focus", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    const trigger = screen.getByLabelText("Toggle About Us submenu");

    fireEvent.focus(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Our Team" })).toBeInTheDocument();
  });

  it.each(["Enter", " "])(
    "opens on %s and moves focus to the first child",
    async (key) => {
      render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
      const trigger = screen.getByLabelText("Toggle About Us submenu");

      fireEvent.keyDown(trigger, { key });

      const childLinks = screen.getAllByRole("link", { name: "About Us" });
      await waitFor(() => expect(childLinks[1]).toHaveFocus());
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    }
  );

  it("closes on Escape and restores focus to the disclosure", async () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    const trigger = screen.getByLabelText("Toggle About Us submenu");
    fireEvent.keyDown(trigger, { key: "Enter" });
    const teamLink = screen.getByRole("link", { name: "Our Team" });
    teamLink.focus();

    fireEvent.keyDown(teamLink, { key: "Escape" });

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "Our Team" })
    ).not.toBeInTheDocument();
  });

  it("closes when focus moves to another top-level item", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    const trigger = screen.getByLabelText("Toggle About Us submenu");
    fireEvent.focus(trigger);
    const campaigns = screen.getByRole("link", { name: "Campaigns" });

    fireEvent.blur(trigger, { relatedTarget: campaigns });
    fireEvent.focus(campaigns);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the About parent and Our Team child active on /team", () => {
    (usePathname as jest.Mock).mockReturnValue("/team");
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    fireEvent.mouseEnter(screen.getByTestId("desktop-nav-group-about-us"));

    const aboutParent = screen.getAllByRole("link", { name: "About Us" })[0];
    const team = screen.getByRole("link", { name: "Our Team" });
    expect(aboutParent).toHaveClass("bg-white/20");
    expect(team).toHaveClass("bg-white/20");
    expect(team).toHaveAttribute("aria-current", "page");
  });

  it("expands inline in mobile while preserving the parent /about link", () => {
    render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
    fireEvent.click(screen.getByLabelText("Toggle navigation menu"));
    const mobileMenu = screen.getByTestId("mobile-navigation");
    const mobileTrigger = within(mobileMenu).getByLabelText(
      "Toggle About Us submenu"
    );
    const parent = within(mobileMenu).getByRole("link", { name: "About Us" });

    expect(parent).toHaveAttribute("href", "/about");
    expect(mobileTrigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(mobileTrigger);

    expect(mobileTrigger).toHaveAttribute("aria-expanded", "true");
    expect(
      within(mobileMenu).getByRole("link", { name: "Our Team" })
    ).toHaveAttribute("href", "/team");

    fireEvent.click(mobileTrigger);
    expect(
      within(mobileMenu).queryByRole("link", { name: "Our Team" })
    ).not.toBeInTheDocument();
  });
});
