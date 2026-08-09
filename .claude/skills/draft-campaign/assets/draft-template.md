# Campaign draft: <TITLE>

Status: DRAFT — not entered in Django admin. Review before publishing.

**Do not enter this draft in admin while any claim below is unverified.**

## Campaign metadata

- **Position** — support | oppose | support with amendments (name the amendment
  sought)
- **Audience** — stakeholder types this copy addresses, and which of the
  remaining types are explicitly out of scope
- **Geographic scope** —

## Lookups performed

Every URL actually fetched while drafting. An empty table means nothing was
researched, which is a blocker, not an omission.

| Source | URL fetched | Date accessed | What it settled |
| --- | --- | --- | --- |
| | | | |

## Sources

One row per factual claim in the copy that needs backing — provisions, status,
sponsorship, numbers.

| Claim (quote the sentence) | Source | Where in the source |
| --- | --- | --- |
| | | |

## Unverified claims

Required. If nothing is unverified, keep the affirmation line and delete the
rest — silence here is an assertion, so make it explicitly.

- None — every factual claim in this draft traces to a source listed above.

<!-- Otherwise, one row per claim. Quote the exact sentence; do not put
     [VERIFY:] markers inside the field blocks below, where they can be pasted
     into a live page. -->

| Claim (quote the sentence) | What would settle it |
| --- | --- |
| | |

## Open questions

<!-- Decisions the drafter could not make. Delete the section if empty. -->

- <question>

---

## Fields

### `name` (slug)

```text
<slug>
```

<!-- Frozen once published — no redirect layer exists. Confirm it is unused. -->

### `title`

```text
<title>
```

<!-- char count, target 40–60 -->

### `summary`

```text
<one sentence>
```

<!-- char count, target 90–155; this is also the meta description -->

### `description` (HTML)

Paste into the TinyMCE source view in admin. Do not add an
`<h2>About This Campaign</h2>` — the page renders that heading itself,
immediately above this content.

```html
<p>...</p>

<h2>What the Bill Does</h2>
<p><strong>Background:</strong> ...</p>
<p><strong>Problem:</strong> ...</p>

<h3>What the <BILL NAME> would do:</h3>
<ol>
  <li><strong>...</strong> ...</li>
</ol>

<h2>Why This Matters</h2>
<ul>
  <li><strong>...:</strong> ...</li>
</ul>

<h2>What You Can Do</h2>
<p>...</p>
```

<!-- word count, target ~350–530 -->

### `endorsement_statement`

```text
<what endorsers sign>
```

<!-- word count, target 50–120; one paragraph, no line breaks -->

### `endorsement_form_instructions` (HTML)

```html
<p>...</p>
```

---

## Bills to attach

### Entered on the Bills inline of the campaign form

| Field | Bill 1 | Bill 2 |
| --- | --- | --- |
| `level` | | |
| `chamber` | | |
| `number` | | |
| `title` | | |
| `session` (ordinal, e.g. `119th`) | | |
| `introduced_date` | | |
| `status` | | |
| `is_primary` | | |
| `state` (state bills only) | | |

### Set afterward from `/admin/campaigns/bill/`

These are not on the campaign inline.

| Field | Bill 1 | Bill 2 |
| --- | --- | --- |
| `url` | | |
| `related_bill` (companion) | | |
| `sponsors` | | |
| `cosponsors` | | |

## Settings for the human to decide

- `image` — hero image, not selected by this draft. **Required before
  `active=true`**, or social cards ship blank and cache that way.
- `active` — publish now or hold
- `allow_endorsements`
