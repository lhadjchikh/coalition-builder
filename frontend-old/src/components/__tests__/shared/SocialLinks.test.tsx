import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialLinks from '@shared/components/SocialLinks';

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <span data-testid={`icon-${icon.iconName}`} {...props} />
  ),
}));

describe('SocialLinks', () => {
  const defaultOrgInfo = {
    organization_name: 'Test Organization',
    facebook_url: 'https://facebook.com/testorg',
    twitter_url: 'https://twitter.com/testorg',
    instagram_url: 'https://instagram.com/testorg',
    linkedin_url: 'https://linkedin.com/company/testorg',
  };

  describe('Rendering', () => {
    it('renders all social links when URLs are provided', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const facebookLink = screen.getByLabelText('Follow us on Facebook');
      const twitterLink = screen.getByLabelText('Follow us on X');
      const instagramLink = screen.getByLabelText('Follow us on Instagram');
      const linkedinLink = screen.getByLabelText('Follow us on LinkedIn');

      expect(facebookLink).toBeInTheDocument();
      expect(twitterLink).toBeInTheDocument();
      expect(instagramLink).toBeInTheDocument();
      expect(linkedinLink).toBeInTheDocument();
    });

    it('renders correct href attributes', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toHaveAttribute(
        'href',
        'https://facebook.com/testorg'
      );
      expect(screen.getByLabelText('Follow us on X')).toHaveAttribute(
        'href',
        'https://twitter.com/testorg'
      );
      expect(screen.getByLabelText('Follow us on Instagram')).toHaveAttribute(
        'href',
        'https://instagram.com/testorg'
      );
      expect(screen.getByLabelText('Follow us on LinkedIn')).toHaveAttribute(
        'href',
        'https://linkedin.com/company/testorg'
      );
    });

    it('opens links in new tab with security attributes', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const links = [
        screen.getByLabelText('Follow us on Facebook'),
        screen.getByLabelText('Follow us on X'),
        screen.getByLabelText('Follow us on Instagram'),
        screen.getByLabelText('Follow us on LinkedIn'),
      ];

      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('applies custom className', () => {
      const { container } = render(
        <SocialLinks orgInfo={defaultOrgInfo} className="custom-class" />
      );

      const socialLinksContainer = container.firstChild;
      expect(socialLinksContainer).toHaveClass('custom-class');
    });

    it('renders with default className when not provided', () => {
      const { container } = render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const socialLinksContainer = container.firstChild;
      expect(socialLinksContainer).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('only renders links with valid URLs', () => {
      const partialOrgInfo = {
        organization_name: 'Test Organization',
        facebook_url: 'https://facebook.com/testorg',
        twitter_url: '',
        instagram_url: undefined,
        linkedin_url: undefined,
      };

      render(<SocialLinks orgInfo={partialOrgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toBeInTheDocument();
      expect(screen.queryByLabelText('Follow us on X')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Follow us on Instagram')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Follow us on LinkedIn')).not.toBeInTheDocument();
    });

    it('renders nothing when no social URLs are provided', () => {
      const emptyOrgInfo = {
        organization_name: 'Test Organization',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        linkedin_url: '',
      };

      const { container } = render(<SocialLinks orgInfo={emptyOrgInfo} />);

      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(0);
    });
  });

  describe('Link Order', () => {
    it('maintains consistent order of social links', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const links = screen.getAllByRole('link');
      const expectedOrder = [
        'Follow us on Facebook',
        'Follow us on X',
        'Follow us on Instagram',
        'Follow us on LinkedIn',
      ];

      links.forEach((link, index) => {
        expect(link).toHaveAttribute('aria-label', expectedOrder[index]);
      });
    });

    it('preserves order even with missing links', () => {
      const partialOrgInfo = {
        organization_name: 'Test Organization',
        facebook_url: 'https://facebook.com/testorg',
        twitter_url: '',
        instagram_url: 'https://instagram.com/testorg',
        linkedin_url: 'https://linkedin.com/company/testorg',
      };

      render(<SocialLinks orgInfo={partialOrgInfo} />);

      const links = screen.getAllByRole('link');

      expect(links[0]).toHaveAttribute('aria-label', 'Follow us on Facebook');
      expect(links[1]).toHaveAttribute('aria-label', 'Follow us on Instagram');
      expect(links[2]).toHaveAttribute('aria-label', 'Follow us on LinkedIn');
    });
  });

  describe('Accessibility', () => {
    it('provides descriptive aria-labels for screen readers', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on X')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on LinkedIn')).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      const { container } = render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const links = container.querySelectorAll('a[href]');
      expect(links).toHaveLength(4);

      links.forEach(link => {
        expect(link.tagName).toBe('A');
      });
    });
  });

  describe('URL Validation', () => {
    it('handles URLs with different protocols', () => {
      const orgInfo = {
        organization_name: 'Test Organization',
        facebook_url: 'http://facebook.com/testorg',
        twitter_url: 'https://twitter.com/testorg',
        instagram_url: '//instagram.com/testorg',
        linkedin_url: 'https://linkedin.com/company/testorg',
      };

      render(<SocialLinks orgInfo={orgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toHaveAttribute(
        'href',
        'http://facebook.com/testorg'
      );
      expect(screen.getByLabelText('Follow us on X')).toHaveAttribute(
        'href',
        'https://twitter.com/testorg'
      );
      expect(screen.getByLabelText('Follow us on Instagram')).toHaveAttribute(
        'href',
        '//instagram.com/testorg'
      );
    });

    it('handles URLs with query parameters', () => {
      const orgInfo = {
        organization_name: 'Test Organization',
        facebook_url: 'https://facebook.com/testorg?ref=website',
        twitter_url: 'https://twitter.com/testorg?utm_source=website',
        instagram_url: '',
        linkedin_url: '',
      };

      render(<SocialLinks orgInfo={orgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toHaveAttribute(
        'href',
        'https://facebook.com/testorg?ref=website'
      );
      expect(screen.getByLabelText('Follow us on X')).toHaveAttribute(
        'href',
        'https://twitter.com/testorg?utm_source=website'
      );
    });

    it('handles international URLs', () => {
      const orgInfo = {
        organization_name: 'Test Organization',
        facebook_url: 'https://facebook.com/тест',
        twitter_url: 'https://twitter.com/測試',
        instagram_url: '',
        linkedin_url: '',
      };

      render(<SocialLinks orgInfo={orgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toHaveAttribute(
        'href',
        'https://facebook.com/тест'
      );
      expect(screen.getByLabelText('Follow us on X')).toHaveAttribute(
        'href',
        'https://twitter.com/測試'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles whitespace-only URLs as empty', () => {
      const orgInfo = {
        organization_name: 'Test Organization',
        facebook_url: '   ',
        twitter_url: '\t\n',
        instagram_url: '',
        linkedin_url: '',
      };

      render(<SocialLinks orgInfo={orgInfo} />);

      expect(screen.queryByLabelText('Follow us on Facebook')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Follow us on X')).not.toBeInTheDocument();
    });

    it('handles very long URLs', () => {
      const longUrl = 'https://facebook.com/' + 'a'.repeat(1000);
      const orgInfo = {
        organization_name: 'Test Organization',
        facebook_url: longUrl,
        twitter_url: '',
        instagram_url: '',
        linkedin_url: '',
      };

      render(<SocialLinks orgInfo={orgInfo} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toHaveAttribute('href', longUrl);
    });

    it('handles missing organization_name', () => {
      const orgInfo = {
        facebook_url: 'https://facebook.com/testorg',
        twitter_url: '',
        instagram_url: '',
        linkedin_url: '',
      };

      render(<SocialLinks orgInfo={orgInfo as any} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toBeInTheDocument();
    });

    it('handles additional properties in orgInfo', () => {
      const orgInfo = {
        ...defaultOrgInfo,
        extra_property: 'should be ignored',
        another_property: 123,
      };

      render(<SocialLinks orgInfo={orgInfo as any} />);

      expect(screen.getByLabelText('Follow us on Facebook')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(4);
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to links', () => {
      render(<SocialLinks orgInfo={defaultOrgInfo} />);

      const links = screen.getAllByRole('link');

      links.forEach(link => {
        expect(link).toHaveClass('text-gray-400');
      });
    });

    it('preserves existing CSS classes when custom className is provided', () => {
      const { container } = render(
        <SocialLinks orgInfo={defaultOrgInfo} className="footer-social" />
      );

      const socialLinksContainer = container.firstChild;
      expect(socialLinksContainer).toHaveClass('footer-social');
    });
  });
});
