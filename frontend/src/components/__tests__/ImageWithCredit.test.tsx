import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageWithCredit from '../ImageWithCredit';

describe('ImageWithCredit Component', () => {
  const defaultProps = {
    src: 'https://example.com/test-image.jpg',
    alt: 'Test image description',
  };

  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render image with required props', () => {
      render(<ImageWithCredit {...defaultProps} />);

      const image = screen.getByAltText('Test image description');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    });

    it('should render without credit when no attribution data provided', () => {
      render(<ImageWithCredit {...defaultProps} />);

      const image = screen.getByAltText('Test image description');
      expect(image).toBeInTheDocument();

      // Should not have any credit text
      expect(screen.queryByText(/by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/licensed under/)).not.toBeInTheDocument();
    });

    it('should apply custom CSS classes to container and image', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          className="custom-container"
          imgClassName="custom-image"
        />
      );

      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('custom-container');

      const image = screen.getByAltText('Test image description');
      expect(image).toHaveClass('custom-image');
    });
  });

  describe('Credit Text Building', () => {
    it('should build credit text with title only', () => {
      render(
        <ImageWithCredit {...defaultProps} title="Beautiful Landscape" creditDisplay="caption" />
      );

      expect(screen.getByText('"Beautiful Landscape"')).toBeInTheDocument();
    });

    it('should build credit text with author only', () => {
      render(
        <ImageWithCredit {...defaultProps} author="Jane Photographer" creditDisplay="caption" />
      );

      expect(screen.getByText('by Jane Photographer')).toBeInTheDocument();
    });

    it('should build credit text with license only', () => {
      render(<ImageWithCredit {...defaultProps} license="CC BY 2.0" creditDisplay="caption" />);

      expect(screen.getByText('is licensed under CC BY 2.0')).toBeInTheDocument();
    });

    it('should build complete credit text with all fields', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Mountain View"
          author="John Photographer"
          license="CC BY-SA 4.0"
          creditDisplay="caption"
        />
      );

      expect(
        screen.getByText('"Mountain View" by John Photographer is licensed under CC BY-SA 4.0')
      ).toBeInTheDocument();
    });

    it('should build partial credit text with title and author', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="City Skyline"
          author="Anonymous"
          creditDisplay="caption"
        />
      );

      expect(screen.getByText('"City Skyline" by Anonymous')).toBeInTheDocument();
    });

    it('should build partial credit text with author and license', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          author="Jane Smith"
          license="All rights reserved"
          creditDisplay="caption"
        />
      );

      expect(
        screen.getByText('by Jane Smith is licensed under All rights reserved')
      ).toBeInTheDocument();
    });
  });

  describe('Caption Display Mode', () => {
    it('should render credit as caption by default', () => {
      render(<ImageWithCredit {...defaultProps} title="Test Title" author="Test Author" />);

      const creditContainer = screen.getByText('"Test Title" by Test Author').parentElement;
      expect(creditContainer).toHaveClass('mt-1', 'text-right');
    });

    it('should render caption with link when sourceUrl provided', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Linked Image"
          author="Photographer"
          sourceUrl="https://source.example.com"
          creditDisplay="caption"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://source.example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveClass('hover:text-gray-800', 'underline');
      expect(link).toHaveTextContent('"Linked Image" by Photographer');
    });

    it('should render caption without link when no sourceUrl', () => {
      render(<ImageWithCredit {...defaultProps} title="Unlinked Image" creditDisplay="caption" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('"Unlinked Image"')).toBeInTheDocument();
    });
  });

  describe('Overlay Display Mode', () => {
    it('should render credit as overlay', () => {
      render(<ImageWithCredit {...defaultProps} title="Overlay Test" creditDisplay="overlay" />);

      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('relative', 'inline-block');

      const overlay = screen.getByText('"Overlay Test"').closest('div');
      expect(overlay).toHaveClass(
        'absolute',
        'bottom-2',
        'right-2',
        'bg-black',
        'bg-opacity-60',
        'text-white',
        'px-2',
        'py-1',
        'rounded',
        'text-xs'
      );
    });

    it('should render overlay with link', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          author="Overlay Author"
          sourceUrl="https://overlay.example.com"
          creditDisplay="overlay"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://overlay.example.com');
      expect(link).toHaveClass('hover:text-gray-200', 'underline');
      expect(link).toHaveTextContent('by Overlay Author');
    });
  });

  describe('Tooltip Display Mode', () => {
    it('should render credit as tooltip', () => {
      render(<ImageWithCredit {...defaultProps} title="Tooltip Test" creditDisplay="tooltip" />);

      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('relative', 'inline-block');

      const tooltipGroup = screen.getByText('"Tooltip Test"').closest('.group');
      expect(tooltipGroup).toBeInTheDocument();

      const tooltipContent = screen.getByText('"Tooltip Test"').closest('div');
      expect(tooltipContent).toHaveClass(
        'bg-gray-800',
        'text-white',
        'px-2',
        'py-1',
        'rounded',
        'text-xs',
        'whitespace-nowrap'
      );
    });

    it('should render tooltip with proper hover states', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          author="Tooltip Author"
          sourceUrl="https://tooltip.example.com"
          creditDisplay="tooltip"
        />
      );

      const tooltipContainer = screen.getByText('by Tooltip Author').closest('.opacity-0');
      expect(tooltipContainer).toHaveClass(
        'absolute',
        'top-2',
        'right-2',
        'opacity-0',
        'group-hover:opacity-100',
        'transition-opacity',
        'duration-200'
      );
    });
  });

  describe('None Display Mode', () => {
    it('should not render credit when display mode is none', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Hidden Credit"
          author="Hidden Author"
          license="Hidden License"
          creditDisplay="none"
        />
      );

      expect(screen.queryByText(/Hidden Credit/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Hidden Author/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Hidden License/)).not.toBeInTheDocument();

      // Only image should be present
      expect(screen.getByAltText('Test image description')).toBeInTheDocument();
    });

    it('should not add relative positioning when display is none', () => {
      render(<ImageWithCredit {...defaultProps} title="Test" creditDisplay="none" />);

      const container = screen.getByRole('img').parentElement;
      expect(container).not.toHaveClass('relative');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title=""
          author=""
          license=""
          sourceUrl=""
          creditDisplay="caption"
        />
      );

      // No credit should be displayed for empty strings
      expect(screen.queryByText(/by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/licensed under/)).not.toBeInTheDocument();
    });

    it('should handle whitespace-only strings', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="   "
          author="  "
          license="   "
          creditDisplay="caption"
        />
      );

      // Whitespace-only strings should result in no credit display
      expect(screen.queryByText(/by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/licensed under/)).not.toBeInTheDocument();
    });

    it('should handle special characters in attribution text', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title={'Image with "quotes" & symbols'}
          author="Author & Co."
          license="CC BY-SA 4.0 & GPL"
          creditDisplay="caption"
        />
      );

      expect(
        screen.getByText(
          '"Image with "quotes" & symbols" by Author & Co. is licensed under CC BY-SA 4.0 & GPL'
        )
      ).toBeInTheDocument();
    });

    it('should handle very long attribution text', () => {
      const longTitle =
        'This is a very long title that might wrap to multiple lines and test how the component handles extremely long text content';
      const longAuthor =
        'An Author With A Very Long Name That Includes Multiple Words And Might Cause Layout Issues';

      render(
        <ImageWithCredit
          {...defaultProps}
          title={longTitle}
          author={longAuthor}
          creditDisplay="caption"
        />
      );

      expect(screen.getByText(`"${longTitle}" by ${longAuthor}`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for image', () => {
      render(<ImageWithCredit {...defaultProps} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Test image description');
    });

    it('should have proper link attributes for external sources', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Accessible Image"
          sourceUrl="https://external.example.com"
          creditDisplay="caption"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should work with screen readers', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Screen Reader Test"
          author="Test Author"
          creditDisplay="caption"
        />
      );

      // The credit text should be accessible to screen readers
      const creditText = screen.getByText('"Screen Reader Test" by Test Author');
      expect(creditText).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle Land and Bay Stewards image attribution', () => {
      render(
        <ImageWithCredit
          src="https://example.com/chesapeake-bay.jpg"
          alt="Chesapeake Bay landscape showing farmland and water"
          title="Chesapeake Bay Farmland"
          author="Maryland Environmental Trust"
          license="CC BY 2.0"
          sourceUrl="https://www.flickr.com/photos/marylandenviro/123456"
          creditDisplay="caption"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveTextContent(
        '"Chesapeake Bay Farmland" by Maryland Environmental Trust is licensed under CC BY 2.0'
      );
      expect(link).toHaveAttribute('href', 'https://www.flickr.com/photos/marylandenviro/123456');
    });

    it('should handle stock photo attribution', () => {
      render(
        <ImageWithCredit
          src="https://unsplash.com/photo/abc123"
          alt="Agricultural field at sunset"
          title="Golden Hour Farming"
          author="John Agricultural"
          license="Unsplash License"
          sourceUrl="https://unsplash.com/photo/abc123"
          creditDisplay="overlay"
        />
      );

      const overlay = screen.getByText(
        '"Golden Hour Farming" by John Agricultural is licensed under Unsplash License'
      );
      expect(overlay.closest('.absolute')).toHaveClass('bottom-2', 'right-2');
    });

    it('should handle attribution without title', () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          author="Professional Photographer"
          license="All rights reserved"
          creditDisplay="caption"
        />
      );

      expect(
        screen.getByText('by Professional Photographer is licensed under All rights reserved')
      ).toBeInTheDocument();
    });

    it('should handle tooltip for interactive galleries', () => {
      render(
        <ImageWithCredit
          src="https://gallery.example.com/image1.jpg"
          alt="Gallery image"
          title="Gallery Item"
          author="Gallery Artist"
          creditDisplay="tooltip"
        />
      );

      const tooltipGroup = screen.getByText('"Gallery Item" by Gallery Artist').closest('.group');
      expect(tooltipGroup).toBeInTheDocument();
    });
  });

  describe('Component Props Validation', () => {
    it('should handle missing optional props gracefully', () => {
      const { container } = render(
        <ImageWithCredit src="https://example.com/test.jpg" alt="Test" />
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should handle all creditDisplay options', () => {
      const displayModes: Array<'caption' | 'overlay' | 'tooltip' | 'none'> = [
        'caption',
        'overlay',
        'tooltip',
        'none',
      ];

      displayModes.forEach(mode => {
        const { unmount } = render(
          <ImageWithCredit {...defaultProps} title={`Test ${mode}`} creditDisplay={mode} />
        );

        if (mode !== 'none') {
          expect(screen.getByText(`"Test ${mode}"`)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(`"Test ${mode}"`)).not.toBeInTheDocument();
        }

        unmount();
      });
    });
  });
});
