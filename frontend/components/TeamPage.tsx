import React from "react";

import type {
  ContentBlock as ContentBlockType,
  HomePage,
  PersonGroup,
} from "../types";
import ContentBlocksList from "./ContentBlocksList";
import PageLayout from "./PageLayout";
import PersonCard from "./PersonCard";

interface TeamPageProps {
  orgInfo: HomePage;
  groups: PersonGroup[];
  contentBlocks: ContentBlockType[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlockType }>;
}

const TeamPage: React.FC<TeamPageProps> = ({
  orgInfo,
  groups,
  contentBlocks,
  error,
  ContentBlockComponent,
}) => (
  <PageLayout orgInfo={orgInfo} title="Our Team" error={error}>
    {contentBlocks.length > 0 && (
      <ContentBlocksList
        contentBlocks={contentBlocks}
        pageType="team"
        ContentBlockComponent={ContentBlockComponent}
      />
    )}
    <div className="bg-theme-bg-section py-12 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-16 container-padding">
        {groups.map((group) => (
          <section
            key={group.id}
            data-testid={`person-group-${group.slug}`}
            aria-labelledby={`person-group-heading-${group.id}`}
          >
            <h2
              id={`person-group-heading-${group.id}`}
              className="font-theme-heading text-3xl font-bold text-theme-text-heading"
            >
              {group.name}
            </h2>
            {group.description && (
              <p className="mt-3 max-w-reading text-lg text-theme-text-muted">
                {group.description}
              </p>
            )}
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {group.people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </PageLayout>
);

export default TeamPage;
