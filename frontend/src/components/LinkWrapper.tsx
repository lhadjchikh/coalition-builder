import React from 'react';
import { Link } from 'react-router-dom';

interface LinkWrapperProps {
  to?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Centralized LinkWrapper component for React Router navigation.
 *
 * Accepts both 'to' and 'href' props for compatibility, but standardizes
 * on 'to' for React Router. Falls back to '/' if neither is provided.
 *
 * Usage:
 * - Prefer: <LinkWrapper to="/path">Link</LinkWrapper>
 * - Legacy: <LinkWrapper href="/path">Link</LinkWrapper>
 */
const LinkWrapper: React.FC<LinkWrapperProps> = ({ to, href, children, className, onClick }) => (
  <Link to={to || href || '/'} className={className} onClick={onClick}>
    {children}
  </Link>
);

export default LinkWrapper;
