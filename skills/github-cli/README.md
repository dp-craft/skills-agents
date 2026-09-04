# GitHub CLI Skill

A comprehensive skill for executing daily GitHub operations using the GitHub CLI (gh) with JSON output for consistent parsing.

## Features

### Pull Request Management
- Create PRs from current or specified branches
- List and filter PRs by state, author, assignee
- View PR diffs without checking out branches
- Review PRs (approve, request changes, comment)
- Merge PRs with various strategies

### Issue Management
- Create, list, comment on, and close issues
- Assign issues to users
- Add/remove labels
- Filter issues by criteria

### Key Principles
- All gh commands use JSON output (`--json` or `-q`)
- Automatic repository detection from git remotes
- Consistent error handling and user feedback
- Integration with git workflow

## Usage Examples

### Create a PR
```
Create a pull request from current branch with title "Fix authentication bug"
```

### List PRs needing review
```
List all open pull requests needing my review
```

### View PR diff
```
Show the diff for PR #42
```

### Create an issue
```
Create an issue about a bug in the login page
```

### Review a PR
```
Approve PR #123 with comment "Ready to merge"
```

## Requirements

- GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
- Git repository with GitHub remote configured
- Network access to GitHub API

## Files

- `SKILL.md` - Main skill instructions
- `evals/evals.json` - Test cases for the skill
- `scripts/parse-gh-output.py` - Helper script for formatting JSON output

## Testing

To test the skill, you can run any of the eval prompts from `evals/evals.json` or use the commands directly with `gh`.
