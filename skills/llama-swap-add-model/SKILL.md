---
name: llama-swap-add-model
description: "Add a new GGUF model to llama-swap: download from Hugging Face if needed, save to models dir following naming convention, update models.yaml, regenerate config, review changes, commit."
---

# Add Model to llama-swap

## Overview
Add a new GGUF model to the local llama-swap installation. The workflow downloads the model from Hugging Face when the user does not provide an existing file, stores it under `~/models/gguf/<org>/<repo>.gguf` following the existing naming convention, updates `~/.config/llama-swap/models.yaml` (and `generate.py` when a new sampler family is needed), regenerates `config.yaml` via `generate.py`, reviews the diff, and commits the changes in the config git repo.

## Prerequisites
- `~/.config/llama-swap/generate.py` exists and uses `models.yaml` loading
- `~/.config/llama-swap/models.yaml` exists
- `~/models/gguf` exists
- `huggingface-cli` or `wget/curl` available for download
- Config dir is a git repo

## Process
1. **Clarify model details**
   - Ask for: model id, Hugging Face repo path or local file path, context length, kv cache type, mtp flag, family, backends, note.
   - If user provides existing file path, verify it exists. If not provided, download from Hugging Face.

2. **Download if needed**
   - Determine target path: `~/models/gguf/<org>/<filename>.gguf`
   - Use `huggingface-cli download <repo> <filename> --local-dir ~/models/gguf/<org>` or `wget`.
   - Verify file exists and size >0.

3. **Update models.yaml**
   - Read `~/.config/llama-swap/models.yaml`
   - Append new entry with keys: id, path (relative to `~/models/gguf`, e.g. `unsloth/Qwen3.6-27B-Q4_K_M.gguf`), ctx, kv, mtp, family, backends, optional note.
   - Write back preserving order.

4. **Extend `generate.py` only if the row needs a family that does not exist**
   - `family:` is the ONLY models.yaml key whose values live in `generate.py`. Reuse an existing one when its recipe matches the model card verbatim; add one when it does not, or when the entry count must differ (see § Family Mapping).
   - MUST NOT add a `models.yaml` key that `_load_models()` does not read — it is silently ignored.

5. **Regenerate config**
   - Run `python3 ~/.config/llama-swap/generate.py`
   - Check output: `wrote config.yaml with ... entries`

6. **Review changes**
   - Show `git diff --stat` in `~/.config/llama-swap`
   - Show new model entries in `config.yaml` via grep for model id
   - Confirm models.yaml and config.yaml changes look correct

7. **Commit**
   - `cd ~/.config/llama-swap`
   - `git add models.yaml config.yaml generate.py` if changed
   - Commit with message `feat(llama-swap): add <model-id>` or follow repo convention
   - Do NOT commit logs

## Naming Convention
- Relative path in models.yaml is `<org>/<filename>.gguf` where `<org>` is Hugging Face org/user, `<filename>` is GGUF filename.
- Physical file stored at `~/models/gguf/<org>/<filename>.gguf`
- Model id is kebab-case, unique.

## Family Mapping

A family is a `purpose -> sampler` dict in `generate.py`. Its SIZE decides how many llama-swap entries each backend produces, so it is both a sampler choice and a menu-size choice.

| Family | Recipe source | Entries per backend |
|---|---|---|
| `QWEN27`, `QWEN35`, `QWEN38` | Qwen card, thinking coding + general | 2 (`-coding`, `-planning`) |
| `GEM`, `MUSEP`, `QWEN35T` | single vendor recipe | 1 (no purpose suffix) |

Entry count per model = `len(templates or [""]) x len(backends) x entries-per-backend`. Vulkan yields one entry per purpose; ROCm always collapses to one.

### Adding a new family

Edit `generate.py` in three places, then regenerate:

| # | Location | Change |
|---|---|---|
| 1 | sampler-recipe block (after `Q38_PLAN`) | `NAME = "--temp ... --top-p ..."` — flags verbatim from the model card, plus any launch flag the recipe depends on (e.g. `-rea off`) |
| 2 | per-family purpose->sampler maps | `FAM = {"coding": NAME}` for one entry, or `{"coding": ..., "planning": ...}` for two |
| 3 | `_FAMILY_MAP` | `"FAM": FAM,` — `_load_models()` raises `Unknown family` without it |

Also update the `#   family:` line in the `models.yaml` header comment so the valid-value list stays true.

- Comment WHY the recipe differs, citing the card and any measurement — the file's existing recipes all carry that rationale.
- MUST NOT reuse another family's constant by reference; copy the value so an edit to one model cannot silently move another.

## Safety
- `config.yaml` is GENERATED — MUST NOT be hand-edited. Fix the input and re-run `generate.py`.
- Input ownership: per-model values (`id`, `path`, `ctx`, `kv`, `mtp`, `np`, `kv_unified`, `templates`, `backends`, `note`) -> `models.yaml`. Sampler recipes, families, binaries, `COMMON` flags -> `generate.py`.
- `generate.py` also rewrites `~/.config/opencode/opencode.json` (`provider.llama-swap.models`). Read its `+`/`-` output — an unexpected `-` means a row was dropped.
- Do NOT change unrelated files
- Verify generation succeeded before committing
