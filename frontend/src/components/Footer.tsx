import React from 'react';
import { HomePage } from '../types';
import SocialLinks from './SocialLinks';

interface FooterProps {
  homepage?: HomePage;
}

const Footer: React.FC<FooterProps> = ({ homepage }) => {
  if (!homepage) {
    return null;
  }

  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">
            {homepage.organization_name}
          </h3>
          <p className="text-gray-300 mb-6">{homepage.tagline}</p>

          {/* Social Links */}
          <SocialLinks homepage={homepage} />

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {homepage.organization_name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;