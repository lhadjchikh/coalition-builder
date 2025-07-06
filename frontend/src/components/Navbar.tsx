'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { NavItemData } from '@shared/types';

const NavbarContainer = styled.nav`
  background-color: #282c34;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Brand = styled.div`
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
`;

const NavMenu = styled.ul<{ $isOpen: boolean }>`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #282c34;
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: ${props => (props.$isOpen ? 'flex' : 'none')};
    gap: 1rem;
  }
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled.button`
  background: none;
  border: none;
  color: white;
  text-decoration: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: block;

  &:hover {
    background-color: #1976d2;
    color: white;
  }

  &.active {
    background-color: #2196f3;
    color: white;
  }
`;

const MobileMenuToggle = styled.button.attrs({
  'aria-label': 'Toggle navigation menu',
})`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Breadcrumb = styled.span`
  color: #ccc;
  margin-left: 0.5rem;
  font-size: 0.9rem;
`;

interface LayoutNavbarProps {
  organizationName?: string;
  // Frontend app mode props
  currentView?: 'list' | 'detail';
  onNavigate?: (view: 'list' | 'detail') => void;
  // Custom navigation items (for SSR)
  navItems?: NavItemData[];
}

const Navbar: React.FC<LayoutNavbarProps> = ({
  currentView,
  onNavigate,
  organizationName = 'Coalition Builder',
  navItems,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (view: 'list' | 'detail') => {
    if (onNavigate) {
      onNavigate(view);
    }
    setIsMenuOpen(false);
  };

  const handleItemClick = (item: NavItemData) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsMenuOpen(false);
  };

  // Default frontend app navigation
  const defaultNavItems: NavItemData[] = [
    {
      label: 'All Campaigns',
      onClick: () => handleNavigation('list'),
      active: currentView === 'list',
    },
  ];

  const navigationItems = navItems || defaultNavItems;

  return (
    <NavbarContainer>
      <Brand>{organizationName}</Brand>

      <MobileMenuToggle onClick={toggleMenu}>{isMenuOpen ? '✕' : '☰'}</MobileMenuToggle>

      <NavMenu $isOpen={isMenuOpen}>
        {navigationItems.map((item, index) => (
          <NavItem key={`nav-item-${index}-${item.label}`}>
            <NavLink
              as={item.href ? 'a' : 'button'}
              {...(item.href ? { href: item.href } : {})}
              onClick={item.href ? undefined : () => handleItemClick(item)}
              className={item.active ? 'active' : ''}
            >
              {item.label}
            </NavLink>
          </NavItem>
        ))}
        {currentView === 'detail' && (
          <NavItem>
            <Breadcrumb>→ Campaign Detail</Breadcrumb>
          </NavItem>
        )}
      </NavMenu>
    </NavbarContainer>
  );
};

export default Navbar;
