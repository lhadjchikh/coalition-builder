import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialShareButtons from '@shared/components/SocialShareButtons';

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <span data-testid={`icon-${icon.iconName}`} {...props} />
  ),
}));

// Mock analytics
jest.mock('@shared/services/analytics', () => ({
  default: {
    trackEvent: jest.fn(),
  },
}));

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.location
delete (window as any).location;
window.location = { origin: 'http://localhost:3000' } as any;

describe('SocialShareButtons', () => {
  const defaultProps = {
    url: 'http://example.com/campaign',
    title: 'Test Campaign',
    description: 'Test Description',
    hashtags: ['test', 'campaign'],
    campaignName: 'test-campaign',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders all social share buttons', () => {
      render(<SocialShareButtons {...defaultProps} />);

      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on BlueSky')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument();
      expect(screen.getByLabelText('Share via Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <SocialShareButtons {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('shows label when showLabel is true', () => {
      render(<SocialShareButtons {...defaultProps} showLabel={true} />);

      expect(screen.getByText('Share this campaign:')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<SocialShareButtons {...defaultProps} showLabel={false} />);

      expect(screen.queryByText('Share this campaign:')).not.toBeInTheDocument();
    });
  });

  describe('Social Platform Sharing', () => {
    it('opens Facebook share dialog', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fexample.com%2Fcampaign',
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens LinkedIn share dialog', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedinButton = screen.getByLabelText('Share on LinkedIn');
      fireEvent.click(linkedinButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/sharing/share-offsite/?url=http%3A%2F%2Fexample.com%2Fcampaign',
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens BlueSky share dialog', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const blueskyButton = screen.getByLabelText('Share on BlueSky');
      fireEvent.click(blueskyButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://bsky.app/intent/compose?text=Test%20Campaign%20http%3A%2F%2Fexample.com%2Fcampaign',
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens X (Twitter) share dialog with hashtags', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://twitter.com/intent/tweet?text=Test%20Campaign&url=http%3A%2F%2Fexample.com%2Fcampaign&hashtags=test,campaign',
        '_blank',
        'width=600,height=400'
      );
    });

    it('opens email client', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const emailButton = screen.getByLabelText('Share via Email');
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'mailto:?subject=Test%20Campaign&body=Test%20Description%0A%0Ahttp%3A%2F%2Fexample.com%2Fcampaign',
        '_blank',
        'width=600,height=400'
      );
    });
  });

  describe('Copy Link Functionality', () => {
    it('copies link to clipboard using modern API', async () => {
      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('http://example.com/campaign');
      });
    });

    it('shows success state after copying', async () => {
      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
        expect(screen.getByTestId('icon-check')).toBeInTheDocument();
      });
    });

    it('reverts to original state after 2 seconds', async () => {
      jest.useFakeTimers();

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByTestId('icon-link')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('handles clipboard API failure gracefully', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy link:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('falls back to execCommand when clipboard API is not available', async () => {
      // Remove clipboard API
      delete (navigator as any).clipboard;
      window.isSecureContext = false;

      const mockExecCommand = jest.fn(() => true);
      document.execCommand = mockExecCommand;

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });

      // Restore clipboard API
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });
    });
  });

  describe('Analytics Tracking', () => {
    const analytics = (require('@shared/services/analytics') as any).default;

    it('tracks Facebook share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText('Share on Facebook');
      fireEvent.click(facebookButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: 'facebook_test-campaign',
      });
    });

    it('tracks LinkedIn share click', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedinButton = screen.getByLabelText('Share on LinkedIn');
      fireEvent.click(linkedinButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: 'linkedin_test-campaign',
      });
    });

    it('tracks copy link action', () => {
      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText('Copy link');
      fireEvent.click(copyButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: 'share_click',
        category: 'social_share',
        label: 'copy_test-campaign',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined description', () => {
      const props = { ...defaultProps, description: undefined };
      render(<SocialShareButtons {...props} />);

      const emailButton = screen.getByLabelText('Share via Email');
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('body=%0A%0A'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('handles empty hashtags array', () => {
      const props = { ...defaultProps, hashtags: [] };
      render(<SocialShareButtons {...props} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.not.stringContaining('hashtags='),
        '_blank',
        'width=600,height=400'
      );
    });

    it('handles special characters in title and description', () => {
      const props = {
        ...defaultProps,
        title: 'Test & Campaign <special>',
        description: 'Description with "quotes" and & symbols',
      };

      render(<SocialShareButtons {...props} />);

      const twitterButton = screen.getByLabelText('Share on X');
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('Test%20%26%20Campaign%20%3Cspecial%3E'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('handles SSR environment without window', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { container } = render(<SocialShareButtons {...defaultProps} />);

      expect(container.querySelector('.social-share-buttons')).toBeInTheDocument();

      global.window = originalWindow;
    });
  });
});
