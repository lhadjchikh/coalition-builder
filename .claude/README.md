# Repo-scoped agent configuration

Everything here is versioned with the code it reviews, so a domain expert and the models,
sanitizer, and form fields it cites move together.

## `agents/`

Subagent definitions scoped to this repository. Claude Code discovers them automatically for the
`Agent`/`Task` tool, and the `/domain-review` skill lists this directory to learn which experts the
repo offers on top of the user-level ones.

| Expert                          | Reviews                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `advocacy-campaign-copy-expert` | What the endorser is asked to click, what the platform mails them, and what it can prove       |
| `content-publishing-expert`     | Changes that damage already-published DB content, metadata budgets, slug and route stability   |

Both experts share a constraint worth stating plainly: **the content they care about is not in the
diff.** Campaign summaries, endorsement statements, bill records, and page bodies are authored in
the Django admin and live in Postgres. So each reviews the *contract* around that content, plus the
copy that is committed.

For `content-publishing-expert` the contract is the sanitizer allowlist, field lengths, slug and
route rules, and metadata plumbing; its best finding is a narrowed contract that existing rows
already violate. For `advocacy-campaign-copy-expert` it is the consent artifact in
`EndorsementForm.tsx`, the endorser emails in `backend/templates/emails/`, the stakeholder and bill
vocabulary, and the staff guidance in `admin_help/content/`; its best finding is a caveat with no
field to live in, or a claim with nowhere to record its source.

These cite concrete paths in this codebase (`backend/coalition/stakeholders/models.py`,
`backend/coalition/content/html_sanitizer.py`, `frontend/app/campaigns/[name]/page.tsx`). When
those move, update the expert in the same PR — a reviewer citing a path that no longer exists is
worse than no reviewer.

### Adding an expert

Add `agents/<name>-expert.md` with frontmatter (`name`, `description`, `tools`) and a body that says
what it looks for, how to report findings, and what it does *not* review so it doesn't overlap the
others. Then assign it a profile in `model-policy.json` and route it in `review-routing.json`. An
expert with no routing rule only runs when someone names it explicitly.

Keep an expert here when it cites this repo's paths or domain. Cross-repo reviewers
(`code-review-expert`, `intent-faithfulness-expert`, `agent-skill-design-expert`, …) belong in
`~/.claude/agents/`.

## `model-policy.json`

Assigns each expert above an execution profile, and is the source of truth for the `model:` and
`effort:` frontmatter in `agents/*.md` — set those by editing this file and regenerating, not by
hand. Same schema and profile vocabulary as the shared policy in the `ai-tools` repo
(`agents/lhadjchikh/model-policy.json`); the profiles used here are copied from it, so re-copy a
profile if its definition changes there.

Both experts run `deep-review` (frontier capability, high reasoning, tolerant latency → Claude
`opus`/`high`). Regenerate and verify with the `ai-tools` adapter:

```bash
AI_TOOLS=~/path/to/ai-tools/agents/lhadjchikh
python3 "$AI_TOOLS/scripts/sync_model_policy.py" sync \
  --policy .claude/model-policy.json --agents .claude/agents --codex .claude/codex
```

`sync` rewrites the frontmatter in place and emits Codex adapter layers under `.claude/codex/`,
which is gitignored — those are a per-machine install artifact, not repo content. Swap `sync` for
`check` to fail instead of rewrite; run it after a `sync` so the Codex layers exist.

The assignment is a bijection: every agent in `agents/` needs an entry here, and every entry needs
an agent file. The adapter errors on either gap rather than guessing a default.

## `review-routing.json`

Maps changed-file globs to the experts that should review them. Rules are additive to the
`/domain-review` orchestrator's built-in routing, not a replacement for it; the baseline reviewers
still run on every diff. Optional keys: `always` (extra experts on every diff) and `max_experts`
(default 5).

Every name under `experts` must match an `agents/` file here or a user-level agent, or the
orchestrator will report it as unroutable.
