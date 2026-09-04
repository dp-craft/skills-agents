<!-- LLM-PRIMARY: Dependency governance protocol — steps for adding new Python packages. -->

# Dependency Governance (Python)

Adding a new production or dev dependency MUST follow this protocol — no exceptions.

## Step 1: Exhaust Alternatives

Before considering a new package, MUST verify:
- Can this be done with Python stdlib (`pathlib`, `dataclasses`, `json`, `asyncio`, `typing`, etc.)?
- Can this be done with an existing dependency already in `pyproject.toml` / `requirements.txt`?
- Can this be done with a small utility function (< 50 lines)?

If YES to any → implement without adding a dependency. STOP here.

## Step 2: Technical Research

Use the `dependency-researcher` subagent. The agent verifies alternatives, identifies 2-3 candidates, compares:

| Criterion | What to check |
|---|---|
| Install size | `pip show --verbose` or PyPI metadata |
| Downloads | PyPI Stats / pepy.tech |
| Maintenance | Last release date, open issues, bus factor |
| License | Must be compatible (MIT, Apache 2.0, BSD preferred) |
| CVEs | `pip audit`, Snyk, GitHub Security Advisories |
| Transitive deps | `pip install --dry-run` count |
| Python version support | Minimum supported version |

## Step 3: Write ADR

Use `documentation-writer` to create `docs/adrs/ADR-{NNN}-dep-{package-name}.md` (Nygard format) covering: Context, Considered Options (with metrics), Decision, Consequences (transitive deps, size impact, risk).

## Step 4: User Approval

Present the ADR summary and ask for explicit approval. Format: "New dependency required: `{package}` ({size}, {license}, {python-versions}). ADR written at {path}. Approve?"

## Step 5: Install and Continue

Only after approval:

| Package Manager | Install Command |
|---|---|
| uv | `uv add {package}` (prod) / `uv add --dev {package}` (dev) |
| poetry | `poetry add {package}` (prod) / `poetry add --group dev {package}` (dev) |
| pip | `pip install {package}` + update `requirements.txt` / `pyproject.toml` |

Update `CLAUDE_PROJECT_SPECIFIC.md` Active Technologies if significant.
