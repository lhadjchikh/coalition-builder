import React from "react";

import type { Person } from "../types";
import ImageWithCredit from "./ImageWithCredit";

interface PersonPortraitProps {
  person: Person;
}

const PersonPortrait: React.FC<PersonPortraitProps> = ({ person }) => {
  if (!person.profile_image_url) {
    return (
      <div
        aria-hidden="true"
        className="aspect-square w-full rounded-xl bg-theme-bg-section"
        data-testid="profile-image-placeholder"
      >
        <div className="flex h-full items-center justify-center text-5xl text-theme-text-muted">
          {person.name.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <ImageWithCredit
      src={person.profile_image_url}
      alt={person.profile_image_alt_text.trim() || person.name}
      title={person.profile_image_title}
      author={person.profile_image_author}
      license={person.profile_image_license}
      sourceUrl={person.profile_image_source_url}
      caption={person.profile_image_caption}
      captionDisplay={person.profile_image_caption_display || undefined}
      className="w-full"
      imgClassName="aspect-square w-full rounded-xl object-cover"
      width={800}
      height={800}
    />
  );
};

export default PersonPortrait;
