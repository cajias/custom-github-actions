# Copilot Subtask Manager

Automatically assigns GitHub Copilot to ready subtasks, enabling parallel work on complex parent issues with intelligent dependency management.

> **🚀 Quick Start:** New to this action? See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide.

## Overview

When working on complex features, you often need to break them down into multiple subtasks. This action automates the process of assigning GitHub Copilot to subtasks that are ready to work on, respecting dependencies between tasks.

### Key Benefits

- 🚀 **Parallel Work** - Multiple independent subtasks can be assigned to Copilot simultaneously
- 🔄 **Automatic Progression** - As subtasks complete, dependent tasks are automatically assigned
- 🧠 **Dependency Intelligence** - AI-powered or manual dependency detection
- 📊 **Progress Visibility** - Clear status updates on parent issues
- ⏱️ **Time Savings** - Reduces manual tracking and assignment overhead

## How It Works

### Workflow 1: Parent Assignment → Auto-assign Ready Subtasks

When Copilot is assigned to a parent issue:

1. Detects that `copilot-swe-agent` was assigned
2. Checks if the issue has subtasks (tasklist format)
3. Analyzes dependencies between subtasks
4. Identifies all subtasks with no unresolved dependencies
5. Automatically assigns Copilot to ready subtasks
6. Posts a comment showing assignment status

### Workflow 2: Subtask Completion → Auto-assign Next Ready Subtasks

When a subtask's PR is merged:

1. Detects the PR merge event
2. Identifies the parent issue
3. Re-analyzes remaining subtasks
4. Finds subtasks that became ready
5. Auto-assigns Copilot to newly unblocked subtasks
6. Posts a progress update comment

## Quick Start

### Basic Setup (Manual Dependencies)

Create `.github/workflows/copilot-subtask-manager.yml`:

```yaml
name: Copilot Subtask Manager

on:
  issues:
    types: [assigned]
  pull_request:
    types: [closed]

permissions:
  contents: read
  issues: write
  pull-requests: read

jobs:
  manage-subtasks:
    runs-on: ubuntu-latest

    steps:
      - name: Manage Copilot Subtasks
        uses: cajias/custom-github-actions/copilot-subtask-manager@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Setup (AI-Powered Dependency Analysis)

For automatic dependency detection using AI:

```yaml
name: Copilot Subtask Manager

on:
  issues:
    types: [assigned]
  pull_request:
    types: [closed]

permissions:
  contents: read
  issues: write
  pull-requests: read
  models: read  # Required for GitHub Models

jobs:
  manage-subtasks:
    runs-on: ubuntu-latest

    steps:
      - name: Manage Copilot Subtasks with AI
        uses: cajias/custom-github-actions/copilot-subtask-manager@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          enable-ai-analysis: true
          ai-token: ${{ secrets.COPILOT_MANAGER_PAT }}
```

**Note:** AI analysis requires a Personal Access Token (PAT) with `repo` scope. See [Setup Instructions](#setup-instructions) below.

## Dependency Specification

### Method 1: Labels (Recommended)

Add labels to subtask issues in the format `depends-on:#123`:

```yaml
# Subtask #102 depends on #101
Labels: depends-on:#101
```

### Method 2: Issue Body

Include dependency information in the subtask description:

```markdown
## Dependencies

- Depends on #101
- Requires #103
- Blocked by #104
```

Supported keywords:
- `Depends on #123`
- `Requires #123`
- `Blocked by #123`
- `Dependency: #123`

### Method 3: AI Analysis (Advanced)

When `enable-ai-analysis: true` is set, the AI will:
- Analyze subtask titles and descriptions
- Identify logical dependencies (e.g., "database schema" before "API implementation")
- Detect technical dependencies based on context
- Override manual specifications when conflicts are detected

## Usage Example

### Scenario: User Profile Management Feature

**Parent Issue #200**: "Implement user profile management"

Create subtasks with dependencies:

```markdown
## Subtasks
- [ ] #201 Database schema updates
- [ ] #202 Backend API for CRUD operations
- [ ] #203 Frontend UI components  
- [ ] #204 Integration tests
- [ ] #205 Documentation updates
```

**Subtask #202** body:
```markdown
Implement REST API endpoints for user profile management.

Dependencies:
- Depends on #201 (database schema must be ready)
```

**Subtask #204** body:
```markdown
Create integration tests for profile workflows.

Dependencies:
- Depends on #202 (backend API)
- Depends on #203 (frontend UI)
```

### Timeline

**T0**: User assigns Copilot to #200
- ✅ Action assigns Copilot to #201 (database) - no dependencies
- ✅ Action assigns Copilot to #203 (frontend) - no dependencies
- ⏸️ #202 blocked by #201
- ⏸️ #204 blocked by #202, #203
- ⏸️ #205 blocked by #204

**T1**: PR for #201 merged
- ✅ Action assigns Copilot to #202 (backend) - #201 now resolved

**T2**: PR for #203 merged
- ⏸️ #204 still blocked (needs #202)

**T3**: PR for #202 merged
- ✅ Action assigns Copilot to #204 (tests) - both #202 and #203 resolved

**T4**: PR for #204 merged
- ✅ Action assigns Copilot to #205 (docs) - #204 resolved

**Result**: Maximum parallelization with automatic progression through dependencies.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token with `issues: write` permission | Yes | - |
| `ai-token` | GitHub token for AI/MCP access (requires `repo` scope) | No | `''` |
| `model` | AI model for dependency analysis | No | `openai/gpt-4o` |
| `max-tokens` | Maximum tokens for AI response | No | `1500` |
| `enable-ai-analysis` | Enable AI-powered dependency analysis | No | `false` |
| `copilot-username` | Username of the Copilot bot | No | `copilot-swe-agent` |

## Outputs

| Output | Description |
|--------|-------------|
| `parent-issue-number` | The parent issue number |
| `assigned-subtasks` | Comma-separated list of assigned subtask numbers |
| `skipped-subtasks` | Comma-separated list of skipped subtask numbers |

## Edge Cases & Handling

### Circular Dependencies

If circular dependencies are detected (e.g., A depends on B, B depends on A):
- Action posts an error comment on the parent issue
- No assignments are made for the circular group
- User intervention required

### Assignment Conflicts

If a subtask is already assigned:
- Subtask is skipped
- Listed in the "Skipped" section of the status comment

### Failed Dependencies

If a dependency is closed without merging:
- Dependent subtasks remain blocked
- Status comment indicates the issue
- User intervention required

### Missing Parent Reference

If a subtask doesn't link back to its parent:
- PR completion won't trigger automatic assignment
- Manual reassignment may be needed

## Setup Instructions

### Basic Setup (No AI)

1. Create the workflow file as shown in [Quick Start](#quick-start)
2. Ensure your repository has the `issues: write` permission enabled
3. Create parent issues with tasklists
4. Add dependency labels or body text to subtasks
5. Assign Copilot to the parent issue

### Advanced Setup (AI-Powered)

1. Create a Personal Access Token (PAT):
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: `COPILOT_MANAGER_PAT`
   - Scopes: Select `repo` (full control of private repositories)
   - Click "Generate token" and copy the token

2. Add the PAT as a repository secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `COPILOT_MANAGER_PAT`
   - Value: Paste your PAT
   - Click "Add secret"

3. Create the workflow file with AI enabled (see [Advanced Setup](#advanced-setup-ai-powered-dependency-analysis))

4. Ensure `models: read` permission is enabled in your workflow

## Best Practices

### Creating Parent Issues

1. Use tasklist format for subtasks:
   ```markdown
   ## Subtasks
   - [ ] #101 First subtask
   - [ ] #102 Second subtask
   - [ ] #103 Third subtask
   ```

2. Create all subtask issues before assigning Copilot to the parent

3. Keep parent issue descriptions clear and high-level

### Defining Dependencies

1. **Be explicit**: Use labels or body text to specify dependencies
2. **Keep it simple**: Avoid complex dependency chains when possible
3. **Use AI for complex cases**: Enable AI analysis for intricate dependency graphs
4. **Test first**: Verify dependency logic on small examples before scaling up

### Managing Copilot Assignments

1. **Review before assigning**: Ensure subtasks are well-defined
2. **Monitor progress**: Check parent issue comments for status updates
3. **Handle failures**: Address blocked or failed subtasks promptly
4. **Workflow approvals**: Remember that GitHub requires manual approval for workflows triggered by bot assignments

## Troubleshooting

### Copilot Not Assigned to Subtasks

**Symptoms**: Parent assignment succeeds but no subtasks are assigned

**Possible causes**:
- No subtasks have zero dependencies
- All subtasks are already assigned
- Tasklist format is incorrect
- Dependencies are not resolvable

**Solution**:
- Check the status comment on the parent issue
- Verify tasklist uses `- [ ] #123` format
- Review dependency labels and descriptions

### AI Analysis Not Working

**Symptoms**: Dependencies not detected correctly

**Possible causes**:
- `enable-ai-analysis` not set to `true`
- `ai-token` not provided or invalid
- `models: read` permission missing

**Solution**:
- Verify workflow configuration
- Check PAT has `repo` scope
- Ensure permissions are set correctly

### Workflow Approval Required

**Symptoms**: Workflow doesn't run after Copilot assignment

**Cause**: GitHub security requirement for bot-triggered workflows

**Solution**:
- Go to Actions tab in your repository
- Click "Approve and run workflows"
- This is a one-time manual step per trigger

### Subtasks Not Auto-assigned After PR Merge

**Symptoms**: PR merges but no new assignments

**Possible causes**:
- Subtask doesn't reference parent issue
- PR doesn't close the subtask
- No newly unblocked subtasks

**Solution**:
- Ensure subtask body includes "Parent Issue: #123"
- Ensure PR uses "Closes #123" in description
- Check parent issue for remaining blocked subtasks

## Examples

### Example 1: Simple Parallel Tasks

**Parent Issue #100**: "Update documentation"

```markdown
## Subtasks
- [ ] #101 Update README
- [ ] #102 Update API docs  
- [ ] #103 Update contributing guide
```

All three have no dependencies, so all get assigned to Copilot immediately.

### Example 2: Sequential with Dependencies

**Parent Issue #200**: "Add authentication"

```markdown
## Subtasks
- [ ] #201 Database schema
- [ ] #202 Backend API
- [ ] #203 Frontend UI
- [ ] #204 Tests
```

**Subtask #202** depends on #201  
**Subtask #204** depends on #202, #203

Assignments:
- T0: #201, #203 assigned (parallel)
- T1: #202 assigned (after #201 complete)
- T2: #204 assigned (after #202, #203 complete)

### Example 3: Complex Dependency Graph

**Parent Issue #300**: "Implement payment system"

```markdown
## Subtasks
- [ ] #301 Payment gateway integration
- [ ] #302 Database schema for transactions
- [ ] #303 Backend payment API
- [ ] #304 Frontend checkout UI
- [ ] #305 Email notifications
- [ ] #306 Admin dashboard
- [ ] #307 Integration tests
```

Dependencies:
- #303 depends on #301, #302
- #305 depends on #303
- #306 depends on #303
- #307 depends on #303, #304

With AI analysis enabled, the action determines optimal assignment order.

## Limitations

1. **Workflow Approval**: Manual approval required for bot-triggered workflows (GitHub security requirement)

2. **No Cross-Repository Dependencies**: Dependencies must be within the same repository

3. **Tasklist Format Required**: Parent issues must use GitHub's tasklist format

4. **Single Parent**: Each subtask should have only one parent issue

5. **Copilot Context**: Each Copilot assignment creates a separate PR with independent context

## Future Enhancements

- [ ] Support for cross-repository dependencies
- [ ] Automatic parent issue closure when all subtasks complete
- [ ] Progress dashboard with dependency graph visualization
- [ ] Support for other AI coding agents
- [ ] PR dependency setup (PR for subtask depends on parent PR)
- [ ] Integration with GitHub Projects for better tracking

## Contributing

Contributions welcome! This action is part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT

## Related Actions

- [AI Issue Triage](../ai-triage/) - AI-powered issue triage and labeling
- [AI Issue Triage (MCP)](../ai-triage-mcp/) - Next-gen triage with MCP tools

## Resources

- [GitHub Copilot Docs](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-cli/assigning-github-copilot-to-an-issue)
- [GitHub Tasklists](https://docs.github.com/en/issues/managing-your-tasks-with-tasklists/about-tasklists)
- [GitHub Actions Events](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows)
- [GitHub Models API](https://docs.github.com/en/github-models)
