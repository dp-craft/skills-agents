<!-- LLM-PRIMARY: Git branching model, commit conventions, and merge workflow. -->

## Git Strategy

### Branching model

```
master
  └── epic/{feature-name}       ← speckit creates this, all work happens here
        ├── T001 Setup ...       ← one commit per task
        ├── T002 [US1] Create ...
        ├── T003 [US1] Implement ...
        ├── T004 [US2] Create ...
        └── ...
```

- **No story branches** — task commits on the epic branch carry `[US1]`, `[US2]` labels from tasks.md
- **No squashing** — every task commit is preserved on merge
- **Filter by story**: `git log --oneline --grep="\[US1\]"`

### Auto-commit rules

After each task completes its full workflow (tests pass, lint clean, review done):

1. `[commit]`: `bash tools/scripts/git-autocommit.sh "feat(T003): implement MessageService"`
   Types (MUST use): `feat` | `fix` | `test` | `chore` | `refactor` | `docs` | `security`
2. **Task checkboxes** — batch `sed` at phase end via `[phase-end]`. Git log = source of truth for completed tasks.
3. MUST NOT commit failing code
4. MUST NOT batch multiple tasks into one commit
5. Commit at natural boundaries — retrospectives, review reports, snapshots get their own commit

### Merge to master

When the epic is complete (all tasks `[X]`, Pre-Merge workflow passes):

1. Run the full Pre-Merge workflow on the epic branch
2. Push and create PR: `gh pr create` (done by Pre-Merge step 21)
3. After UAT approval, merge via GitHub: `gh pr merge --merge --delete-branch`
4. Update local: `git checkout master && git pull --ff-only`

### GitHub integration

Use the `/github-cli` skill for all GitHub operations. Key operations:

- **Create epic branch**: `git checkout -b epic/{feature-name}` (at speckit plan time)
- **Push progress**: `git push origin epic/{feature-name}` after each phase completes (not after every task — too noisy)
- **Create PR**: after Pre-Merge passes, use `gh pr create` with the epic summary
- **Merge PR**: `gh pr merge --merge --delete-branch` (no squash, preserves task commits)
