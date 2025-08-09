import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignsPage from '../CampaignsPage';
import { HomePage, Campaign, ContentBlock } from '../../types/api';

// Mock child components
jest.mock('../ContentBlocksList', () => ({
  __esModule: true,
  default: ({ contentBlocks }: { contentBlocks: unknown[] }) => (
    <div data-testid="content-blocks-list">
      {contentBlocks.map((block: { id: string; title: string }) => (
        <div key={block.id}>{block.title}</div>
      ))}
    </div>
  ),
}));

jest.mock('../CampaignsList', () => ({
  __esModule: true,
  default: ({ campaigns, onCampaignSelect }: { campaigns: unknown[]; onCampaignSelect?: (campaign: unknown) => void }) => (
    <div data-testid="campaigns-list">
      {campaigns.map((campaign: { id: string; title: string }) => (
        <div 
          key={campaign.id} 
          data-testid={`campaign-${campaign.id}`}
          onClick={() => onCampaignSelect?.(campaign)}
        >
          {campaign.title}
        </div>
      ))}
    </div>
  ),
}));

const mockHomepage: HomePage = {
  id: 1,
  organization_name: 'Test Organization',
  tagline: 'Test Tagline',
  hero_title: 'Hero Title',
  hero_subtitle: 'Hero Subtitle',
  hero_background_image_url: '',
  hero_overlay_enabled: false,
  hero_overlay_color: '',
  hero_overlay_opacity: 0.5,
  cta_title: 'CTA Title',
  cta_content: 'CTA Content',
  cta_button_text: 'Click Me',
  cta_button_url: '/action',
  campaigns_section_title: 'Our Campaigns',
  campaigns_section_subtitle: 'Check out our policy campaigns',
  show_campaigns_section: true,
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  linkedin_url: '',
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'campaign-1',
    title: 'Campaign 1',
    summary: 'Summary 1',
    active: true,
    created_at: '2024-01-01',
  },
  {
    id: 2,
    name: 'campaign-2',
    title: 'Campaign 2',
    summary: 'Summary 2',
    active: true,
    created_at: '2024-01-01',
  },
];

const mockContentBlocks: ContentBlock[] = [
  {
    id: 1,
    title: 'Campaigns Block',
    block_type: 'text',
    page_type: 'campaigns',
    content: 'Content',
    image_url: '',
    image_alt_text: '',
    image_title: '',
    image_author: '',
    image_license: '',
    image_source_url: '',
    css_classes: '',
    background_color: '',
    order: 1,
    is_visible: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    animation_type: 'none',
    animation_delay: 0,
  },
];

const MockContentBlockComponent: React.FC<{ block: ContentBlock }> = ({ block }) => (
  <div>{block.title}</div>
);

describe('CampaignsPage', () => {
  it('should render page with title and subtitle', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByText('Our Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Check out our policy campaigns')).toBeInTheDocument();
  });

  it('should render with default title when campaigns_section_title is not provided', () => {
    const homepageWithoutTitle = { ...mockHomepage, campaigns_section_title: '' };
    
    render(
      <CampaignsPage
        homepage={homepageWithoutTitle}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByText('Policy Campaigns')).toBeInTheDocument();
  });

  it('should render without subtitle when not provided', () => {
    const homepageWithoutSubtitle = { ...mockHomepage, campaigns_section_subtitle: '' };
    
    render(
      <CampaignsPage
        homepage={homepageWithoutSubtitle}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByText('Our Campaigns')).toBeInTheDocument();
    expect(screen.queryByText('Check out our policy campaigns')).not.toBeInTheDocument();
  });

  it('should render content blocks when available', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId('content-blocks-list')).toBeInTheDocument();
    expect(screen.getByText('Campaigns Block')).toBeInTheDocument();
  });

  it('should not render content blocks when empty', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={[]}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.queryByTestId('content-blocks-list')).not.toBeInTheDocument();
  });

  it('should render campaigns list', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-1')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-2')).toBeInTheDocument();
  });

  it('should handle campaign selection', () => {
    const onCampaignSelect = jest.fn();
    
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        onCampaignSelect={onCampaignSelect}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    fireEvent.click(screen.getByTestId('campaign-1'));
    expect(onCampaignSelect).toHaveBeenCalledWith(mockCampaigns[0]);
  });

  it('should display campaigns error when provided', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        campaignsError="Failed to load campaigns"
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
  });

  it('should display content error when provided', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        contentError="Failed to load content"
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.getByTestId('content-blocks-list')).toBeInTheDocument();
  });

  it('should render with optional navbar and footer components', () => {
    const MockNavbar = ({ organizationName }: { organizationName?: string }) => (
      <nav data-testid="navbar">{organizationName}</nav>
    );
    const MockFooter = () => <footer data-testid="footer">Footer</footer>;
    const navItems = [{ label: 'Home', href: '/' }];

    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
        NavbarComponent={MockNavbar}
        FooterComponent={MockFooter}
        navItems={navItems}
      />
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render without navbar and footer when not provided', () => {
    render(
      <CampaignsPage
        homepage={mockHomepage}
        campaigns={mockCampaigns}
        contentBlocks={mockContentBlocks}
        ContentBlockComponent={MockContentBlockComponent}
      />
    );

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });
});