---
name: create-article
description: "Build a publication-quality, self-contained HTML explainer from this session's work or from named local files. Every number traceable to a source. Saves to disk and publishes as an Artifact."
argument-hint: "[session | <file|dir|glob>...] [--hu|--en] [--audience <who>] [--out <path>]"
---

# Explainer Article Builder

Turns finished work into a document a **non-specialist decision-maker** can read end-to-end and act on: what was investigated, what came out, what it means, what needs a decision.

## User Input

```text
$ARGUMENTS
```

| Argument | Meaning | Default |
|---|---|---|
| `session` / empty | Source = this conversation's completed work | `session` |
| `<file\|dir\|glob>...` | Source = those local files (plans, reports, benchmarks, ADRs, logs) | — |
| `--hu` / `--en` | Output language | infer from source; ask only if genuinely mixed |
| `--audience <who>` | Who reads it (PO, exec, new engineer, customer) | `non-technical PO` |
| `--out <path>` | Save location | `docs/plans/<YYYY-MM-DD>-<slug>.html` |

<HARD-GATE>
- **Fact ledger before prose.** Every number, date, name, and verdict MUST trace to a tool output, file, or command run in-session. Unsourced → it does NOT go in the document. MUST NOT reconstruct a figure from memory.
- **MUST NOT soften a negative result**, hide a limitation, or report a non-significant difference as a win.
- **MUST NOT publish** a page impersonating a real person/organization, fabricated records, or content targeting a private individual.
- Output MUST be ONE self-contained `.html` file — no external assets (Google Fonts is the only permitted remote host).
- MUST load the `artifact-design` skill before writing any HTML.
</HARD-GATE>

## Phases

MUST create a task per phase and complete in order.

| # | Phase | Output | Gate to advance |
|---|---|---|---|
| 1 | **Source** | List of files/turns the article draws on | Source resolved and readable |
| 2 | **Fact ledger** | `<claim> → <source>` table (scratchpad) | Every headline number has a source |
| 3 | **Frame** | Audience, the single job of the page, the one-sentence thesis | Thesis states a *stake*, not a topic |
| 4 | **Design plan** | Palette (4–6 hex), 2–3 typefaces, layout concept | Plan is subject-specific, not generic |
| 5 | **Build** | The `.html` file | Structural spine + invariants satisfied |
| 6 | **Verify** | Checklist run | All checks pass |
| 7 | **Deliver** | Saved file + Artifact URL | Both reported to user |

### Phase 2 — Fact ledger (the anti-fabrication step)

Write `<scratchpad>/article-facts.md` before any prose:

```
| claim as it will appear | exact value | source (file:line / command / commit) |
```

Re-verify from the source, not from conversation memory — summarized context drifts. A claim that survives phase 2 may be stated flatly; one that does not MUST be cut or explicitly hedged in the prose.

### Phase 4 — Design plan

State it before coding. MUST be derived from the subject's own world (its materials, instruments, vernacular), not from a house template.

FORBIDDEN as a default look (AI-generated design clichés): warm cream + serif + terracotta; near-black + lone acid-green/vermilion pop; purple→blue gradient hero; Inter or Space Grotesk as the "safe" face; emoji section markers; everything centered; accent bar on rounded cards.

**MUST NOT copy a previous article's palette or typefaces.** A reused token set is how a series of documents becomes a template. Invariants below are structural, never chromatic.

## Structural spine

Section order is MANDATORY where marked. It front-loads the stake, then the vocabulary, then the mechanism, then the evidence — a reader who understands *why* cannot be confused by the numbers.

| # | Section | Required | Rule |
|---|---|---|---|
| 1 | **Masthead** | MUST | Eyebrow (project · kind · date) → title → 2–4 sentence dek that names the stake. FORBIDDEN: a dek that describes the method before the stake |
| 2 | **Key-number strip** | MUST | 3–5 figures carrying the whole story. Each gets a plain-language caption, NOT a metric name. One of them SHOULD be a "nothing broke" / scope figure |
| 3 | **Context** | MUST | What the system is and why the reader cares — in the reader's vocabulary, ~150 words |
| 4 | **Glossary** | MUST when ≥3 domain terms appear | A scannable grid placed BEFORE the evidence, never as an appendix. Each entry ≤2 sentences, defined by *what it tells you*, not by its formula |
| 5 | **Mechanism / root cause** | MUST when the work diagnosed something | Explain the cause BEFORE showing any measurement. One concrete illustration (a worked example, a before/after pair) — show, don't assert |
| 6 | **Evidence** | MUST | Per investigation strand: verdict chip → prose → table → `.tnote` verdict in words |
| 7 | **What shipped** | MUST when code/config changed | Two-state list: shipped vs. explicitly NOT shipped, each with one line of *why*. This is the reader's decision surface |
| 8 | **Self-audit** | SHOULD | Defects found in own instruments, overfitting risks and how discharged, claims that must not be quoted alone |
| 9 | **Takeaways** | MUST | Numbered only if genuinely ordered; each is a claim, not a summary |
| 10 | **Open decisions** | MUST when work remains | Named, with cost, and what each would resolve. FORBIDDEN: "next steps" with no cost attached |
| 11 | **Provenance footer** | MUST | Commits, gate results, constraints honored, date |

**Structural devices MUST encode something true.** Use real identifiers (track letters, arm names, phase ids) as section markers. `01 / 02 / 03` is permitted ONLY when the content is an actual sequence.

## Writing rules

| Rule | MUST | FORBIDDEN |
|---|---|---|
| Vocabulary | Name things as the reader recognizes them | System-internal names without a gloss |
| First use of a metric | Plain gloss inline ("nDCG@10 — a fő minőségi mérőszám, 0 és 1 között") | Bare metric name |
| Statistics | Translate every `p` and CI the first time; state what a CI containing zero means | Reporting a point estimate as a result |
| Numbers | Always with their comparison (`0,4868 → 0,6237`) and both forms (`51 / 360 · 14 %`) | A lone figure with no baseline |
| Voice | Active; past tense for events, present for what is now true | Passive hedging, "it was determined that" |
| Negative results | Equal billing + an explicit "this saved us X" | Burying a null in a footnote |
| Limits | Inside the win, in the same section | A limitations appendix |
| Hungarian output | Decimal comma (`0,6237`), non-breaking thin space in 4+ digit numbers (`16 885`), `„ "` quotes | Anglo decimal point in Hungarian prose |

## Information-design rules

| Rule | Detail |
|---|---|
| Measure | Running prose ~65 ch. Tables and figures break OUT of the measure into a wider band — data sits visually outside the argument |
| Tables | `overflow-x: auto` on their own container; `font-variant-numeric: tabular-nums` on every numeric column; a `<caption>` naming corpus + n + conditions |
| Verdict state | Encoded in form AND color — a chip with a shape marker plus an uppercase label, so it survives greyscale and color-blindness. Semantic colors (pass / uncertain / refuted) MUST be separate from the accent hue |
| Every table | Followed by a plain-language note saying what it means AND what it does NOT mean |
| Emphasis budget | One bold phrase per paragraph maximum; bold marks the claim, not the topic |
| Callouts | Reserved for a reframe or a caveat that changes how the section is read — not for repeating a sentence |

## Technical invariants

| # | Invariant | Why |
|---|---|---|
| 1 | `<meta charset="utf-8">` as the **FIRST LINE** of the file | Without it a `file://` open decodes UTF-8 as windows-1252 — accented text becomes `Ã©`/`Ã¡` mojibake. The Artifact wrapper injects its own; a locally-saved copy has nothing |
| 2 | `<title>` = a product-style name, 2–4 words, no dash-explainer | It is the gallery/tab identity |
| 3 | Three-state theming | Bare `:root` = full light palette; `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`; `:root[data-theme="dark"]` again. A color defined ONLY inside a media/`[data-theme]` block never applies in the default un-stamped state |
| 4 | `body` sets an explicit token `background` | A transparent body borrows the host's theme ground |
| 5 | Fonts: Google Fonts `<link>` only, real fallback stack, `latin-ext` subset for Hungarian (`ő ű`) | CSP blocks every other font host; a missing subset silently falls back mid-word |
| 6 | No `<!DOCTYPE>` / `<html>` / `<head>` / `<body>` tags | The publisher wraps the file |
| 7 | Self-contained: no CDN scripts, remote images, or fetch | Strict CSP |
| 8 | `prefers-reduced-motion` honored; `:focus-visible` styled | Accessibility floor |
| 9 | Cascade discipline — check no two selectors fight over the same spacing | Silent layout drift |

## Scale calibration

| Source size | Sections | Tables | Target |
|---|---|---|---|
| One fix / one measurement | 1,2,3,6,9 | 1 | ~600 words |
| One investigation | 1–7, 9, 11 | 2–4 | ~1200 words |
| Multi-strand campaign | all 11 | 4–8 | ~2500 words |

MUST NOT pad to reach a target. A section with nothing true to say is cut, not filled.

## Verify (phase 6)

| Check | How |
|---|---|
| Charset first line | `head -1 <file>` shows the meta tag |
| Valid UTF-8 | `file <file>` reports `UTF-8 text` |
| No stray head tags | `grep -c '<!DOCTYPE\|<html\|<body' <file>` → 0 |
| Theme tokens complete | Every custom property in the dark blocks also exists in bare `:root` |
| No unsourced number | Each headline figure appears in the phase-2 ledger |
| Tables scroll, page does not | Every `<table>` has an `overflow-x:auto` ancestor |
| Fallback stacks | Every `font-family` names a generic family last |

## Deliver (phase 7)

1. Save to `--out` (default `docs/plans/<YYYY-MM-DD>-<slug>.html`).
2. Publish via the Artifact tool with a one-sentence `description` and a stable emoji `favicon`. Redeploy the SAME file path to keep the URL.
3. Commit with `[commit]` passing the file path explicitly.
4. Report to the user: file path, Artifact URL, and any claim that was cut in phase 2 for lack of a source.

## Anti-patterns

| Anti-pattern | Instead |
|---|---|
| Methods-first opening | Stake first; method is section 3+ |
| Glossary as appendix | Glossary before the evidence |
| Table without a verdict | Every table gets its plain-language note |
| Percentages without absolutes | Both, always |
| "Significant improvement" for `p > 0.05` | "Not distinguishable at this sample size" |
| A reused palette from a prior article | Fresh subject-derived palette every time |
| Emoji as section markers | Real identifiers from the work |
| Decorative `01 / 02 / 03` | Only when the content is genuinely sequential |
