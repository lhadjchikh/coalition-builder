# Field spec

Per-field contract for `PolicyCampaign`
(`backend/coalition/campaigns/models/policy_campaign.py`). "Renders as" points
at the code that displays the field, so a change there is the thing to re-check
if this file drifts.

## `title` — CharField(200)

The public-facing headline. Renders as the page `<h1>`, the campaign card
heading, the `<title>` tag, and the Open Graph / Twitter card title
(`frontend/app/campaigns/[name]/page.tsx`).

- Name the outcome, not the bill. "Expanding Access to Conservation Expertise"
  works; "The Increased TSP Access Act of 2025" does not — the bill name is a
  label, the outcome is a reason to care.
- 40–70 characters. The 200-char limit is a ceiling, not a target; card layouts
  and social previews truncate well before it.
- No acronyms. The title is often the only thing a reader sees.

## `summary` — TextField

One sentence stating what the campaign asks for. Renders under the title on the
detail page and on cards, and is the `description` meta tag plus the Open Graph
and Twitter card description.

- One sentence, 120–200 characters. Search engines truncate around 155–160, so
  front-load the substance.
- Must stand alone. It appears with no surrounding context in search results.
- Plain text — HTML is stripped by `HTMLSanitizer.sanitize_plain_text` on save.
- Imperative or declarative both work: "Expand access to trusted technical
  experts who help protect our soil, water, and working lands."

## `description` — HTMLField

The body of the page. Rendered as sanitized HTML. This is where the argument
lives.

Four sections, in this order:

### About This Campaign (~120 words)

One paragraph. The problem in the reader's terms, then the ask. Introduce the
bill by full name and number here — `<strong>Increased TSP Access Act of
2025</strong> (H.R.575 and S.156)` — and say it's bipartisan if it is. This
paragraph has to work as the whole pitch for someone who reads no further.

### What the Bill Does and Why It Matters (~250–350 words)

Background, then problem, then provisions.

- **Background** — one short paragraph establishing the status quo and defining
  the acronyms the rest of the section leans on.
- **Problem** — one short paragraph on what's broken and what the bill does
  about it, at a summary level.
- **Numbered provisions** — an `<ol>`, typically 3–5 items. Each item: a bolded
  plain-language headline, then one or two sentences of explanation. Map each to
  an actual operative section of the bill. Do not cite section numbers in the
  copy.

### Why this matters (3–4 bullets)

An `<ul>` of consequences, not features. Each bullet is a bolded phrase followed
by a colon and one sentence. Frame in the reader's stakes: "**Less waiting, more
action:** Streamlined paths reduce delays, speeding implementation of practices
like riparian buffers and nutrient management plans."

### What You Can Do (~60 words)

Names who the ask is for — organizations, operations, individuals — and points
at the endorsement form below. Keep it short; the form is right there.

### HTML constraints

Only tags in `HTMLSanitizer.ALLOWED_TAGS`
(`backend/coalition/content/html_sanitizer.py`) survive `save()`. Headings
`h1`–`h6`, `p`, `strong`, `em`, `ul`/`ol`/`li`, `a`, `blockquote`, and tables are
allowed; anything outside the list is stripped without warning, so verify
against that file rather than assuming. Start body headings at `h2` — the page
already renders the title as `h1`. The field is edited through TinyMCE in admin,
so the HTML should be clean enough to survive a round-trip through the editor:
no inline styles, no wrapper `div`s, no non-breaking spaces.

## `endorsement_statement` — TextField

The exact text an endorser agrees to. Displayed above the form under "By
submitting this form, you agree to the following statement."

- 50–120 words, one paragraph, first person plural or first person singular
  consistently.
- States a position and a rationale. It should be signable by an organization
  whose board reviews it: no predictions, no attacks on named opponents, no
  commitments beyond endorsement.
- Do not name the bill number here. Bills get amended and renumbered; the
  statement should still be true if the vehicle changes.
- Plain text — sanitized as plain text on save.

## `endorsement_form_instructions` — HTMLField

A short paragraph above the form fields
(`frontend/components/EndorsementForm.tsx`). One or two sentences on why
endorsing helps. Optional; leave empty rather than padding.

## `name` — SlugField (unique)

URL slug: `/campaigns/<name>/`. Admin prepopulates it from the title, but the
auto-slug of a long title is usually worse than a hand-picked one. Prefer the
short policy handle (`increased-tsp-access`) over the slugified headline.

## Fields this skill does not fill

`image` (hero image — a human picks it), `active`, `allow_endorsements`,
`created_at`. Note them in the draft's metadata block as decisions for the
person entering the campaign.

## Bill records

Legislative metadata lives in `Bill` rows attached to the campaign, entered
inline in the campaign admin. Collect for each bill: `level`, `chamber`,
`number` (digits only — the prefix is derived), `title` (official title),
`session`, `introduced_date`, `status`, `url`, `is_primary`, and the companion
bill in the other chamber. State bills also need `state`. See
`backend/coalition/campaigns/models/bill.py`.
