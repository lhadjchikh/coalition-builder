# Campaign draft: <TITLE>

Status: DRAFT — not entered in Django admin. Review before publishing.

## Open questions

<!-- Decisions the drafter could not make. Delete the section if empty. -->

- <question>

## Unverified claims

<!-- Every [VERIFY:] marker in the draft, listed here with what would settle it.
     Delete the section if empty. -->

- <claim> — needs <source>

## Sources

- <url or document> — <what it supports>

---

## Fields

### `name` (slug)

```text
<slug>
```

### `title`

```text
<title>
```

<!-- char count -->

### `summary`

```text
<one sentence>
```

<!-- char count; this is also the meta description -->

### `description` (HTML)

Paste into the TinyMCE source view in admin.

```html
<h2>About This Campaign</h2>
<p>...</p>

<h2>What the Bill Does and Why It Matters</h2>
<p><strong>Background:</strong> ...</p>
<p><strong>Problem:</strong> ...</p>

<h3>What the <BILL NAME> would do:</h3>
<ol>
  <li><strong>...</strong> ...</li>
</ol>

<h3>Why this matters:</h3>
<ul>
  <li><strong>...:</strong> ...</li>
</ul>

<h3>What You Can Do</h3>
<p>...</p>
```

<!-- word count -->

### `endorsement_statement`

```text
<what endorsers sign>
```

<!-- word count -->

### `endorsement_form_instructions` (HTML)

```html
<p>...</p>
```

---

## Bills to attach

Entered inline in the campaign admin.

| Field | Bill 1 | Bill 2 |
| --- | --- | --- |
| `level` | | |
| `chamber` | | |
| `number` | | |
| `title` | | |
| `session` | | |
| `introduced_date` | | |
| `status` | | |
| `url` | | |
| `is_primary` | | |
| `state` (state bills only) | | |

Sponsors / cosponsors to link: <names>

## Settings for the human to decide

- `image` — hero image, not selected by this draft
- `active` — publish now or hold
- `allow_endorsements`
