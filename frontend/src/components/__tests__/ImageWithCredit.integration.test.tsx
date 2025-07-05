import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ImageWithCredit from '../ImageWithCredit';

// Mock content block data structure
interface ContentBlockData {
  id: number;
  title: string;
  block_type: string;
  content: string;
  image_url: string;
  image_alt_text: string;
  image_title: string;
  image_author: string;
  image_license: string;
  image_source_url: string;
  order: number;
  is_visible: boolean;
}

// Component that renders content blocks with image attribution
const ContentBlockRenderer: React.FC<{ contentBlock: ContentBlockData }> = ({ contentBlock }) => {
  if (contentBlock.block_type !== 'image' && contentBlock.block_type !== 'text_image') {
    return <div>{contentBlock.content}</div>;
  }

  return (
    <div className="content-block">
      <h3>{contentBlock.title}</h3>
      <ImageWithCredit
        src={contentBlock.image_url}
        alt={contentBlock.image_alt_text}
        title={contentBlock.image_title}
        author={contentBlock.image_author}
        license={contentBlock.image_license}
        sourceUrl={contentBlock.image_source_url}
        creditDisplay="caption"
        className="content-block-image"
        imgClassName="w-full h-auto"
      />
      <div className="content">{contentBlock.content}</div>
    </div>
  );
};

describe('ImageWithCredit Integration Tests', () => {
  describe('Content Block Integration', () => {
    it('should render image with full attribution from backend data', () => {
      const contentBlock: ContentBlockData = {
        id: 1,
        title: 'Agricultural Conservation',
        block_type: 'image',
        content: 'This image shows sustainable farming practices in the Chesapeake Bay watershed.',
        image_url: 'https://example.com/conservation-farm.jpg',
        image_alt_text: 'Aerial view of sustainable farm with buffer strips and cover crops',
        image_title: 'Sustainable Farming Practices',
        image_author: 'USDA Natural Resources Conservation Service',
        image_license: 'Public Domain',
        image_source_url: 'https://www.nrcs.usda.gov/photos/conservation-farm-aerial',
        order: 1,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={contentBlock} />);

      // Check image rendering
      const image = screen.getByAltText(
        'Aerial view of sustainable farm with buffer strips and cover crops'
      );
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/conservation-farm.jpg');
      expect(image).toHaveClass('w-full', 'h-auto');

      // Check attribution
      const attribution = screen.getByText(
        '"Sustainable Farming Practices" by USDA Natural Resources Conservation Service is licensed under Public Domain'
      );
      expect(attribution).toBeInTheDocument();

      // Check it's a link
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        'https://www.nrcs.usda.gov/photos/conservation-farm-aerial'
      );
    });

    it('should handle partial attribution data from backend', () => {
      const contentBlock: ContentBlockData = {
        id: 2,
        title: 'Bay Restoration',
        block_type: 'text_image',
        content: 'Restoration efforts are ongoing throughout the watershed.',
        image_url: 'https://example.com/bay-restoration.jpg',
        image_alt_text: 'Restored wetland area with native plants',
        image_title: 'Wetland Restoration',
        image_author: '', // No author
        image_license: 'CC BY-SA 4.0',
        image_source_url: '', // No source URL
        order: 2,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={contentBlock} />);

      // Should show title and license, but no author
      expect(
        screen.getByText('"Wetland Restoration" is licensed under CC BY-SA 4.0')
      ).toBeInTheDocument();

      // Should not be a link since no source URL
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should handle image block with no attribution data', () => {
      const contentBlock: ContentBlockData = {
        id: 3,
        title: 'Local Farm',
        block_type: 'image',
        content: 'A local farm in the region.',
        image_url: 'https://example.com/local-farm.jpg',
        image_alt_text: 'Local farm building and fields',
        image_title: '', // No attribution data
        image_author: '',
        image_license: '',
        image_source_url: '',
        order: 3,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={contentBlock} />);

      // Image should render
      const image = screen.getByAltText('Local farm building and fields');
      expect(image).toBeInTheDocument();

      // No attribution should be shown
      expect(screen.queryByText(/by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/licensed under/)).not.toBeInTheDocument();
    });

    it('should handle only author attribution', () => {
      const contentBlock: ContentBlockData = {
        id: 4,
        title: 'Photographer Credit Only',
        block_type: 'image',
        content: 'Image with only photographer credit.',
        image_url: 'https://example.com/photographer-only.jpg',
        image_alt_text: 'Sample image',
        image_title: '',
        image_author: 'Jane Professional Photographer',
        image_license: '',
        image_source_url: 'https://photographer.com/portfolio',
        order: 4,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={contentBlock} />);

      // Should show only author credit with link
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('by Jane Professional Photographer');
      expect(link).toHaveAttribute('href', 'https://photographer.com/portfolio');
    });
  });

  describe('Display Mode Scenarios', () => {
    const baseContentBlock: ContentBlockData = {
      id: 5,
      title: 'Display Mode Test',
      block_type: 'image',
      content: 'Testing different display modes.',
      image_url: 'https://example.com/display-test.jpg',
      image_alt_text: 'Display mode test image',
      image_title: 'Test Image',
      image_author: 'Test Author',
      image_license: 'Test License',
      image_source_url: 'https://test.example.com',
      order: 5,
      is_visible: true,
    };

    it('should render with overlay display for hero images', () => {
      render(
        <div className="hero-section relative">
          <ImageWithCredit
            src={baseContentBlock.image_url}
            alt={baseContentBlock.image_alt_text}
            title={baseContentBlock.image_title}
            author={baseContentBlock.image_author}
            license={baseContentBlock.image_license}
            sourceUrl={baseContentBlock.image_source_url}
            creditDisplay="overlay"
            className="hero-image"
            imgClassName="w-full h-96 object-cover"
          />
        </div>
      );

      // Check overlay positioning
      const overlay = screen.getByText(
        '"Test Image" by Test Author is licensed under Test License'
      );
      expect(overlay.closest('.absolute')).toHaveClass('bottom-2', 'right-2');
    });

    it('should render with tooltip for gallery images', () => {
      render(
        <div className="image-gallery">
          <ImageWithCredit
            src={baseContentBlock.image_url}
            alt={baseContentBlock.image_alt_text}
            title={baseContentBlock.image_title}
            author={baseContentBlock.image_author}
            license={baseContentBlock.image_license}
            sourceUrl={baseContentBlock.image_source_url}
            creditDisplay="tooltip"
            className="gallery-item"
            imgClassName="w-48 h-48 object-cover"
          />
        </div>
      );

      // Check tooltip structure
      const tooltipContent = screen.getByText(
        '"Test Image" by Test Author is licensed under Test License'
      );
      expect(tooltipContent.closest('.opacity-0')).toHaveClass('group-hover:opacity-100');
    });

    it('should handle responsive image with caption', () => {
      render(
        <div className="responsive-container">
          <ImageWithCredit
            src={baseContentBlock.image_url}
            alt={baseContentBlock.image_alt_text}
            title={baseContentBlock.image_title}
            author={baseContentBlock.image_author}
            license={baseContentBlock.image_license}
            sourceUrl={baseContentBlock.image_source_url}
            creditDisplay="caption"
            className="responsive-image-wrapper"
            imgClassName="w-full h-auto md:w-1/2 lg:w-1/3"
          />
        </div>
      );

      const image = screen.getByAltText('Display mode test image');
      expect(image).toHaveClass('w-full', 'h-auto', 'md:w-1/2', 'lg:w-1/3');

      const caption = screen.getByText(
        '"Test Image" by Test Author is licensed under Test License'
      );
      expect(caption.parentElement).toHaveClass('mt-1', 'text-right');
    });
  });

  describe('Real-world Content Scenarios', () => {
    it('should handle Land and Bay Stewards homepage content block', () => {
      const homepageBlock: ContentBlockData = {
        id: 101,
        title: 'Our Mission in Action',
        block_type: 'text_image',
        content:
          'Land and Bay Stewards brings together farmers, watermen, conservationists, and community members to advocate for policies that protect the Chesapeake Bay watershed.',
        image_url: 'https://images.landandbaystewards.org/mission-farmers-meeting.jpg',
        image_alt_text: 'Farmers and conservationists meeting to discuss sustainable practices',
        image_title: 'Stakeholder Collaboration Meeting',
        image_author: 'Maryland Farm Bureau',
        image_license: 'All rights reserved',
        image_source_url: 'https://mdfarmbureau.com/conservation-meeting-2024',
        order: 1,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={homepageBlock} />);

      // Check all elements are rendered
      expect(screen.getByText('Our Mission in Action')).toBeInTheDocument();
      expect(
        screen.getByAltText('Farmers and conservationists meeting to discuss sustainable practices')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          '"Stakeholder Collaboration Meeting" by Maryland Farm Bureau is licensed under All rights reserved'
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Land and Bay Stewards brings together/)).toBeInTheDocument();

      // Check attribution link
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://mdfarmbureau.com/conservation-meeting-2024');
    });

    it('should handle campaign content block with Creative Commons licensing', () => {
      const campaignBlock: ContentBlockData = {
        id: 102,
        title: 'Technical Service Providers',
        block_type: 'image',
        content:
          'TSPs provide crucial technical assistance to farmers implementing conservation practices.',
        image_url: 'https://images.landandbaystewards.org/tsp-field-consultation.jpg',
        image_alt_text: 'Technical service provider consulting with farmer in field',
        image_title: 'TSP Field Consultation',
        image_author: 'USDA NRCS',
        image_license: 'CC BY 2.0',
        image_source_url: 'https://www.flickr.com/photos/usdanrcs/tsp-consultation',
        order: 2,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={campaignBlock} />);

      expect(screen.getByText('Technical Service Providers')).toBeInTheDocument();
      expect(
        screen.getByText('"TSP Field Consultation" by USDA NRCS is licensed under CC BY 2.0')
      ).toBeInTheDocument();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        'https://www.flickr.com/photos/usdanrcs/tsp-consultation'
      );
    });

    it('should handle blog post content block with stock photo', () => {
      const blogBlock: ContentBlockData = {
        id: 103,
        title: 'Conservation Success Stories',
        block_type: 'text_image',
        content: 'Read about successful conservation implementations across the watershed.',
        image_url: 'https://images.unsplash.com/conservation-success',
        image_alt_text: 'Before and after photos of stream restoration project',
        image_title: 'Stream Restoration Success',
        image_author: 'Environmental Photographer',
        image_license: 'Unsplash License',
        image_source_url: 'https://unsplash.com/photos/stream-restoration',
        order: 3,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={blogBlock} />);

      expect(
        screen.getByText(
          '"Stream Restoration Success" by Environmental Photographer is licensed under Unsplash License'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility with content blocks', () => {
      const accessibleBlock: ContentBlockData = {
        id: 104,
        title: 'Accessible Content',
        block_type: 'image',
        content: 'Content that maintains accessibility standards.',
        image_url: 'https://example.com/accessible.jpg',
        image_alt_text:
          'Detailed description of image for screen readers including key visual elements and context',
        image_title: 'Accessible Image Example',
        image_author: 'Accessibility Expert',
        image_license: 'CC BY 4.0',
        image_source_url: 'https://accessibility.example.com',
        order: 1,
        is_visible: true,
      };

      render(<ContentBlockRenderer contentBlock={accessibleBlock} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute(
        'alt',
        'Detailed description of image for screen readers including key visual elements and context'
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
