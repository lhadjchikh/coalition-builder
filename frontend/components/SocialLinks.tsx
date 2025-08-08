"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faXTwitter,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

// Interface for social links data
interface SocialLinksData {
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
}

interface SocialLinksProps {
  orgInfo: SocialLinksData;
  className?: string;
  iconSize?: "sm" | "lg" | "xl" | "2xl";
}

const SocialLinks: React.FC<SocialLinksProps> = ({
  orgInfo,
  className = "",
  iconSize = "lg",
}: SocialLinksProps) => {
  const socialLinks = [
    {
      name: "Facebook",
      url: orgInfo.facebook_url,
      icon: faFacebook,
    },
    {
      name: "X",
      url: orgInfo.twitter_url,
      icon: faXTwitter,
    },
    {
      name: "Instagram",
      url: orgInfo.instagram_url,
      icon: faInstagram,
    },
    {
      name: "LinkedIn",
      url: orgInfo.linkedin_url,
      icon: faLinkedin,
    },
  ];

  const availableLinks = socialLinks.filter(
    (link) => link.url && link.url.trim() !== "",
  );

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className={className || "flex justify-center space-x-6"}>
      {availableLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-300 transition-all duration-300 transform hover:scale-110 inline-block"
          aria-label={`Follow us on ${link.name}`}
        >
          <FontAwesomeIcon icon={link.icon} size={iconSize} />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
