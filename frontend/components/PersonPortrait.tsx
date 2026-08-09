import React from "react";

import type { Person } from "../types";
import ImageWithCredit from "./ImageWithCredit";

interface PersonPortraitProps {
  person: Person;
}

const PersonPortrait: React.FC<PersonPortraitProps> = ({ person }) => {
  if (!person.headshot_url) {
    return (
      <div
        aria-hidden="true"
        className="aspect-square w-full rounded-xl bg-theme-bg-section"
        data-testid="headshot-placeholder"
      >
        <div className="flex h-full items-center justify-center text-5xl text-theme-text-muted">
          {person.name.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <ImageWithCredit
      src={person.headshot_url}
      alt={person.headshot_alt_text.trim() || person.name}
      title={person.headshot_title}
      author={person.headshot_author}
      license={person.headshot_license}
      sourceUrl={person.headshot_source_url}
      caption={person.headshot_caption}
      captionDisplay={person.headshot_caption_display || undefined}
      className="w-full"
      imgClassName="aspect-square w-full rounded-xl object-cover"
      width={800}
      height={800}
    />
  );
};

export default PersonPortrait;
