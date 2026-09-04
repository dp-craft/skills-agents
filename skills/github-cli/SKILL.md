---
name: github-cli
description: Execute daily GitHub operations using the GitHub CLI (gh). Use this skill whenever you need to create PRs, review PRs, merge branches, manage issues, or perform other GitHub operations. The gh command is always called with JSON output for consistent parsing.
compatibility:
  tools:
    - gh (GitHub CLI)
---

# GitHub CLI Skill

Execute GitHub operations using `gh` CLI.

## Rules

- Always use `--json` flags for machine-readable output
- Check auth first: `gh auth status`
- Push branches before creating PRs
- After merging, update local: `git pull --ff-only`

> If you need syntax examples or flag references, read `DETAILS.md` in this skill directory.

## Github Workflows

### Create Issue

- Create a new github issue using `gh issue create`
- Add the specification link to the issue
- Add enough details to start the implementation

### Implement Issue

- Read the issue using `gh issue view`
- Read the related spec in the `/spec` dir
- Start implementation (delegate to appropriate agents if necessary)

### Close Issue

- Check the specification tasks, checklist and github issue content — validate and update those
- Commit and push everything
- Close the ticket using `gh issue close`
