# Field spec

Per-field contract for `PolicyCampaign`
(`backend/coalition/campaigns/models/policy_campaign.py`). "Renders as" names
every file that displays the field, so a change in one of them is the thing to
re-check if this file drifts. If you add guidance here, add its render site too.

## `title` — CharField

The public-facing headline.

Renders as: the page `<h1>` (`frontend/components/CampaignDetail.tsx`, hero and
no-image variants); the campaign card heading, an `<h3>`
(`frontend/components/CampaignsList.tsx`); the `<title>` tag and the Open Graph
and Twitter card titles (`frontend/app/campaigns/[name]/page.tsx`).

- Name the outcome, not the bill. "Expanding Access to Conservation Expertise"
  works; "The Increased TSP Access Act of 2025" does not — the bill name is a
  label, the outcome is a reason to care.
- 40–60 characters. `frontend/app/layout.tsx` sets no `title.template`, so this
  string is the entire search-result headline with no site-name suffix, and
  Google truncates near 60. The model's `max_length` is a ceiling, not a target.
- No acronyms. The title is often the only thing a reader sees.

## `summary` — TextField

One sentence stating what the campaign asks for.

Renders as: the `description` meta tag and the Open Graph and Twitter card
descriptions (`frontend/app/campaigns/[name]/page.tsx`); body copy under the
title on the detail page (`frontend/components/CampaignDetail.tsx`); body copy
on each card (`frontend/components/CampaignsList.tsx`).

- One sentence, 90–155 characters. Search snippets truncate around 155, and the
  card grid applies no `line-clamp` — a long summary stretches the card rather
  than truncating.
- Must stand alone. It appears with no surrounding context in search results.
- Plain text — HTML is stripped by `HTMLSanitizer.sanitize_plain_text` on save.
- Imperative or declarative both work: "Expand access to trusted technical
  experts who help protect our soil, water, and working lands."

## `description` — HTMLField

The body of the page, and where the argument lives.

Renders as: sanitized HTML injected into the About section
(`frontend/components/CampaignDetail.tsx`).

**The page already supplies the section's `<h2>About This Campaign</h2>` heading
immediately above this field, and labels the surrounding `<section>` with it. Do
not repeat that heading in your HTML** — a duplicate reads twice for screen
reader users and shows twice on the page. Start with the About paragraph itself.

Four peer sections, in this order. Each after the first gets its own `<h2>`;
the page supplies the heading for the first. A full body runs ~350–530 words.

The word ranges below are ceilings with enough of a floor to say something, not
quotas. Coming in under one because a claim could not be sourced is the right
outcome — cut the claim, do not pad around it or make the length up elsewhere.

### About This Campaign (~75–120 words)

One paragraph, no heading of its own. The problem in the reader's terms, then
the ask. Introduce the bill by full name and number here —
`<strong>Increased TSP Access Act of 2025</strong> (H.R.575 and S.156)`. Link
the bill name to its official page on the first mention; this is the only place
the reader can follow the claim to a source (see **Links**, below).

This paragraph has to work as the whole pitch for someone who reads no further,
and it is the most screenshot-able unit on the page. Every claim in it must be
one the coalition would defend with the rest of the page stripped away.

### What the Bill Does (~170–350 words)

Background, then problem, then provisions.

- **Background** — one short paragraph establishing the status quo and defining
  the acronyms the rest of the section leans on.
- **Problem** — one short paragraph on what's broken and what the bill does
  about it, at a summary level.
- **Numbered provisions** — an `<ol>`, typically 3–5 items, under an `<h3>`.
  Each item: a bolded plain-language headline, then one or two sentences of
  explanation. Map each to an actual operative section of the bill and record
  which section in the draft's Sources block. Do not cite section numbers in the
  copy.

### Why This Matters (3–4 bullets)

A `<ul>` of consequences, not features. Each bullet is a bolded phrase followed
by a colon and one sentence. Frame in the reader's stakes: "**Less waiting, more
action:** Streamlined paths reduce delays, speeding implementation of practices
like riparian buffers and nutrient management plans."

State consequences the bill's text supports, not outcomes you are predicting. If
a bullet only works as a forecast, cut it.

### What You Can Do (~45–70 words)

Names who the ask is for and points at the endorsement form below. Keep it
short; the form is right there.

The ask is always for a position on the policy. Never frame it around an
election, a candidate, a vote's electoral consequences, or a named legislator as
an obstacle — see the voice rules in `SKILL.md`.

### Nothing time-bound

The page has no expiry and nobody will revisit it. No "currently before the
committee," no "expected to pass this session," no vote counts, no
characterizations that depend on a changing cosponsor roster. "Bipartisan" is
one of these: write "introduced with cosponsors from both parties" if that is
true at drafting time, or omit it. Live status belongs in the `Bill` record,
which is editable; this prose is not.

### Links

The skill routes source URLs into the draft file, and the `Bill` records are not
exposed through the API — so unless you put a link in this field, the published
page carries nothing a reader can follow to verify any of it.

- Link the bill name on first mention in the About paragraph, at minimum.
- Descriptive link text naming the destination. Never "click here" or "read
  more."
- If you use `target="_blank"`, pair it with `rel="noopener noreferrer"`.

### HTML constraints

Two separate rules, often confused.

**Editorial (use exactly this set):** `h2`, `h3`, `p`, `strong`, `em`, `ul`,
`ol`, `li`, `a`, `blockquote`. Nothing else, even where the sanitizer permits it
— `div`, `span`, `class`, and `style` all survive `save()` but have no place in
body copy, and the field round-trips through TinyMCE in admin, which mangles
hand-written wrappers. No inline styles, no non-breaking spaces.

**Sanitizer backstop:** `HTMLSanitizer` (`backend/coalition/content/html_sanitizer.py`)
strips anything outside its allowlist on `save()`, silently. The allowlist is
wider than the editorial set above, so staying inside the editorial set keeps
you safe without consulting it. The one exclusion worth knowing: **`<img>` is
not allowed** — nor are `figure`, `figcaption`, `iframe`, or `video`. TinyMCE
offers an image button; anything inserted with it vanishes on save. The hero
image (`image`) is the only supported image on the page.

Treat the sanitizer as a security backstop, never as a style guide. A tag being
permitted is not a reason to use it.

## `endorsement_statement` — TextField

The exact text an endorser agrees to.

Renders as: a `<blockquote>` under the heading "By submitting this form, you
agree to the following statement:" (`frontend/components/EndorsementForm.tsx`).
The component wraps it in literal typographic quotes, so do not add your own,
and interpolates it as plain JSX text, so line breaks collapse — one paragraph
is a hard constraint, not a preference.

- 50–120 words, one paragraph.
- States a position and a rationale. It should be signable by an organization
  whose board reviews it: no predictions, no attacks on named opponents, no
  commitments beyond endorsement, and nothing that reads as support for or
  opposition to a candidate.
- **Name a durable referent.** Do not use the bill number — bills get amended,
  renumbered, and folded into larger vehicles. But do not leave the statement
  floating either: an endorsement of a general principle cannot be attributed to
  this campaign. Point at the campaign itself: "the legislation described on
  this campaign page," or the campaign title. State what happens if the vehicle
  changes substantially.
- **Write for both signer types.** The form asks an endorser with an
  organization to choose "I am endorsing on behalf of this organization and am
  authorized to do so" or "I am endorsing as an individual," and shows this same
  statement to both. Prefer a subject-neutral construction ("The undersigned
  supports…") that reads correctly either way, over "I" or "we." Do not restate
  authorization — the `org_authorized` field already records it.
- Match the campaign's position. Support, opposition, and support-with-
  amendments are three different things to sign; support-with-amendments must
  name the change sought rather than implying unqualified support.
- No efficacy claims you have not sourced ("proven," "effective,"
  "science-based") and no superlatives. A statement is signable in proportion to
  how little it asserts on the endorser's behalf.
- Plain text — sanitized as plain text on save.

## `endorsement_form_instructions` — HTMLField

The last thing someone reads before signing
(`frontend/components/EndorsementForm.tsx`, injected as HTML — wrap it in `<p>`,
it is not plain text despite being short).

Say what signing does, not why it helps the coalition. It is a public statement
of the endorser's position on named legislation, published under their name
after email verification and review. Endorsers on this platform include
501(c)(3) and 501(c)(4) organizations, trade associations, businesses,
government bodies, and individuals; several of them track this kind of
communication, and "just add your name" framing hides that from them.

There is no self-service withdrawal in the platform — an approved, publicly
displayed endorsement stays up. Give a contact route for withdrawal here.

This is also the right home for any campaign-specific caveat about who should or
should not endorse. Never put one in `endorsement_statement`, which is shared
signed text.

## `name` — SlugField (unique)

URL slug: `/campaigns/<name>/`.

- Prefer the short policy handle (`increased-tsp-access`) over the slugified
  headline. Admin prepopulates from the title on add only, and the auto-slug of
  a long title is usually worse than a hand-picked one.
- **Once the campaign is published, the slug is frozen.** There is no redirect
  layer in this repo — `frontend/next.config.js` defines `rewrites()` only, no
  `redirects()`, and there is no `middleware.ts`, so a rename 404s every inbound
  link, every prior social share, and the canonical URL the page declares.
  Changing it later requires a `redirects()` entry landed in the same change.
- `unique=True`, and this skill has no database access — the person entering the
  campaign has to confirm the handle is free.

## Fields this skill does not fill

- `image` — the hero image. **Required before `active=true`.** The page declares
  `card: "summary_large_image"` at `1200x630` but emits an *empty* images array
  when there is no image, with no site-level fallback
  (`frontend/app/campaigns/[name]/page.tsx`). Launching without it ships blank
  social cards, and scrapers cache that. Supply a ~1.91:1 image at least 1200px
  wide, with alt text.
- `active` — publish now or hold.
- `allow_endorsements`.

Note these in the draft's metadata block as decisions for the person entering
the campaign. `created_at` is not one of them — it is `auto_now_add` and
read-only in admin.

## Bill records

Legislative metadata lives in `Bill` rows attached to the campaign
(`backend/coalition/campaigns/models/bill.py`). Two entry points, and the
split matters to whoever types it in:

**On the Bills inline of the campaign form** — `level`, `title`, `chamber`,
`number`, `session`, `state`, `introduced_date`, `status`, `is_primary`. See
`BillInline.fields` in `backend/coalition/campaigns/admin.py` for the current
list.

**Not on the inline** — `url`, `related_bill` (the companion bill in the other
chamber), `sponsors`, and `cosponsors`. Set these afterward from
`/admin/campaigns/bill/`.

Field notes:

- `level` and `chamber` take values from `LEVEL_CHOICES` and `CHAMBER_CHOICES`
  in `backend/coalition/campaigns/constants.py`. State campaigns have six
  chamber values to choose from — read the file rather than guessing one.
- `number` is the bill number without its prefix (`575`, not `H.R.575`); the
  prefix is derived from `chamber` via `BILL_PREFIXES`. State bill numbers are
  not always purely numeric, and the field is a `CharField`.
- `session` — federal bills use the **ordinal** form (`119th`, not `119`).
  `PolicyCampaign.current_bills()` filters on that exact string; the model's
  default and help text use the bare number, which does not match. Write the
  ordinal.
- `state` is required for state bills.
