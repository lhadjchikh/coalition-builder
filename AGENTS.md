# AGENTS.md

Guidance for AI coding agents working in this repository. Human-facing docs live in
`README.md`, `docs/`, and <https://lhadjchikh.github.io/coalition-builder/>.

## What this is

Coalition Builder is a policy-advocacy platform: organizations run campaigns, recruit
stakeholders, and collect verified endorsements tied to legislators and geographic regions.

Three deployable pieces, one repo:

| Piece        | Stack                                               | Runs on                        |
| ------------ | --------------------------------------------------- | ------------------------------ |
| `backend/`   | Django 5.2 + Django Ninja + GeoDjango/PostGIS, 3.13 | AWS Lambda (Zappa, Docker img) |
| `frontend/`  | Next.js 16 App Router + React 19 + TypeScript       | Vercel                         |
| `terraform/` | Terraform + Terratest (Go)                          | AWS (shared / prod / dev)      |

The frontend proxies `/api/*` to the backend (see `frontend/proxy.ts`,
`frontend/next.config.js`). Status: pre-alpha, no releases, architecture still moving.

## Repo map

```text
backend/coalition/       Django project package
  api/                   Django Ninja routers + schemas.py (one module per resource)
  campaigns/             PolicyCampaign, Bill
  content/               Homepage, ContentBlock, Image, Video, Theme + HTML sanitizer
  core/                  settings.py, urls.py, middleware/, secrets.py, storage.py, email
  endorsements/          Endorsement model, email verification, spam prevention
  legal/  legislators/  regions/  stakeholders/
  test_base.py           BaseTestCase / BaseTransactionTestCase (loads regions fixture)
backend/scripts/         create_test_data.py, configure_zappa.py, build/deploy shell scripts
frontend/
  app/                   Next.js App Router pages (+ colocated __tests__/)
  components/            React components (+ components/__tests__/)
  lib/ services/ utils/ hooks/ contexts/ types/
  __tests__/             Config/infra tests + integration/ live-stack suite
  tests/                 integration/ (excluded by Jest) + mocked e2e/ suite
terraform/
  environments/{shared,prod,dev}/   root modules
  modules/                          ~16 modules (zappa, database, networking, ses, ...)
  tests/                            Terratest Go suites + Makefile
scripts/lint.py          Repo-wide auto-fixing lint driver
docs/                    MkDocs source published to GitHub Pages
.github/workflows/       CI; check_app.yml is the PR entry point
```

## Commands

Backend (needs PostGIS + GDAL — use Docker unless you have GeoDjango deps locally):

```bash
docker compose up -d db                         # PostGIS 16 on :5432
export DATABASE_URL=postgis://coalition_admin:admin_password@localhost:5432/coalition
cd backend && poetry install
poetry run pytest                               # full suite (coverage gate: 80%)
poetry run pytest path/to/test_x.py --no-cov    # scoped run; --no-cov avoids the gate
poetry run ruff format . && poetry run ruff check --fix .
poetry run mypy coalition/ --config-file pyproject.toml
```

Frontend (Node >= 22 required by `package.json` engines; CI uses 22.x):

```bash
cd frontend && npm ci
npm test                       # jest (jsdom)
npm run test:integration       # live API, frontend, and nginx stack required
npm run test:e2e               # mocked API suite; no backend required
npm run typecheck              # tsc -p tsconfig.build.json (excludes test files)
npm run lint                   # eslint app components lib proxy.ts
npm run format:check           # prettier
```

Terraform (the plan-only Terratests require valid AWS credentials):

```bash
review_repo_root=$(git rev-parse --show-toplevel)
terraform -chdir="$review_repo_root/terraform" fmt -recursive
tflint --init --config="$review_repo_root/.tflint.hcl"
tflint --chdir="$review_repo_root/terraform" --recursive \
  --config="$review_repo_root/.tflint.hcl"
cd "$review_repo_root/terraform/tests"
go test -short -v -timeout 10m ./modules/       # plan-only; creates no AWS resources
```

Whole repo, auto-fixing (Python + Prettier + TS + Terraform):

```bash
python3 scripts/lint.py
```

Full stack locally:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d   # hot reload
docker compose exec api python scripts/create_test_data.py
# frontend :3000, API/admin :8000, nginx :80
```

## What CI actually enforces

`check_app.yml` diffs against the base branch and runs only the affected suites
(frontend / backend / terraform / fullstack); a docs-only diff skips everything.
Matching CI exactly matters more than matching `scripts/lint.py`:

- **Python format is `ruff format --check`, not Black.** `pyproject.toml` still configures
  Black and `scripts/lint.py` still runs it. CI (`lint_python.yml`, `check_backend.yml`)
  runs `ruff format --check . && ruff check . && mypy coalition/`. Use `ruff format`.
- Backend tests run in the `dev` Docker target via `pytest -n auto --dist loadscope`.
  Tests must be parallel-safe and not depend on cross-file ordering.
- Coverage gate is `--cov-fail-under=80` in `addopts`, so it applies to every local run too.
- Prettier is checked over the **whole repo**, not just `frontend/`: root
  `*.{md,yml,yaml,json,css}` and `.github/workflows/*.yml` included. Use the exact commands
  in `.github/workflows/lint_prettier.yml`; `./scripts/lint.py` formats a narrower file set.
- `npm run lint` only covers `app components lib proxy.ts`. `services/`, `utils/`,
  `hooks/`, `contexts/` are unlinted by that script — still keep them clean.
- `npm run typecheck` uses `tsconfig.build.json`, which **excludes** test files.
  `tsconfig.json` also excludes tests, and no dedicated test typecheck currently covers them.

## Conventions

**Commits** — Conventional Commits with a scope, e.g. `fix(frontend): stabilize Next build
type config`, `test(terraform): use synthetic deployment fixtures`. Never add co-authorship
trailers.

**Workflow** — TDD: write the failing test, confirm it fails, then implement minimally.
Branch off `main`; PRs target `main`.

**Python** — Ruff with a broad rule set (`ANN` annotations, `B`, `SIM`, `UP`, `T20` no
prints, `ERA` no commented-out code) at line length 88. Every function is explicitly typed;
`mypy` runs with the django-stubs plugin. Models live in a `models/` package (one class per
module) once an app has more than one — see `campaigns/models/`, `content/models/`.

**API** — One module per resource under `coalition/api/`, each exporting a `Router`
registered in `api.py`. Response schemas go in `api/schemas.py`. Handlers take
`request: HttpRequest`, declare `response=`, and carry a docstring — the public API docs are
generated from these. CSRF is on for the whole `NinjaAPI`.

**Backend tests** — Live in `<app>/tests/test_*.py`. Subclass `BaseTestCase` from
`coalition/test_base.py` to get the `regions.json` fixture and `self.maryland` / `virginia`
/ `california` plus a `create_stakeholder()` helper. Django `TestCase` style (unittest
asserts), not bare pytest functions.

**TypeScript/React** — Path aliases `@/`, `@components/`, `@services/`, etc. are mirrored in
`tsconfig.json`, `tsconfig.build.json`, and `jest.config.js` — update all three. Prettier: 80
cols, double quotes, semicolons, es5 trailing commas. Styling is a mix of Tailwind and
styled-components with a theme from
`contexts/ThemeContext.tsx`; follow whichever the neighboring file uses. Unit tests are
colocated in `__tests__/`. Live-stack tests belong in `__tests__/integration/`; mocked
end-to-end-style tests live in `tests/e2e/`.

**Terraform** — `terraform fmt -recursive` + recursive `tflint`. Pass the repository-root
`.tflint.hcl` explicitly as shown above. Module changes should come with a Terratest case
under `terraform/tests/modules/`.

## Gotchas

- **`docs/` is partly stale.** It references an `ssr/` directory, a `frontend/src/` tree, a
  `test:ci` npm script, and ECS deployment — none of which exist anymore (the app is on
  Lambda + Vercel, components live at `frontend/components/`). Trust the code over `docs/`,
  and fix docs you touch.
- Lambda specifics that bite: GDAL libs are at `/opt/lib64/`, `GDAL_LIBRARY_PATH` is set
  only inside the `if IS_LAMBDA:` branch of `settings.py` (so `collectstatic` at image build
  time can't rely on it), and the Lambda has **no internet egress**. Supported AWS services
  require configured VPC endpoints; other public services need an explicit egress design.
- `settings.py` branches heavily on `IS_LAMBDA` and `ENVIRONMENT`; changes to config need
  coverage in `coalition/core/tests/test_lambda_settings.py` and friends.
- Local `node` may be v20 while `package.json` requires >= 22 — check before debugging odd
  npm failures.
- Do not push to GitHub or create releases unless explicitly asked.
