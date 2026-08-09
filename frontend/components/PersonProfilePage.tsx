import React from "react";

import type { HomePage, PersonDetail } from "../types";
import PageLayout from "./PageLayout";
import PersonPortrait from "./PersonPortrait";

interface PersonProfilePageProps {
  orgInfo: HomePage;
  person: PersonDetail | null;
  error?: string | null;
}

const PersonProfilePage: React.FC<PersonProfilePageProps> = ({
  orgInfo,
  person,
  error,
}) => (
  <PageLayout
    orgInfo={orgInfo}
    title={person?.name || "Profile"}
    subtitle={person?.title}
    error={error}
  >
    {person && (
      <div className="bg-theme-bg-section py-12 sm:py-16">
        <article className="mx-auto grid max-w-5xl gap-10 container-padding md:grid-cols-[minmax(240px,1fr)_2fr]">
          <PersonPortrait person={person} />
          <div>
            <div
              className="content-prose text-theme-text-body"
              data-person-bio
              dangerouslySetInnerHTML={{ __html: person.bio }}
            />
            {person.linkedin_url && (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-8 inline-block text-theme-text-link hover:text-theme-text-link-hover"
                aria-label={`View ${person.name} on LinkedIn`}
              >
                LinkedIn
              </a>
            )}
          </div>
        </article>
      </div>
    )}
  </PageLayout>
);

export default PersonProfilePage;
