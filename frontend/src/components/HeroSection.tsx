import React from 'react';
import { HomePage } from '../types';

interface HeroSectionProps {
  homepage: HomePage;
}

const HeroSection: React.FC<HeroSectionProps> = ({ homepage }) => {
  const heroStyle: React.CSSProperties = homepage.hero_background_image
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${homepage.hero_background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  const textColorClass = homepage.hero_background_image ? 'text-white' : 'text-theme-heading';

  return (
    <div
      className={`relative py-24 sm:py-32 ${homepage.hero_background_image ? 'text-white' : 'bg-theme-bg-section'}`}
      style={heroStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className={`text-4xl font-bold font-theme-heading ${textColorClass} sm:text-5xl lg:text-6xl`}
          >
            {homepage.hero_title}
          </h1>
          {homepage.hero_subtitle && (
            <p
              className={`mt-6 text-xl font-theme-body ${textColorClass} max-w-3xl mx-auto leading-relaxed`}
            >
              {homepage.hero_subtitle}
            </p>
          )}

          {/* Optional CTA button in hero */}
          {homepage.cta_button_url && homepage.cta_button_text && (
            <div className="mt-10">
              <a
                href={homepage.cta_button_url}
                className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-200 ${
                  homepage.hero_background_image
                    ? 'text-theme-heading bg-white hover:bg-theme-bg-section'
                    : 'text-white bg-theme-primary hover:bg-theme-primary/90'
                }`}
              >
                {homepage.cta_button_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
