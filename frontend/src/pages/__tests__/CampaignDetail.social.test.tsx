import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CampaignDetail from '@pages/CampaignDetail';
import API from '@services/api';

// Mock API
jest.mock('@services/api');
jest.mock('@shared/services/analytics');

// Mock the shared components
jest.mock('@shared/components/CampaignDetail', () => ({
  __esModule: true,
  default: ({ _campaignId, initialCampaign }: any) => (
    <div data-testid="campaign-detail-component">Campaign: {initialCampaign?.title}</div>
  ),
}));

jest.mock('@shared/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock('@shared/components/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock SocialShareButtons but keep it testable
jest.mock('@components/SocialShareButtonsWrapper', () => {
  return function MockSocialShareButtons(props: any) {
    return (
      <div data-testid="social-share-buttons" className={props.className}>
        <div data-testid="share-url">{props.url}</div>
        <div data-testid="share-title">{props.title}</div>
        <div data-testid="share-description">{props.description}</div>
        <div data-testid="share-hashtags">{props.hashtags?.join(',')}</div>
        <div data-testid="share-campaign-name">{props.campaignName}</div>
        <div data-testid="share-show-label">{props.showLabel?.toString()}</div>
      </div>
    );
  };
});

// Mock other components used in CampaignDetail
jest.mock('@components/EndorsementForm', () => ({
  __esModule: true,
  default: () => <div data-testid="endorsement-form">Endorsement Form</div>,
}));

jest.mock('@components/EndorsementsList', () => ({
  __esModule: true,
  default: () => <div data-testid="endorsements-list">Endorsements List</div>,
}));

jest.mock('@components/GrowthIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="growth-icon">Growth Icon</div>,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ name: 'clean-water' }),
  useLocation: () => ({ pathname: '/campaigns/clean-water' }),
}));

describe('CampaignDetail Social Sharing Features', () => {
  const mockCampaign = {
    id: 1,
    name: 'clean-water',
    title: 'Clean Water Initiative',
    summary: 'Ensuring access to clean water for all communities',
    description: 'Detailed description of the clean water initiative...',
    image_url: 'https://example.com/water.jpg',
    image_alt_text: 'Clean water flowing',
    endorsement_statement: 'I support clean water access',
    allow_endorsements: true,
    endorsement_form_instructions: 'Please fill out all fields',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
  };

  const mockHomepage = {
    id: 1,
    organization_name: 'Test Organization',
    tagline: 'Working together',
    hero_title: 'Welcome',
    hero_subtitle: 'Making a difference',
    hero_background_image_url: '',
    cta_title: 'Join Us',
    cta_content: 'Be part of the change',
    cta_button_text: 'Get Started',
    cta_button_url: '/contact',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Our Campaigns',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (API.getCampaignByName as jest.Mock).mockResolvedValue(mockCampaign);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
  });

  describe('Social Share Section', () => {
    it('renders social share section after campaign loads', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Amplify This Campaign')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Share with your network to help build momentum for change.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
    });

    it('passes correct props to SocialShareButtons in share section', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
      });

      // Check props passed to the main share section
      const shareButtons = screen.getAllByTestId('social-share-buttons')[0];
      const urlElement = shareButtons.querySelector('[data-testid="share-url"]');
      const titleElement = shareButtons.querySelector('[data-testid="share-title"]');
      const descriptionElement = shareButtons.querySelector('[data-testid="share-description"]');
      const hashtagsElement = shareButtons.querySelector('[data-testid="share-hashtags"]');
      const campaignNameElement = shareButtons.querySelector('[data-testid="share-campaign-name"]');
      const showLabelElement = shareButtons.querySelector('[data-testid="share-show-label"]');

      expect(urlElement?.textContent).toContain('/campaigns/clean-water');
      expect(titleElement?.textContent).toBe(mockCampaign.title);
      expect(descriptionElement?.textContent).toBe(mockCampaign.summary);
      expect(hashtagsElement?.textContent).toContain('PolicyChange');
      expect(hashtagsElement?.textContent).toContain('CivicEngagement');
      expect(hashtagsElement?.textContent).toContain('cleanwater'); // name with hyphens removed
      expect(campaignNameElement?.textContent).toBe(mockCampaign.name);
      expect(showLabelElement?.textContent).toBe('false');
    });

    it('uses campaign description as fallback when summary is not available', async () => {
      const campaignWithoutSummary = { ...mockCampaign, summary: null };
      (API.getCampaignByName as jest.Mock).mockResolvedValue(campaignWithoutSummary);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons')[0];
      const descriptionElement = shareButtons.querySelector('[data-testid="share-description"]');
      expect(descriptionElement?.textContent).toBe(mockCampaign.description);
    });
  });

  describe('Floating Share Button (Mobile)', () => {
    beforeEach(() => {
      // Mock window.matchMedia for mobile detection
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('shows floating share button on mobile screens', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Share this campaign')).toBeInTheDocument();
      });

      const floatingButton = screen.getByLabelText('Share this campaign');
      expect(floatingButton).toHaveClass('fixed', 'bottom-4', 'right-4');
    });

    it('opens share menu when floating button is clicked', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Share this campaign')).toBeInTheDocument();
      });

      const floatingButton = screen.getByLabelText('Share this campaign');
      fireEvent.click(floatingButton);

      // Should show the share menu
      expect(screen.getByLabelText('Close share menu')).toBeInTheDocument();

      // Should show compact share buttons with label
      const shareMenu = screen
        .getAllByTestId('social-share-buttons')
        .find(el => el.classList.contains('compact'));
      expect(shareMenu).toBeInTheDocument();

      const showLabelElement = shareMenu?.querySelector('[data-testid="share-show-label"]');
      expect(showLabelElement?.textContent).toBe('true');
    });

    it('closes share menu when close button is clicked', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Share this campaign')).toBeInTheDocument();
      });

      // Open the menu
      const floatingButton = screen.getByLabelText('Share this campaign');
      fireEvent.click(floatingButton);

      // Close the menu
      const closeButton = screen.getByLabelText('Close share menu');
      fireEvent.click(closeButton);

      // Should show the floating button again
      expect(screen.getByLabelText('Share this campaign')).toBeInTheDocument();
      expect(screen.queryByLabelText('Close share menu')).not.toBeInTheDocument();
    });

    it('passes correct props to mobile share menu', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Share this campaign')).toBeInTheDocument();
      });

      const floatingButton = screen.getByLabelText('Share this campaign');
      fireEvent.click(floatingButton);

      // Find the compact share buttons
      const shareMenus = screen.getAllByTestId('social-share-buttons');
      const compactMenu = shareMenus.find(el => el.classList.contains('compact'));

      expect(compactMenu).toBeInTheDocument();

      const urlElement = compactMenu?.querySelector('[data-testid="share-url"]');
      const titleElement = compactMenu?.querySelector('[data-testid="share-title"]');
      const campaignNameElement = compactMenu?.querySelector('[data-testid="share-campaign-name"]');

      expect(urlElement?.textContent).toContain('/campaigns/clean-water');
      expect(titleElement?.textContent).toBe(mockCampaign.title);
      expect(campaignNameElement?.textContent).toBe(mockCampaign.name);
    });
  });

  describe('Error Handling', () => {
    it('does not render share section when campaign fails to load', async () => {
      (API.getCampaignByName as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/couldn't be loaded/)).toBeInTheDocument();
      });

      expect(screen.queryByTestId('social-share-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('Amplify This Campaign')).not.toBeInTheDocument();
    });

    it('does not render share section when campaign is not found', async () => {
      (API.getCampaignByName as jest.Mock).mockResolvedValue(null);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Campaign not found/)).toBeInTheDocument();
      });

      expect(screen.queryByTestId('social-share-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('Amplify This Campaign')).not.toBeInTheDocument();
    });
  });

  describe('Integration with Campaign Data', () => {
    it('handles special characters in campaign name for hashtags', async () => {
      const campaignWithSpecialName = {
        ...mockCampaign,
        name: 'clean-water-2024',
      };
      (API.getCampaignByName as jest.Mock).mockResolvedValue(campaignWithSpecialName);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons')[0];
      const hashtagsElement = shareButtons.querySelector('[data-testid="share-hashtags"]');

      // Hyphens should be removed from the campaign name in hashtags
      expect(hashtagsElement?.textContent).toContain('cleanwater2024');
    });

    it('generates correct share URL based on campaign name', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons')[0];
      const urlElement = shareButtons.querySelector('[data-testid="share-url"]');

      // Should contain the campaign name in the URL
      expect(urlElement?.textContent).toContain('/campaigns/clean-water');
    });
  });
});
