# Worked example: Increased Technical Service Provider Access

A campaign drafted to this spec, based on the live page at
<https://landandbay.org/campaigns/increased-tsp-access/>. Read it for the shape
and the register, not to copy phrasing.

**This is an exemplar, not a transcript.** The copy below has been adapted to
follow `field-spec.md` — the live page differs in places, most visibly by
opening with its own "About This Campaign" heading and by stating provisions
this example marks as unverified. Where the two diverge, this file is the
guidance and the live page is only the origin.

Every factual sentence below is either backed in the Sources block or listed
under Unverified claims. An exemplar with unsourced claims is not an exemplar —
a model reading this file will copy what it sees, not what `SKILL.md` says.

---

## Sources

| Claim | Source | Where |
| --- | --- | --- |
| Bill exists, number, chamber, title | `https://www.congress.gov/bill/119th-congress/house-bill/575` | Bill landing page |
| Companion bill in the Senate | `https://www.congress.gov/bill/119th-congress/senate-bill/156` | Bill landing page |
| TSPs are certified through USDA NRCS | `https://www.nrcs.usda.gov/` | Program overview |

## Unverified claims

| Claim | What would settle it |
| --- | --- |
| "requires that providers be paid rates comparable to USDA staff" | The bill's operative pay-rate section — read the enrolled text, not a summary |
| "the public would get access to information on how many providers are certified" | The bill's reporting/transparency section |

This is what the mechanism looks like in use: two claims that read plausibly,
were carried over from advocacy material, and could not be traced to bill text
in the time available. They stay out of the copy below until they are sourced.
Note the numbered provisions accordingly — the example ships three, not four,
because the fourth could not be backed.

---

## `name`

```text
increased-tsp-access
```

The policy handle, not the slugified title. Short, guessable, stable if the
headline gets rewritten — and it has to be, because the slug is frozen once the
campaign is published.

## `title`

```text
Expanding Access to Conservation Expertise
```

42 characters, inside the 40–60 target. Names the outcome. A reader who knows
nothing about technical service providers still knows what this campaign wants.

## `summary`

```text
Expand access to the trusted technical experts who help farmers and landowners protect soil, water, and working lands.
```

118 characters, inside the 90–155 target and comfortably under the ~155 where
search snippets truncate. Works alone in a search result. Names the beneficiary
without jargon.

## `description`

Paste-ready HTML. Note there is no `<h2>About This Campaign</h2>` — the page
supplies that heading itself, directly above this content.

```html
<p>To protect our lands and waters, farmers and landowners need timely access to
expert help in planning and implementing conservation practices. Yet across the
Chesapeake Bay region and beyond, a shortage of qualified technical advisors — known
as Technical Service Providers (TSPs) — is slowing progress on the ground. This
campaign supports the <a href="https://www.congress.gov/bill/119th-congress/house-bill/575"><strong>Increased
TSP Access Act of 2025</strong></a> (H.R.575, with companion bill S.156), which
would expand and accelerate access to these services.</p>
```

The acronym is expanded on first use — including in the page title above it. The
bill name links to congress.gov, which is the only route the published page
offers a reader who wants to check any of this. No "bipartisan": that depends on
a cosponsor roster that changes, and this paragraph will still be here next year.

```html
<h2>What the Bill Does</h2>

<p><strong>Background:</strong> Farmers, ranchers, and forest landowners often
rely on the USDA's Natural Resources Conservation Service (NRCS) for technical
help — drawing up plans, or building projects that reduce pollution, improve soil
health, or manage water. The people who provide that help are Technical Service
Providers (TSPs).</p>

<p><strong>Problem:</strong> There is a shortage of certified providers, and
producers wait for the support they need. The Increased TSP Access Act would
address this by expanding who can certify providers and streamlining the process
for experts who are already qualified.</p>

<h3>What the Increased TSP Access Act would do:</h3>
<ol>
  <li><strong>Allow trusted organizations to certify providers</strong> — USDA
  would set up rules so that non-government entities, such as agricultural supply
  companies, cooperatives, nonprofits, and professional groups, can certify
  TSPs.</li>
  <li><strong>Create a faster route for already-qualified advisors</strong> — an
  expert who already holds a recognized qualification, such as a certified crop
  advisor or licensed engineer, would have a streamlined certification path
  rather than duplicating training.</li>
  <li><strong>Improve transparency</strong> — the bill directs reporting on the
  certification program.</li>
</ol>
```

Background before problem, and the Background paragraph explains what a TSP does
in concrete verbs — "drawing up plans," "building projects" — before the abstract
noun appears. Both acronyms are expanded again here because this section is often
where a skimmer lands first.

Three provisions, not the four on the live page. The pay-comparability provision
is real on the live page but could not be traced to bill text, so it sits in
Unverified claims instead of the copy. The transparency item is stated at the
level that could be backed. **This is the trade the skill asks for: a shorter,
duller, defensible page over a fuller one you cannot stand behind.**

```html
<h2>Why This Matters</h2>
<ul>
  <li><strong>More advisors, better access:</strong> Widening who can certify
  providers enlarges the pool of people available to help farmers meet
  conservation commitments.</li>
  <li><strong>Less waiting:</strong> A streamlined path for already-qualified
  experts shortens the queue between a producer asking for help and getting
  it.</li>
  <li><strong>Local stewardship:</strong> Producers get trusted help to carry out
  pollution-reducing projects on their own land.</li>
</ul>
```

Consequences framed as what the bill's mechanism does, not as outcomes predicted
for it. "Enlarges the pool" follows from the text; "will restore the Bay" would
not.

```html
<h2>What You Can Do</h2>
<p>Help us build support for better conservation assistance in the Chesapeake Bay
region and beyond. Organizations, farm and watermen's operations, businesses,
research and health institutions, and individuals are all welcome to endorse.
Please take a moment to fill out the endorsement form below.</p>
```

The endorsement form accepts nine stakeholder types — `farmer`, `waterman`,
`business`, `nonprofit`, `scientist`, `healthcare`, `government`, `individual`,
`other`. This copy addresses most of them in a single breath rather than naming
three and leaving the rest reading someone else's mail. `government` is
deliberately not solicited: a public employee generally cannot commit their
agency to a position without a governing-body action, and the form's
authorization checkbox would have them assert otherwise.

No call to contact a legislator, no reference to an upcoming vote or election.

Body total: 355 words — About 76, What the Bill Does 173, Why This Matters 59,
What You Can Do 47. That is at the short end of the ranges in `field-spec.md`,
because a provision that could not be sourced was cut rather than padded around.
Coming in short for that reason is the correct outcome, not a shortfall to make
up elsewhere.

## `endorsement_statement`

```text
The undersigned supports the legislation described on this campaign page, which would expand access to qualified conservation professionals who help farmers, ranchers, and landowners carry out conservation practices. Technical Service Providers help protect soil, water, and working lands, and improving access to their expertise supports voluntary stewardship. If this legislation is substantially amended or replaced, the coalition will confirm this endorsement before continuing to list it.
```

66 words, one paragraph — the form collapses line breaks, so it has to be. Note
what it does and does not do:

- **"The undersigned"**, not "I" or "we". The form shows this same text to
  someone endorsing on behalf of an organization and to someone endorsing as an
  individual. It has to read correctly for both.
- **"the legislation described on this campaign page"** — a durable referent. It
  never names H.R.575, so it survives renumbering, but it is still attached to
  something specific, so an endorser knows what they signed and the coalition can
  attribute it.
- **The re-confirmation sentence** closes the gap the durability rule opens: the
  statement outliving the bill is only a virtue if it does not silently transfer
  to a different bill.
- No prediction, no named opponent, no candidate, no commitment beyond
  endorsement. Nothing about elections.
- No efficacy adjectives. The live page's version says providers "play a critical
  role" in delivering "proven, effective" practices and "practical,
  science-based solutions" — three unsourced claims inside the text an endorser
  signs. They are gone.

## `endorsement_form_instructions`

```html
<p>Endorsing adds your name — or your organization's — to a public statement of
support for this legislation. Endorsements are published on this page after we
verify your email and review the submission. To withdraw an endorsement later,
contact us at <a href="mailto:info@example.org">info@example.org</a>.</p>
```

HTML, not plain text, and wrapped in `<p>` — the component injects it as markup.

Says what signing *does*, not why it helps us. The live page's version ("Add your
voice… helps demonstrate broad support for this important legislation") is
warmer and tells the endorser less: it does not mention publication, review, or
that this is a position on named legislation, which is exactly what an
organization tracking its lobbying communications needs to see. The withdrawal
contact is here because the platform has no self-service route.

## Bill records

Entered on the Bills inline of the campaign form:

| Field | House | Senate |
| --- | --- | --- |
| `level` | federal | federal |
| `chamber` | house | senate |
| `number` | 575 | 156 |
| `session` | 119th | 119th |
| `is_primary` | true | false |

`session` is the ordinal form. `PolicyCampaign.current_bills()` filters on
exactly `"119th"`; a bill entered as `119` never matches it, even though that is
what the model default suggests.

Set afterward from `/admin/campaigns/bill/`, because they are not on the inline:

| Field | House | Senate |
| --- | --- | --- |
| `url` | congress.gov bill page | congress.gov bill page |
| `related_bill` | ← Senate bill | ← House bill |
| `sponsors` / `cosponsors` | from congress.gov | from congress.gov |

`title`, `introduced_date`, and `status` come from congress.gov and go on the
inline.
