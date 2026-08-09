interface NavbarAppearance {
  isHomepage: boolean;
  isVisible: boolean;
  scrolled: boolean;
}

export function getNavbarClasses({
  isHomepage,
  isVisible,
  scrolled,
}: NavbarAppearance): string {
  const base =
    "top-0 left-0 right-0 z-50 border-b transition-all duration-300 transform";
  const position = isHomepage ? "fixed" : "sticky";
  const visibility = isVisible ? "translate-y-0" : "-translate-y-full";
  const appearance =
    isHomepage && !scrolled
      ? "bg-transparent border-transparent"
      : "navbar-glass border-white/10";
  return `${position} ${base} ${visibility} ${appearance}`;
}

export function getNavItemClasses(
  isActive: boolean,
  showHomepageShadow: boolean
): string {
  const base =
    "px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300 transform hover:scale-105";
  const state = isActive
    ? "bg-white/20 text-white shadow-soft"
    : "text-white/90 hover:bg-white/10 hover:text-white";
  const shadow = showHomepageShadow ? "drop-shadow-lg" : "";
  return `${base} ${state} ${shadow}`.trim();
}

export function getMobileNavItemClasses(
  isActive: boolean,
  isButton = false
): string {
  const display = isButton ? "block w-full text-left" : "block";
  const size = isButton ? "text-base" : "text-lg";
  const state = isActive
    ? "bg-theme-primary-dark text-white"
    : "text-white/90 hover:bg-white/10 hover:text-white";
  return `${display} px-3 py-2 rounded-md ${size} font-medium transition-all duration-300 transform hover:scale-[1.02] ${state}`;
}
