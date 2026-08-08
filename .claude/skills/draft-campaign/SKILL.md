---
name: draft-campaign
description: >-
  Draft the public-facing text for a new advocacy campaign (PolicyCampaign)
  — title, summary, description body, endorsement statement, and form
  instructions — from a bill number, policy topic, or rough notes. Produces
  a review-ready Markdown draft plus the HTML for the fields that accept it.
  Use when asked to write, draft, or revise campaign copy or campaign page
  content.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebFetch
  - WebSearch
  - AskUserQuestion
argument-hint: "<bill number, topic, or path to notes>"
---

# Draft campaign text

Write the public-facing copy for a new `PolicyCampaign`. The output is a
**draft for a human to review and paste into Django admin** — this skill never
writes to the database, never runs migrations, and never invents a campaign the
user did not ask for.

The campaign page is the coalition's pitch to a prospective endorser. It has to
do three things in order: explain what the policy is, explain why it matters to
this audience, and ask for an endorsement they can sign without hesitation.

## 1. Gather inputs

Collect these before drafting. Ask the user only for what you cannot find
yourself; use `AskUserQuestion` for genuine forks, not for things a careful
reading of the source material answers.

- **Policy subject** — bill number(s) and session, or the policy ask if there is
  no bill yet.
- **Audience** — which stakeholder types this campaign is aimed at. The
  endorsement form's categories are `farmer`, `waterman`, `business`,
  `nonprofit`, `scientist`, `healthcare`, `government`, `individual`, `other`
  (`backend/coalition/stakeholders/models.py`). Name the two or three the copy
  should speak to directly.
- **Geographic scope** — the region the coalition organizes in, and whether the
  policy reaches beyond it.
- **Position** — support or oppose, and any nuance (support with amendments).
- **Source material** — the user's notes, a one-pager, the bill text.

## 2. Research the policy

Do not draft from memory. Every factual claim on the page has to survive a
legislative staffer reading it.

- Look up the bill on congress.gov (federal) or the state legislature's site:
  official title, sponsors, cosponsors, introduced date, current status,
  companion bill in the other chamber.
- Read enough of the bill text to describe its operative provisions accurately.
  The description section that enumerates "what the bill does" must map to real
  sections of the bill, not to a press release's framing.
- Note anything you could not verify. Mark it `[VERIFY: ...]` inline in the
  draft rather than smoothing it over. A confident sentence you could not source
  is worse than a flagged gap.

Bill metadata belongs in the `Bill` records attached to the campaign
(`backend/coalition/campaigns/models/bill.py`), not buried in prose — collect it
in the draft's metadata block so whoever enters the campaign can fill both.

## 3. Draft the fields

Read `references/field-spec.md` for the per-field contract: what each field
feeds, its length target, whether it accepts HTML, and the failure modes.
Read `references/worked-example.md` for a full annotated campaign that
demonstrates the structure, and `assets/draft-template.md` for the shape of the
file you produce.

The fields, in the order they hit the reader:

| Field | What it is |
| --- | --- |
| `title` | The promise, in plain language. ≤200 chars, and short is better. |
| `summary` | One sentence. Also the page's meta description and social card text. |
| `description` | The body: About → What it does → Why it matters → What you can do. HTML. |
| `endorsement_statement` | The exact sentence(s) an endorser signs. Plain text. |
| `endorsement_form_instructions` | Short nudge above the form. HTML. |
| `name` | URL slug, derived from the title. |

Voice rules that apply throughout:

- Lead with the person affected, not the mechanism. "Farmers wait months for a
  conservation plan" before "the certification pipeline is constrained."
- Define every acronym on first use, then use it freely.
- Numbered provisions get a bolded plain-language headline and one or two
  sentences of explanation. No legislative citation strings in the body.
- No superlatives, no "critical juncture," no manufactured urgency. The reader
  is being asked to attach their name and organization to this; overclaiming
  costs endorsements.
- Never assert an endorsement, a sponsor, or an organizational position that
  isn't in the source material.

## 4. Self-check before handing it over

Walk the draft against this list and fix what fails:

- [ ] Every factual claim traces to a source you cited, or carries `[VERIFY:]`.
- [ ] The summary reads as a complete sentence out of context — it appears alone
      in search results and social previews.
- [ ] The endorsement statement is something a cautious organization's board
      could sign: it states a position, not a prediction or an attack.
- [ ] The description uses only tags in the sanitizer allowlist
      (`backend/coalition/content/html_sanitizer.py`). Anything outside it is
      stripped silently on save.
- [ ] Acronyms defined; no unexplained jargon.
- [ ] Bill numbers, session, sponsors, and dates match what you looked up.
- [ ] The draft says which fields still need a human decision.

## 5. Deliver

Write the draft using `assets/draft-template.md`. Put it in
`.context/campaign-drafts/<slug>.md` if a `.context/` directory exists (Conductor
workspaces keep it out of git); otherwise ask the user where it should go rather
than dropping an untracked file in the repo root.

Tell the user what you drafted, what you flagged,
and what you could not verify. Leave entering it in Django admin
(`/admin/campaigns/policycampaign/add/`) to them — including the hero image,
which this skill does not select.
