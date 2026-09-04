# GitHub CLI — Syntax Reference

Read this file only when you need specific `gh` flag syntax or examples.

## Pull Requests

```bash
# Create PR
git push -u origin HEAD
gh pr create --title "$title" --body "$body" --json number,url

# List open PRs
gh pr list --state open --json number,title,author,createdAt,headRefName

# PRs by author
gh pr list --author username --json number,title,headRefName

# PRs needing your review
gh pr list --search "review-requested:@me" --state open --json number,title,author,headRefName

# View PR details
gh pr view 123 --json number,title,body,state,headRefName,baseRefName,mergeable,files

# Review PR
gh pr review 123 --approve --body "LGTM"
gh pr review 123 --request-changes --body "Please fix X"
gh pr review 123 --comment --body "Consider Y"

# Merge PR
gh pr merge 123 --merge    # merge commit
gh pr merge 123 --squash   # squash and merge
gh pr merge 123 --rebase   # rebase and merge
```

## Issues

```bash
# Create
gh issue create --title "$title" --body "$body" --json number,url

# List
gh issue list --state open --json number,title,author,labels

# View
gh issue view 123 --json title,body,labels

# Comment
gh issue comment 123 --body "$comment"

# Close
gh issue close 123 --json state,closedAt

# Edit
gh issue edit 123 --title "$new_title" --body "$new_body"
gh issue edit 123 --add-assignee username
gh issue edit 123 --add-label "bug" --remove-label "enhancement"
```

## Repository

```bash
gh repo view --json name,owner,defaultBranchRef,url
```
