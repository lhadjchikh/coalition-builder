import React from "react";
import { ContentBlock } from "../types/api";

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
        <p>
          {emptyMessage ||
            "No content blocks are currently available for this page."}
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-sm mt-2">
            Add content blocks with page_type=&ldquo;{pageType}&rdquo; in the Django admin.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {contentBlocks.map((block) => (
        <ContentBlockComponent key={block.id} block={block} />
      ))}
    </>
  );
};

export default ContentBlocksList;
