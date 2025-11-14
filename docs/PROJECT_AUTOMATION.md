# Project Automation Setup

This guide explains how to set up GitHub Project automation to work seamlessly with the AI Triage action.

## The Flow

```text
Issue Created → AI Triage → Labels + Priority + Size → Project Board
                    ↓
              Agent Ready?
                   ↓
        Yes → Status: Ready
        No  → Status: Backlog
                   ↓
   User provides more details
                   ↓
   User adds 'needs-triage' label (or automation does)
                   ↓
        AI Re-triages → Status: Ready ✅
```

## Automatic Re-triage on Backlog

To automatically re-triage issues when moved to Backlog status, set up a GitHub Project workflow.

### Setup Instructions

1. **Go to your GitHub Project**
   - Navigate to your project (e.g., `https://github.com/users/YOUR_USERNAME/projects/PROJECT_NUMBER`)

2. **Open Workflows**
   - Click the "⋯" menu (top right) → **Workflows**

3. **Create New Workflow**
   - Click **"New workflow"**
   - Configure as follows:

**Workflow Name:** `Auto-triage on backlog`

**When:** `Status changes`

- **From:** `Any status`
- **To:** `Backlog`

**Then:** `Add label`

- **Label:** `needs-triage`

This automatically adds the `needs-triage` label when you move an issue to Backlog, triggering AI re-triage.

## Required Project Fields

Ensure your GitHub Project has these fields:

| Field | Type | Options |
|-------|------|---------|
| **Status** | Single Select | Backlog, Ready, In progress, In review, Done |
| **Priority** | Single Select | P0, P1, P2 |
| **Size** | Single Select | XS, S, M, L, XL |

The action will automatically update these fields based on AI analysis.

## Required Repository Labels

Create these labels in your repository:

| Label | Description | Color |
|-------|-------------|-------|
| `needs-triage` | Triggers AI triage workflow | `#FFA500` |
| `triage:backlog` | Alternative trigger (optional) | `#FFA500` |
| `status:ready-for-review` | Auto-applied when agent-ready | `#0E8A16` |

### Creating Labels

```bash
# Using GitHub CLI
gh label create "needs-triage" --color "FFA500" --description "Triggers AI triage workflow"
gh label create "triage:backlog" --color "FFA500" --description "Backlog re-triage trigger"
gh label create "status:ready-for-review" --color "0E8A16" --description "Ready for implementation"
```

Or create them manually via: `https://github.com/YOUR_ORG/YOUR_REPO/labels`

## Workflow Configuration

### Minimal Workflow (Recommended)

```yaml
name: AI Issue Triage

on:
  issues:
    types: [opened, labeled]

permissions:
  contents: read
  issues: write
  models: read

jobs:
  triage:
    runs-on: ubuntu-latest

    steps:
      - name: AI Issue Triage
        uses: cajias/custom-github-actions/ai-triage@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          project-owner: YOUR_USERNAME      # e.g., "cajias"
          project-number: YOUR_PROJECT_NUMBER  # e.g., 4
```

The action automatically handles trigger logic internally! No `if` conditions needed.

**Finding your project number:**

1. Go to: `https://github.com/users/YOUR_USERNAME/projects/`
2. Click your project
3. Check the URL: `https://github.com/users/YOUR_USERNAME/projects/4` ← **4 is the number**

### Manual Re-triage

Simply add the `needs-triage` label to any issue:

1. Open the issue
2. Add label: `needs-triage`
3. AI triage runs automatically
4. Issue status updates based on result

## Testing

### Test Flow 1: New Issue

1. Create a vague issue: "Make the app faster"
2. Watch AI triage run in Actions tab
3. Should set status to `Backlog` and ask clarifying questions
4. Edit issue description with specific details
5. Add `needs-triage` label
6. Should update status to `Ready` ✅

### Test Flow 2: Backlog Re-triage

1. Move an existing issue to `Backlog` status in project board
2. Project automation adds `needs-triage` label (if configured)
3. Watch AI re-triage in Actions tab
4. Status updates to `Ready` if sufficient detail ✅

### Test Flow 3: Manual Re-triage

1. Open any issue that needs re-evaluation
2. Manually add `needs-triage` label
3. Watch AI re-triage
4. Labels, priority, size, and status update ✅

## Status Meanings

The action automatically sets these statuses:

| Status | Meaning |
|--------|---------|
| ✅ **Ready** | Issue has clear requirements, ready for implementation |
| 📋 **Backlog** | Issue needs more details or clarification |

## Advanced Options

### Scheduled Re-triage

Re-triage all Backlog items weekly:

```yaml
name: Weekly Backlog Re-triage

on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight

permissions:
  contents: read
  issues: write
  models: read

jobs:
  retriage:
    runs-on: ubuntu-latest
    steps:
      - name: Find Backlog Issues
        uses: actions/github-script@v7
        with:
          script: |
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              labels: 'status:backlog'
            });

            for (const issue of issues.data) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['needs-triage']
              });
            }
```

### Custom Triggers

Add custom label triggers:

```yaml
if: |
  github.event.action == 'opened' ||
  contains(github.event.issue.labels.*.name, 'needs-triage') ||
  contains(github.event.issue.labels.*.name, 'retriage') ||
  contains(github.event.issue.labels.*.name, 'triage:backlog')
```

## Troubleshooting

### Workflow doesn't trigger on backlog status change

**Cause:** Project automation not configured

**Solution:**

1. Go to your project → Workflows
2. Create "Auto-triage on backlog" workflow (see Setup Instructions above)
3. Test by moving an issue to Backlog

### Status stays in Backlog even when ready

**Possible causes:**

- Workflow error (check Actions logs)
- Incorrect project owner or number in workflow
- Project fields missing or have different names

**Solution:**

1. Check workflow logs: `https://github.com/YOUR_ORG/YOUR_REPO/actions`
2. Verify `project-owner` and `project-number` match your project
3. Ensure project has "Status" field with "Ready" and "Backlog" options

### AI asks same questions repeatedly

**Cause:** AI doesn't have memory of previous runs

**Solution:** Update the issue **description** with answers, not just comments. The AI only
sees the issue title and body, not comment history.

### Permission denied errors

**Cause:** Missing required permissions

**Solution:** Ensure workflow has these permissions:

```yaml
permissions:
  contents: read
  issues: write
  models: read
```

## Best Practices

1. **Update descriptions, not comments** - Edit the issue body with clarifications
2. **Use project automation** - Auto-add `needs-triage` on Backlog status
3. **Monitor initial results** - Check first few triages to ensure accuracy
4. **Create standard labels** - Use consistent labeling across repositories
5. **Document your setup** - Note custom triggers or workflows in your repo

## Next Steps

After setup:

1. ✅ Test with 2-3 sample issues
2. ✅ Monitor AI accuracy
3. ✅ Adjust project fields if needed
4. ✅ Roll out to other repositories
5. ✅ Share feedback and improvements

## Resources

- [AI Triage Action README](../ai-triage/README.md)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
