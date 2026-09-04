#!/usr/bin/env python3
"""
Parse GitHub CLI JSON output and format it for display.
"""
import json
import sys
from datetime import datetime

def format_pr_list(pr_data):
    """Format PR list for display"""
    if not pr_data:
        return "No pull requests found"

    output = []
    for pr in pr_data:
        number = pr.get('number', 'N/A')
        title = pr.get('title', 'No title')
        author = pr.get('author', {}).get('login', 'Unknown')
        mergeable = pr.get('mergeable', 'UNKNOWN')
        created = pr.get('createdAt', '')

        if created:
            created_date = datetime.fromisoformat(created.replace('Z', '+00:00'))
            created_str = created_date.strftime('%Y-%m-%d')
        else:
            created_str = 'Unknown date'

        output.append(f"#{number}: {title}")
        output.append(f"  Author: {author} | Created: {created_str} | Mergeable: {mergeable}")
        output.append("")

    return "\n".join(output)

def format_pr_created(pr_data):
    """Format PR creation response"""
    number = pr_data.get('number', 'N/A')
    url = pr_data.get('url', '')

    return f"✓ Created PR #{number}\n  URL: {url}"

def format_issue_created(issue_data):
    """Format issue creation response"""
    number = issue_data.get('number', 'N/A')
    url = issue_data.get('url', '')

    return f"✓ Created issue #{number}\n  URL: {url}"

def format_repo_info(repo_data):
    """Format repository information"""
    name = repo_data.get('name', 'Unknown')
    owner = repo_data.get('owner', {}).get('login', 'Unknown')
    default_branch = repo_data.get('defaultBranchRef', {}).get('name', 'main')
    url = repo_data.get('url', '')

    return f"Repository: {owner}/{name}\nDefault branch: {default_branch}\nURL: {url}"

def main():
    if len(sys.argv) < 3:
        print("Usage: python parse-gh-output.py <format> <json-file>")
        print("Formats: pr-list, pr-created, issue-created, repo-info")
        sys.exit(1)

    format_type = sys.argv[1]
    json_file = sys.argv[2]

    try:
        with open(json_file, 'r') as f:
            data = json.load(f)

        if format_type == 'pr-list':
            print(format_pr_list(data))
        elif format_type == 'pr-created':
            print(format_pr_created(data))
        elif format_type == 'issue-created':
            print(format_issue_created(data))
        elif format_type == 'repo-info':
            print(format_repo_info(data))
        else:
            print(f"Unknown format: {format_type}")
            print(json.dumps(data, indent=2))

    except FileNotFoundError:
        print(f"Error: File '{json_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{json_file}': {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
