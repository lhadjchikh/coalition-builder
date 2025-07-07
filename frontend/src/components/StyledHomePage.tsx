import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Campaign, HomePage as HomePageType } from '../types';
import {
  Container,
  Section,
  Heading,
  Text,
  Button,
  Card,
  Link,
  Alert,
} from './styled/StyledComponents';
import { EnhancedThemeProvider } from '../contexts/StyledThemeProvider';
import { ThemeProvider } from '../contexts/ThemeContext';
import ContentBlock from './ContentBlock';
import SocialLinks from './SocialLinks';
import styled from 'styled-components';

interface StyledHomePageProps {
  onCampaignSelect?: (campaign: Campaign) => void;
}

// Custom styled components for specific homepage needs
const HeroSection = styled(Section)`
  position: relative;
  background: ${props => props.theme.colors.backgroundSection};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.primary}15 0%,
      ${props => props.theme.colors.accent}15 100%
    );
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid ${props => props.theme.colors.backgroundSection};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${props => props.theme.spacing[4]};
`;

const CampaignGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing[6]};

  @media (min-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const CampaignCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CampaignContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CampaignTitle = styled(Heading).attrs({ level: 3 })`
  margin-bottom: ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.typography.sizes.lg};
`;

const CampaignSummary = styled(Text)`
  flex: 1;
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const CTASection = styled(Section)`
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  text-align: center;
`;

const CTAHeading = styled(Heading).attrs({ level: 2 })`
  color: ${props => props.theme.colors.white};
`;

const CTAText = styled(Text)`
  color: ${props => props.theme.colors.white};
  opacity: 0.9;
`;

const Footer = styled.footer`
  background: ${props => props.theme.colors.secondary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[12]} 0;
`;

const FooterContent = styled.div`
  text-align: center;
`;

const FooterTitle = styled(Heading).attrs({ level: 3 })`
  color: ${props => props.theme.colors.white};
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const FooterTagline = styled(Text)`
  color: ${props => props.theme.colors.white};
  opacity: 0.8;
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const ContactInfo = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const ContactLink = styled(Link)`
  color: ${props => props.theme.colors.white};
  opacity: 0.8;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.white};
    opacity: 1;
  }
`;

const StyledHomePage: React.FC<StyledHomePageProps> = ({ onCampaignSelect }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [homepage, setHomepage] = useState<HomePageType | null>(null);
  const [homepageError, setHomepageError] = useState<string | null>(null);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const [homepageResult, campaignsResult] = await Promise.allSettled([
        API.getHomepage(),
        API.getCampaigns(),
      ]);

      if (!isMounted) return;

      if (homepageResult.status === 'fulfilled') {
        setHomepage(homepageResult.value);
      } else {
        const errorMessage =
          homepageResult.reason instanceof Error
            ? homepageResult.reason.message
            : 'Failed to fetch homepage';
        setHomepageError(errorMessage);
        console.error('Error fetching homepage:', homepageResult.reason);
      }

      if (campaignsResult.status === 'fulfilled') {
        setCampaigns(campaignsResult.value);
      } else {
        const errorMessage =
          campaignsResult.reason instanceof Error
            ? campaignsResult.reason.message
            : 'Failed to fetch campaigns';
        setCampaignsError(errorMessage);
        console.error('Error fetching campaigns:', campaignsResult.reason);
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackHomepage: HomePageType = {
    id: 0,
    organization_name: process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Coalition Builder',
    tagline: process.env.NEXT_PUBLIC_TAGLINE || 'Building strong advocacy partnerships',
    hero_title: 'Welcome to Coalition Builder',
    hero_subtitle: 'Empowering advocates to build strong policy coalitions',
    hero_background_image: '',
    about_section_title: 'About Our Mission',
    about_section_content:
      'We believe in the power of collective action to drive meaningful policy change.',
    cta_title: 'Get Involved',
    cta_content: 'Join our coalition and help make a difference.',
    cta_button_text: 'Learn More',
    cta_button_url: '',
    contact_email: 'info@example.org',
    contact_phone: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Policy Campaigns',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    content_blocks: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentHomepage = homepage || fallbackHomepage;

  if (loading) {
    return (
      <ThemeProvider initialTheme={currentHomepage.theme}>
        <EnhancedThemeProvider>
          <LoadingContainer>
            <LoadingSpinner />
            <Text>Loading...</Text>
          </LoadingContainer>
        </EnhancedThemeProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider initialTheme={currentHomepage.theme}>
      <EnhancedThemeProvider>
        <main role="main">
          {/* Development notice */}
          {process.env.NODE_ENV === 'development' && homepageError && (
            <Section padding="sm">
              <Container>
                <Alert variant="info">
                  <Text weight="semibold">Development Notice</Text>
                  <Text size="sm">
                    Using fallback homepage data due to API error: {homepageError}
                  </Text>
                </Alert>
              </Container>
            </Section>
          )}

          {/* Hero Section */}
          <HeroSection padding="xl">
            <Container>
              <HeroContent>
                <Heading level={1}>{currentHomepage.hero_title}</Heading>
                {currentHomepage.hero_subtitle && (
                  <Text size="xl" style={{ maxWidth: '48rem', margin: '0 auto' }}>
                    {currentHomepage.hero_subtitle}
                  </Text>
                )}
                {currentHomepage.cta_button_url && currentHomepage.cta_button_text && (
                  <div style={{ marginTop: '2.5rem' }}>
                    <Button
                      as="a"
                      href={currentHomepage.cta_button_url}
                      size="lg"
                      variant="primary"
                    >
                      {currentHomepage.cta_button_text}
                    </Button>
                  </div>
                )}
              </HeroContent>
            </Container>
          </HeroSection>

          {/* About Section */}
          {currentHomepage.about_section_content && (
            <Section padding="lg">
              <Container>
                <div style={{ textAlign: 'center' }}>
                  <Heading level={2}>{currentHomepage.about_section_title}</Heading>
                  <div
                    style={{ maxWidth: '64rem', margin: '0 auto' }}
                    dangerouslySetInnerHTML={{
                      __html: currentHomepage.about_section_content,
                    }}
                  />
                </div>
              </Container>
            </Section>
          )}

          {/* Dynamic Content Blocks */}
          {currentHomepage.content_blocks && currentHomepage.content_blocks.length > 0 && (
            <>
              {currentHomepage.content_blocks
                .filter(block => block.is_visible)
                .sort((a, b) => a.order - b.order)
                .map(block => (
                  <ContentBlock key={block.id} block={block} />
                ))}
            </>
          )}

          {/* Campaigns Section */}
          {currentHomepage.show_campaigns_section && (
            <Section variant="accent" padding="lg">
              <Container>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <Heading level={2}>{currentHomepage.campaigns_section_title}</Heading>
                  {currentHomepage.campaigns_section_subtitle && (
                    <Text size="xl">{currentHomepage.campaigns_section_subtitle}</Text>
                  )}
                </div>

                {campaignsError && !campaigns.length ? (
                  <Alert variant="warning">
                    <Text>Unable to load campaigns at this time.</Text>
                    {process.env.NODE_ENV === 'development' && (
                      <Text size="sm">{campaignsError}</Text>
                    )}
                  </Alert>
                ) : campaigns.length === 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <Text color="textMuted">No campaigns are currently available.</Text>
                  </div>
                ) : (
                  <CampaignGrid>
                    {campaigns.map(campaign => (
                      <CampaignCard
                        key={campaign.id}
                        variant="elevated"
                        data-testid={`styled-homepage-campaign-${campaign.id}`}
                      >
                        <CampaignContent>
                          <CampaignTitle>{campaign.title}</CampaignTitle>
                          <CampaignSummary>{campaign.summary}</CampaignSummary>
                          {onCampaignSelect ? (
                            <Button variant="outline" onClick={() => onCampaignSelect(campaign)}>
                              Learn more →
                            </Button>
                          ) : (
                            <Button as="a" href={`/campaigns/${campaign.name}`} variant="outline">
                              Learn more →
                            </Button>
                          )}
                        </CampaignContent>
                      </CampaignCard>
                    ))}
                  </CampaignGrid>
                )}
              </Container>
            </Section>
          )}

          {/* Call to Action Section */}
          {currentHomepage.cta_content && (
            <CTASection padding="lg">
              <Container>
                <CTAHeading>{currentHomepage.cta_title}</CTAHeading>
                <CTAText size="xl">{currentHomepage.cta_content}</CTAText>
                {currentHomepage.cta_button_url && currentHomepage.cta_button_text && (
                  <div style={{ marginTop: '2rem' }}>
                    <Button
                      as="a"
                      href={currentHomepage.cta_button_url}
                      variant="outline"
                      size="lg"
                      style={{
                        backgroundColor: 'white',
                        borderColor: 'white',
                        color: currentHomepage.theme?.primary_color || '#2563eb',
                      }}
                    >
                      {currentHomepage.cta_button_text}
                    </Button>
                  </div>
                )}
              </Container>
            </CTASection>
          )}

          {/* Footer */}
          <Footer>
            <Container>
              <FooterContent>
                <FooterTitle>{currentHomepage.organization_name}</FooterTitle>
                <FooterTagline>{currentHomepage.tagline}</FooterTagline>

                <ContactInfo>
                  <ContactLink href={`mailto:${currentHomepage.contact_email}`}>
                    {currentHomepage.contact_email}
                  </ContactLink>
                  {currentHomepage.contact_phone && (
                    <>
                      {' • '}
                      <ContactLink href={`tel:${currentHomepage.contact_phone}`}>
                        {currentHomepage.contact_phone}
                      </ContactLink>
                    </>
                  )}
                </ContactInfo>

                <SocialLinks homepage={currentHomepage} />
              </FooterContent>
            </Container>
          </Footer>
        </main>
      </EnhancedThemeProvider>
    </ThemeProvider>
  );
};

export default StyledHomePage;
