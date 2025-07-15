import React from "react";

// Generic content block interface that works with both frontend and SSR
interface ContentBlock {
  id: string | number;
  title?: string;
  content: string;
  block_type: string;
  image_url?: string;
  image_alt_text?: string;
  css_classes?: string;
  background_color?: string;
}

interface ContentBlocksListProps {
  contentBlocks: ContentBlock[];
  pageType: string;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  emptyMessage?: string;
}

const ContentBlocksList: React.FC<ContentBlocksListProps> = ({
  contentBlocks,
  pageType,
  ContentBlockComponent,
  emptyMessage,
}) => {
  if (contentBlocks.length === 0) {
    return (
      <div className="text-center text-gray-600 py-12">
        <p>{emptyMessage || "No content blocks are currently available for this page."}</p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-sm mt-2">
            Add content blocks with page_type="{pageType}" in the Django admin.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {contentBlocks.map((block) => (
        <ContentBlockComponent key={block.id} block={block} />
      ))}
    </div>
  );
};

export default ContentBlocksList;