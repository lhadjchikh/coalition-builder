import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentBlock from '../ContentBlock';
import { ContentBlock as ContentBlockType } from '../../types';

const baseContentBlock: ContentBlockType = {
  id: 1,
  title: 'Test Block',
  block_type: 'text',
  content: '<p>Test content</p>',
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
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('ContentBlock', () => {
  describe('visibility control', () => {
    it('should render when is_visible is true', () => {
      const block = { ...baseContentBlock, is_visible: true };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });

    it('should not render when is_visible is false', () => {
      const block = { ...baseContentBlock, is_visible: false };
      const { container } = render(<ContentBlock block={block} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('text block type', () => {
    it('should render text block with title and content', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text',
        title: 'Text Block Title',
        content: '<p>This is <strong>bold</strong> text content.</p>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Text Block Title')).toBeInTheDocument();
      expect(screen.getByText('This is bold text content.')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('should render text block without title', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text',
        title: '',
        content: '<p>Content without title</p>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Content without title')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('should apply prose classes for text blocks', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text',
        content: '<p>Test content</p>',
      };
      render(<ContentBlock block={block} />);

      const proseDiv = screen.getByText('Test content').closest('.prose');
      expect(proseDiv).toBeInTheDocument();
      expect(proseDiv).toHaveClass('prose', 'max-w-none');
    });
  });

  describe('image block type', () => {
    it('should render image block with all elements', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        title: 'Image Block Title',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: 'Test image',
        content: '<p>Image caption</p>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Image Block Title')).toBeInTheDocument();
      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(screen.getByText('Image caption')).toBeInTheDocument();
    });

    it('should use fallback alt text when image_alt_text is empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        title: 'Image Title',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: '',
      };
      render(<ContentBlock block={block} />);

      const image = screen.getByAltText('Image Title');
      expect(image).toBeInTheDocument();
    });

    it('should use default alt text when both alt text and title are empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        title: '',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: '',
      };
      render(<ContentBlock block={block} />);

      const image = screen.getByAltText('Content image');
      expect(image).toBeInTheDocument();
    });

    it('should not render image when image_url is empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        title: 'Image Block',
        image_url: '',
        content: '<p>Caption only</p>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Image Block')).toBeInTheDocument();
      expect(screen.getByText('Caption only')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should not render caption when content is empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        title: 'Image Block',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: 'Test image',
        content: '',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Image Block')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
      const captionDiv = screen.queryByText('mt-4 text-gray-600');
      expect(captionDiv).not.toBeInTheDocument();
    });
  });

  describe('text_image block type', () => {
    it('should render text and image side by side', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text_image',
        title: 'Text Image Block',
        content: '<p>Text content alongside image</p>',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: 'Side image',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Text Image Block')).toBeInTheDocument();
      expect(screen.getByText('Text content alongside image')).toBeInTheDocument();
      expect(screen.getByAltText('Side image')).toBeInTheDocument();
    });

    it('should render text without image when image_url is empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text_image',
        title: 'Text Only',
        content: '<p>Just text content</p>',
        image_url: '',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Text Only')).toBeInTheDocument();
      expect(screen.getByText('Just text content')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should apply responsive layout classes', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'text_image',
        content: '<p>Test</p>',
        image_url: 'https://example.com/image.jpg',
      };
      render(<ContentBlock block={block} />);

      const container = screen.getByText('Test').closest('.flex');
      expect(container).toHaveClass('flex', 'flex-col', 'lg:flex-row', 'gap-8', 'items-center');
    });
  });

  describe('quote block type', () => {
    it('should render quote with attribution', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'quote',
        title: 'John Doe',
        content: 'This is an inspiring quote about our cause.',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('"This is an inspiring quote about our cause."')).toBeInTheDocument();
      expect(screen.getByText('— John Doe')).toBeInTheDocument();
    });

    it('should render quote without attribution when title is empty', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'quote',
        title: '',
        content: 'Quote without attribution.',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('"Quote without attribution."')).toBeInTheDocument();
      expect(screen.queryByText(/^—/)).not.toBeInTheDocument();
    });

    it('should apply correct quote styling', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'quote',
        content: 'Test quote',
      };
      render(<ContentBlock block={block} />);

      const blockquote = screen.getByText('"Test quote"');
      expect(blockquote.tagName).toBe('BLOCKQUOTE');
      expect(blockquote).toHaveClass('text-xl', 'italic', 'text-gray-800', 'mb-4');
    });
  });

  describe('stats block type', () => {
    it('should render stats block with title and grid content', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'stats',
        title: 'Key Statistics',
        content: '<div class="stat">100+ Members</div><div class="stat">50 Events</div>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Key Statistics')).toBeInTheDocument();
      expect(screen.getByText('100+ Members')).toBeInTheDocument();
      expect(screen.getByText('50 Events')).toBeInTheDocument();
    });

    it('should apply grid layout classes', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'stats',
        content: '<div>Stat content</div>',
      };
      render(<ContentBlock block={block} />);

      const gridDiv = screen.getByText('Stat content').closest('.grid');
      expect(gridDiv).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8');
    });
  });

  describe('custom_html block type', () => {
    it('should render custom HTML content', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'custom_html',
        title: 'Custom Section',
        content: '<div class="custom-widget"><span>Custom Widget</span></div>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Custom Section')).toBeInTheDocument();
      expect(screen.getByText('Custom Widget')).toBeInTheDocument();
    });

    it('should render custom HTML without title', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'custom_html',
        title: '',
        content: '<button class="custom-btn">Click me</button>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Click me')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });
  });

  describe('unknown block type (default case)', () => {
    it('should render unknown block type as text block', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'unknown_type',
        title: 'Unknown Block',
        content: '<p>Fallback content</p>',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Unknown Block')).toBeInTheDocument();
      expect(screen.getByText('Fallback content')).toBeInTheDocument();
    });
  });

  describe('styling and CSS classes', () => {
    it('should apply base CSS classes', () => {
      const block = { ...baseContentBlock };
      const { container } = render(<ContentBlock block={block} />);

      const blockContainer = container.firstChild as HTMLElement;
      expect(blockContainer).toHaveClass('w-full');
    });

    it('should apply custom CSS classes', () => {
      const block = {
        ...baseContentBlock,
        css_classes: 'custom-class another-class',
      };
      const { container } = render(<ContentBlock block={block} />);

      const blockContainer = container.firstChild as HTMLElement;
      expect(blockContainer).toHaveClass('w-full', 'custom-class', 'another-class');
    });

    it('should apply background color style', () => {
      const block = {
        ...baseContentBlock,
        background_color: '#ff0000',
      };
      const { container } = render(<ContentBlock block={block} />);

      const blockContainer = container.firstChild as HTMLElement;
      expect(blockContainer).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should not apply background color when empty', () => {
      const block = {
        ...baseContentBlock,
        background_color: '',
      };
      const { container } = render(<ContentBlock block={block} />);

      const blockContainer = container.firstChild as HTMLElement;
      expect(blockContainer.style.backgroundColor).toBe('');
    });

    it('should combine custom classes and background color', () => {
      const block = {
        ...baseContentBlock,
        css_classes: 'custom-bg',
        background_color: '#00ff00',
      };
      const { container } = render(<ContentBlock block={block} />);

      const blockContainer = container.firstChild as HTMLElement;
      expect(blockContainer).toHaveClass('w-full', 'custom-bg');
      expect(blockContainer).toHaveStyle({ backgroundColor: '#00ff00' });
    });
  });

  describe('responsive container layout', () => {
    it('should apply responsive container classes', () => {
      const block = { ...baseContentBlock };
      render(<ContentBlock block={block} />);

      const innerContainer = screen.getByText('Test Block').closest('.max-w-7xl');
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass(
        'max-w-7xl',
        'mx-auto',
        'px-4',
        'sm:px-6',
        'lg:px-8',
        'py-8'
      );
    });
  });

  describe('HTML content security', () => {
    it('should render safe HTML content', () => {
      const block = {
        ...baseContentBlock,
        content: '<p>Safe <strong>bold</strong> and <em>italic</em> text.</p>',
      };
      render(<ContentBlock block={block} />);

      const boldText = screen.getByText('bold');
      const italicText = screen.getByText('italic');

      expect(boldText.tagName).toBe('STRONG');
      expect(italicText.tagName).toBe('EM');
    });

    it('should handle complex HTML structures', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'custom_html',
        content: `
          <div class="complex-structure">
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <table>
              <tr><td>Cell 1</td><td>Cell 2</td></tr>
            </table>
          </div>
        `,
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content gracefully', () => {
      const block = {
        ...baseContentBlock,
        content: '',
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });

    it('should handle null/undefined values in optional fields', () => {
      const block = {
        ...baseContentBlock,
        image_title: undefined,
        image_author: undefined,
        image_license: undefined,
        image_source_url: undefined,
      } as any;
      render(<ContentBlock block={block} />);

      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = '<p>' + 'Very long content. '.repeat(100) + '</p>';
      const block = {
        ...baseContentBlock,
        content: longContent,
      };
      render(<ContentBlock block={block} />);

      expect(screen.getByText(/Very long content/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const block = {
        ...baseContentBlock,
        title: 'Accessible Block Title',
      };
      render(<ContentBlock block={block} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Accessible Block Title');
    });

    it('should have proper alt text for images', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'image',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: 'Descriptive alt text for accessibility',
      };
      render(<ContentBlock block={block} />);

      const image = screen.getByAltText('Descriptive alt text for accessibility');
      expect(image).toBeInTheDocument();
    });

    it('should use semantic HTML elements', () => {
      const block = {
        ...baseContentBlock,
        block_type: 'quote',
        content: 'Accessible quote',
      };
      render(<ContentBlock block={block} />);

      const blockquote = screen.getByText('"Accessible quote"');
      expect(blockquote.tagName).toBe('BLOCKQUOTE');
    });
  });
});
