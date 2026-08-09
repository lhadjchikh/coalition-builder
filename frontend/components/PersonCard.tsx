import React from "react";
import Link from "next/link";

import type { Person } from "../types";
import PersonPortrait from "./PersonPortrait";

interface PersonCardProps {
  person: Person;
}

const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  const name = person.profile_page_enabled ? (
    <Link
      href={`/team/${person.slug}`}
      className="focus-ring text-theme-text-link hover:text-theme-text-link-hover"
    >
      {person.name}
    </Link>
  ) : (
    person.name
  );

  return (
    <article className="card-modern bg-theme-bg-card" data-testid="person-card">
      <PersonPortrait person={person} />
      <div className="mt-5">
        <h3 className="font-theme-heading text-2xl font-semibold text-theme-text-heading">
          {name}
        </h3>
        <p className="mt-2 text-theme-text-body">{person.title}</p>
        {person.linkedin_url && (
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-4 inline-block text-theme-text-link hover:text-theme-text-link-hover"
            aria-label={`View ${person.name} on LinkedIn`}
          >
            LinkedIn
          </a>
        )}
      </div>
    </article>
  );
};

export default PersonCard;
