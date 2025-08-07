import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialShareButtons from '@components/SocialShareButtonsWrapper';
import analytics from '@shared/services/analytics';

// Mock analytics service
jest.mock('@shared/services/analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock Font Awesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, size }: any) => {
    const iconName = icon.iconName || 'icon';
    return (
      <span data-testid={`fa-icon-${iconName}`} data-size={size}>
        {iconName}
      </span>
    );
  },
}));

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});


describe('SocialShareButtons', () => {
  const defaultProps = {
    url: 'https://example.com/campaign/test',
    title: 'Test Campaign',
    description: 'Test campaign description',
    hashtags: ['TestTag', 'PolicyChange'],
    campaignName: 'test-campaign',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset clipboard mock
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Component Rendering', () => {
    it('renders all social share buttons', () => {
      render(<SocialShareButtons {...defaultProps} />);

      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on BlueSky')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument();
      expect(screen.getByLabelText('Share via Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument();
    });

    it('shows label when showLabel is true', () => {
      render(<SocialShareButtons {...defaultProps} showLabel={true} />);
      expect(screen.getByText('Share this campaign:')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<SocialShareButtons {...defaultProps} showLabel={false} />);
      expect(screen.queryByText('Share this campaign:')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SocialShareButtons {...defaultProps} className="custom-class" />
      );
      expect(container.querySelector('.social-share-buttons.custom-class')).toBeInTheDocument();
    });

  });

  describe('Share Button Functionality', () => {
    it('opens Facebook share window with correct URL', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        'width=600,height=400'
      );
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(defaultProps.url)),
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens LinkedIn share window with correct URL', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedInButton = screen.getByLabelText('Share on LinkedIn');
      fireEvent.click(linkedInButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens BlueSky share window with correct URL', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const blueSkyButton = screen.getByLabelText('Share on BlueSky');
      fireEvent.click(blueSkyButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('bsky.app/intent/compose'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens Twitter/X share window with correct URL and hashtags', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400'
      );
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('hashtags=TestTag,PolicyChange'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens email client with correct subject and body', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const emailButton = screen.getByLabelText('Share via Email');
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:'),
        '_blank',
        'width=600,height=400'
      );
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(`subject=${encodeURIComponent(defaultProps.title)}`),
        '_blank',
        'width=600,height=400'
      );
    });
  });

  describe('Copy Link Functionality', () => {
    it('copies URL to clipboard successfully', async () => {
      // Ensure clipboard is available and mocked
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
      });

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.url);
      });

      // Check for success state
      await waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('handles clipboard copy failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to copy link:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('uses fallback copy method when clipboard API is not available', async () => {
      // Mock clipboard API not available
      const originalClipboard = navigator.clipboard;
      delete (navigator as any).clipboard;

      // Mock isSecureContext as false
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true,
      });

      // Mock document.execCommand
      const mockExecCommand = jest.fn(() => true);
      document.execCommand = mockExecCommand;

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });

      // Check for success state
      await waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      });

      // Restore
      Object.assign(navigator, { clipboard: originalClipboard });
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
      });
    });

    it('resets copy success state after 2 seconds', async () => {
      jest.useFakeTimers();

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      // Initially shows "Copied!"
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });


  describe('Analytics Tracking', () => {
    it('tracks Facebook share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `facebook_${defaultProps.campaignName}`,
      });
    });

    it('tracks LinkedIn share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedInButton = screen.getByLabelText('Share on LinkedIn');
      fireEvent.click(linkedInButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `linkedin_${defaultProps.campaignName}`,
      });
    });

    it('tracks BlueSky share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const blueSkyButton = screen.getByLabelText('Share on BlueSky');
      fireEvent.click(blueSkyButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `bluesky_${defaultProps.campaignName}`,
      });
    });

    it('tracks Twitter/X share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `twitter_${defaultProps.campaignName}`,
      });
    });

    it('tracks email share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const emailButton = screen.getByLabelText('Share via Email');
      fireEvent.click(emailButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `email_${defaultProps.campaignName}`,
      });
    });

    it('tracks copy link click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: `copy_${defaultProps.campaignName}`,
      });
    });

    it('uses "campaign" as fallback label when campaignName is not provided', () => {
      const propsWithoutCampaignName = { ...defaultProps, campaignName: undefined };
      render(<SocialShareButtons {...propsWithoutCampaignName} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: 'facebook_campaign',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty hashtags array', () => {
      const propsWithoutHashtags = { ...defaultProps, hashtags: [] };
      render(<SocialShareButtons {...propsWithoutHashtags} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      // Should not include hashtags parameter
      expect(mockOpen).toHaveBeenCalledWith(
        expect.not.stringContaining('hashtags='),
        '_blank',
        'width=600,height=400'
      );
    });

    it('handles missing description', () => {
      const propsWithoutDescription = { ...defaultProps, description: undefined };
      render(<SocialShareButtons {...propsWithoutDescription} />);

      const emailButton = screen.getByLabelText('Share via Email');
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('body=%0A%0A'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('properly encodes special characters in URLs', () => {
      const propsWithSpecialChars = {
        ...defaultProps,
        title: 'Test & Campaign #1',
        url: 'https://example.com/campaign?id=1&type=test',
      };
      render(<SocialShareButtons {...propsWithSpecialChars} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      // URL should be double encoded for use in query parameter
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(propsWithSpecialChars.url)),
        '_blank',
        'width=600,height=400'
      );
    });
  });
});
