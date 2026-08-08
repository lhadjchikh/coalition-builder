"""The pages of the in-admin help guide, in reading order.

This module is the single source of truth for the guide's structure. Navigation,
the index, previous/next links, and the printable view all derive from
``HELP_PAGES``; each entry is backed by ``content/<slug>.md``. Adding a page means
adding one entry here and one Markdown file, and a test fails if the two disagree.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class HelpPage:
    """One page of the guide.

    ``blurb`` is the one-line summary shown on the guide's index, so it should
    say what the reader will be able to do after reading the page.
    """

    slug: str
    title: str
    blurb: str


HELP_PAGES: tuple[HelpPage, ...] = (
    HelpPage(
        slug="start-here",
        title="Start here",
        blurb="What this site does, and the five words you need to know.",
    ),
    HelpPage(
        slug="your-account",
        title="Your account and the data you handle",
        blurb="Passwords, permissions, and the rules about endorsers' personal data.",
    ),
    HelpPage(
        slug="admin-tour",
        title="A tour of the admin",
        blurb="Lists, filters, bulk actions, and the two places it is easy to slip.",
    ),
    HelpPage(
        slug="campaigns",
        title="Creating a campaign",
        blurb="Every field on the campaign form, and the checklist before you publish.",
    ),
    HelpPage(
        slug="bills",
        title="Adding bills to a campaign",
        blurb="Attaching legislation, and the state-versus-federal rule people miss.",
    ),
    HelpPage(
        slug="endorsement-pipeline",
        title="How an endorsement travels",
        blurb="The four statuses and the five gates. Read this one twice.",
    ),
    HelpPage(
        slug="reviewing-endorsements",
        title="Reviewing and approving endorsements",
        blurb="Your daily queue, step by step, and what each bulk action really does.",
    ),
    HelpPage(
        slug="judgment-calls",
        title="What to approve, what to reject",
        blurb="Where the line is, and when to stop and ask instead.",
    ),
    HelpPage(
        slug="troubleshooting",
        title="Troubleshooting",
        blurb="The things that go wrong, and what each one actually means.",
    ),
    HelpPage(
        slug="routine",
        title="Your routine, and the rules",
        blurb="Daily and weekly checklists, and the short list of things never to do.",
    ),
)

_PAGES_BY_SLUG: dict[str, HelpPage] = {page.slug: page for page in HELP_PAGES}


def get_page(slug: str) -> HelpPage | None:
    """Return the registered page for ``slug``, or ``None`` if there isn't one."""
    return _PAGES_BY_SLUG.get(slug)


def neighbors(page: HelpPage) -> tuple[HelpPage | None, HelpPage | None]:
    """Return the pages before and after ``page``, ``None`` at either end."""
    position = HELP_PAGES.index(page)
    previous_page = HELP_PAGES[position - 1] if position > 0 else None
    next_page = HELP_PAGES[position + 1] if position < len(HELP_PAGES) - 1 else None
    return previous_page, next_page
