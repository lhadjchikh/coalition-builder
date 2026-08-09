# Repo-scoped agent configuration

Everything here is versioned with the code it reviews, so a domain expert and the models,
sanitizer, and form fields it cites move together.

## `agents/`

Subagent definitions scoped to this repository. Claude Code discovers them automatically for the
`Agent`/`Task` tool, and the `/domain-review` skill lists this directory to learn which experts the
repo offers on top of the user-level ones.

| Expert                          | Reviews                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `advocacy-campaign-copy-expert` | What an endorser is agreeing to, legislative accuracy, position integrity, tax-status-neutrality  |
| `content-publishing-expert`     | Sanitizer round-trips, metadata and social-card budgets, slug stability, heading semantics        |

These cite concrete paths in this codebase (`backend/coalition/stakeholders/models.py`,
`backend/coalition/content/html_sanitizer.py`, `frontend/app/campaigns/[name]/page.tsx`). When
those move, update the expert in the same PR — a reviewer citing a path that no longer exists is
worse than no reviewer.

### Adding an expert

Add `agents/<name>-expert.md` with frontmatter (`name`, `description`, `tools`, `model`, `effort`)
and a body that says what it looks for, how to report findings, and what it does *not* review so it
doesn't overlap the others. Then route it in `review-routing.json`. An expert with no routing rule
only runs when someone names it explicitly.

Keep an expert here when it cites this repo's paths or domain. Cross-repo reviewers
(`code-review-expert`, `intent-faithfulness-expert`, `agent-skill-design-expert`, …) belong in
`~/.claude/agents/`.

## `review-routing.json`

Maps changed-file globs to the experts that should review them. Rules are additive to the
`/domain-review` orchestrator's built-in routing, not a replacement for it; the baseline reviewers
still run on every diff. Optional keys: `always` (extra experts on every diff) and `max_experts`
(default 5).

Every name under `experts` must match an `agents/` file here or a user-level agent, or the
orchestrator will report it as unroutable.
