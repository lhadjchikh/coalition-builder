import React from "react";
import Image from "next/image";
import Link from "next/link";

interface NavbarBrandProps {
  organizationName: string;
  logoUrl?: string;
  logoAltText?: string;
  showHomepageShadow: boolean;
  closeMenu: () => void;
}

const NavbarBrand: React.FC<NavbarBrandProps> = ({
  organizationName,
  logoUrl,
  logoAltText,
  showHomepageShadow,
  closeMenu,
}) => {
  const textClasses = logoUrl ? "" : "text-xl sm:text-2xl font-bold truncate";
  const shadow = showHomepageShadow ? "drop-shadow-lg" : "";

  return (
    <div className="flex-shrink-0 min-w-0 mr-3 sm:mr-4 max-w-[calc(100%-56px)] sm:max-w-none">
      <Link
        href="/"
        className={`flex items-center transition-all duration-300 transform hover:scale-105 ${textClasses} text-white ${shadow}`.trim()}
        onClick={closeMenu}
      >
        {logoUrl ? (
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 flex-shrink-0">
              <Image
                src={logoUrl}
                alt={logoAltText || `${organizationName} logo`}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
                priority
              />
            </div>
            <span className="font-theme-heading text-white font-semibold text-base sm:text-lg lg:text-xl leading-tight drop-shadow-lg truncate">
              {organizationName}
            </span>
          </div>
        ) : (
          organizationName
        )}
      </Link>
    </div>
  );
};

export default NavbarBrand;
