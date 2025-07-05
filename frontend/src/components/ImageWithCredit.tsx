import React from 'react';

interface ImageWithCreditProps {
  src: string;
  alt: string;
  title?: string;
  author?: string;
  license?: string;
  sourceUrl?: string;
  creditDisplay?: 'caption' | 'overlay' | 'tooltip' | 'none';
  className?: string;
  imgClassName?: string;
}

const ImageWithCredit: React.FC<ImageWithCreditProps> = ({
  src,
  alt,
  title,
  author,
  license,
  sourceUrl,
  creditDisplay = 'caption',
  className = '',
  imgClassName = '',
}) => {
  // Build credit text
  const buildCreditText = (): string => {
    const parts: string[] = [];

    if (title) {
      parts.push(`"${title}"`);
    }

    if (author) {
      parts.push(`by ${author}`);
    }

    if (license) {
      parts.push(`is licensed under ${license}`);
    }

    return parts.join(' ');
  };

  const creditText = buildCreditText();
  const hasCredit = creditText.length > 0;

  // Render credit based on display mode
  const renderCredit = () => {
    if (!hasCredit || creditDisplay === 'none') return null;

    const creditElement = (
      <span className="text-xs text-gray-600">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 underline"
          >
            {creditText}
          </a>
        ) : (
          creditText
        )}
      </span>
    );

    switch (creditDisplay) {
      case 'caption':
        return <div className="mt-1 text-right">{creditElement}</div>;

      case 'overlay':
        return (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-200 underline"
              >
                {creditText}
              </a>
            ) : (
              creditText
            )}
          </div>
        );

      case 'tooltip':
        return (
          <div className="group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-200 underline"
                  >
                    {creditText}
                  </a>
                ) : (
                  creditText
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Container classes based on display mode
  const containerClasses = [
    creditDisplay === 'overlay' || creditDisplay === 'tooltip' ? 'relative inline-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <img src={src} alt={alt} className={imgClassName} />
      {renderCredit()}
    </div>
  );
};

export default ImageWithCredit;
