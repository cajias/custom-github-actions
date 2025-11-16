# Quick Start Guide - AI Triage MCP

Get started with AI-powered issue triage in 5 minutes.

## 1. Create Workflow File

Create `.github/workflows/ai-triage.yml` in your repository:

```yaml
name: AI Issue Triage

on:
  issues:
    types: [opened, edited]

permissions:
  contents: read
  issues: write
  models: read  # Required for GitHub Models

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## 2. Commit and Push

```bash
git add .github/workflows/ai-triage.yml
git commit -m "Add AI issue triage"
git push
```

## 3. Test It

Create a new issue in your repository. The workflow will automatically:

1. ✅ Analyze the issue with AI (GPT-4o)
2. ✅ Add appropriate labels (type, priority, scope)
3. ✅ Create subtasks if needed
4. ✅ Post a triage comment with analysis

## What Happens Next?

When you create or edit an issue, you'll see:

**Labels added:**

- `type:bug` or `type:feature` or `type:documentation`
- `priority:low` or `priority:medium` or `priority:high` or `priority:critical`
- Additional scope labels as appropriate

**Comment posted:**

```markdown
## AI Triage Analysis

**Category:** bug
**Priority:** high
**Complexity:** medium

**Reasoning:**
This appears to be a critical authentication bug affecting user login...

**Subtasks:**
- [ ] #123 Investigate root cause
- [ ] #124 Implement fix and tests
```

**Subtasks created** (if complex issue):

- New issues with `subtask` label
- Linked to parent with native sub-issue relationship
- Parent issue updated with tasklist

## Optional: Enable MCP for Better Context

MCP allows the AI to automatically search similar issues and analyze code.

### Step 1: Create PAT

1. Go to GitHub Settings → [Personal access tokens](https://github.com/settings/tokens)
2. Generate new token (classic) with `repo` scope
3. Copy the token

### Step 2: Add Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `TRIAGE_PAT`
4. Value: Paste your PAT
5. Click "Add secret"

### Step 3: Update Workflow

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

## Customization

### Use Different Model

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    model: openai/gpt-4o-mini  # Faster, cheaper
```

### Increase Token Limit

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    max-tokens: 2000  # Default is 1500
```

### Manual Trigger

Add workflow_dispatch to trigger manually:

```yaml
on:
  issues:
    types: [opened, edited]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to triage'
        required: true
        type: number

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.inputs.issue_number || '' }}
```

Then run with:

```bash
gh workflow run ai-triage.yml --field issue_number=123
```

## Troubleshooting

### "Resource not accessible by integration"

Add required permissions to workflow:

```yaml
permissions:
  contents: read
  issues: write
  models: read  # Required for GitHub Models
```

### "Failed to connect to GitHub MCP server"

If using MCP, check that `TRIAGE_PAT` has `repo` scope.

### "Rate limit exceeded"

Free tier: 10 requests/min, 50 requests/day.

For higher volume:

- Use off-peak hours
- Consider GitHub Copilot Pro+
- Use a more affordable model (gpt-4o-mini)

## Next Steps

- [Full README](./README.md) - Complete documentation
- [Comparison with v1](../docs/ai-triage-comparison.md) - Choose the right version
- [Architecture](./README.md#architecture) - How it works
- [Examples](./README.md#examples) - More usage patterns

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/cajias/custom-github-actions/issues)
- 💬 [Discussions](https://github.com/cajias/custom-github-actions/discussions)
