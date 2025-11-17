# Copilot Subtask Manager

Automatically manage GitHub Copilot assignments for parallel subtask work.

## Features

- ✅ **Auto-assign to ready subtasks** - When Copilot is assigned to a parent issue, automatically assigns to all subtasks with no dependencies
- ✅ **Dependency tracking** - Parses dependencies from issue bodies and labels
- ✅ **Automatic progression** - When subtasks complete, automatically assigns next ready subtasks
- ✅ **Parallel execution** - Multiple independent subtasks can be worked on simultaneously
- ✅ **Circular dependency detection** - Prevents deadlocks from circular dependencies
- ✅ **Progress tracking** - Posts informative comments on parent issues

## Quick Start

### 1. Add workflow to your repository

Create `.github/workflows/copilot-subtask-manager.yml`:

```yaml
name: Copilot Subtask Manager

on:
  issues:
    types: [assigned]
  pull_request:
    types: [closed]

permissions:
  issues: write
  pull-requests: read
  contents: read

jobs:
  manage-subtasks:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/copilot-subtask-manager@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Create issues with subtasks

**Parent Issue #100:**
```markdown
# Add User Authentication

Implement complete user authentication system.
```

**Subtask Issues:**

**Issue #101:**
```markdown
Title: Create database schema for users
Labels: parent:100

Create tables for users, sessions, and permissions.
```

**Issue #102:**
```markdown
Title: Implement backend auth API
Labels: parent:100

Depends on #101

Create REST API endpoints for login, logout, and token refresh.
```

**Issue #103:**
```markdown
Title: Create frontend login UI
Labels: parent:100

Build login form and authentication flow in React.
```

**Issue #104:**
```markdown
Title: Add integration tests
Labels: parent:100

Requires #102, #103

Write e2e tests for full authentication flow.
```

### 3. Assign Copilot to parent issue

Simply assign Copilot to issue #100. The action will:
1. Find all subtasks with `parent:100` label
2. Analyze dependencies
3. Auto-assign Copilot to #101 and #103 (no dependencies)
4. Post status comment

### 4. Subtasks complete automatically

When #101 PR is merged:
- Action detects completion
- Checks parent #100 for newly unblocked tasks
- Finds #102 is now ready
- Auto-assigns Copilot to #102

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token for API access | Yes | `${{ github.token }}` |

## How It Works

### Event: Copilot Assigned to Parent

```
User assigns Copilot to parent #100
    ↓
Find subtasks with parent:100 label
    ↓
Parse dependencies from bodies/labels
    ↓
Identify ready subtasks (no unresolved deps)
    ↓
Auto-assign Copilot to ready subtasks
    ↓
Post status comment on #100
```

### Event: Subtask PR Merged

```
Subtask #101 PR merged
    ↓
Identify parent issue #100
    ↓
Find remaining open subtasks
    ↓
Check which became unblocked
    ↓
Auto-assign Copilot to newly ready subtasks
    ↓
Post progress comment on #100
```

## Dependency Syntax

The action recognizes multiple dependency formats:

### In Issue Body

```markdown
Depends on #123
depends-on: #124
Requires #125
requires: #126, #127
Blocked by #128
```

### In Labels

```
depends-on:#123
```

## Example Workflow

**Timeline for Issue #100:**

**T0**: User assigns Copilot to #100
- Action assigns Copilot to #101 (database) and #103 (frontend)
- Copilot creates 2 PRs in parallel

**T1**: #101 PR merged ✓
- Action checks dependencies
- #102 is now ready (depends on #101 ✓)
- Action assigns Copilot to #102
- Copilot creates PR for backend API

**T2**: #103 PR merged ✓
- #104 still blocked (needs #102)
- No new assignments yet

**T3**: #102 PR merged ✓
- #104 is now ready (depends on #102 ✓ and #103 ✓)
- Action assigns Copilot to #104
- Copilot creates PR for integration tests

**T4**: #104 PR merged ✓
- All subtasks complete ✅
- Feature #100 is done!

## Advanced Features

### Circular Dependency Detection

The action detects circular dependencies and prevents assignments:

```
#101 depends on #102
#102 depends on #103
#103 depends on #101  ❌ Circular!
```

If detected, action posts error comment and fails.

### Handling Edge Cases

**Already Assigned Subtasks:**
- Skipped automatically
- Only unassigned, ready subtasks are auto-assigned

**Missing Dependencies:**
- Treated as unresolved
- Subtask remains blocked

**Multiple Dependencies:**
- ALL must be resolved before subtask becomes ready
- Supports complex dependency graphs

## Development

### Building

```bash
npm install
npm run all
```

This will:
1. Format code with Prettier
2. Lint with ESLint
3. Compile TypeScript
4. Package with ncc

### Testing Locally

Use [act](https://github.com/nektos/act) to test the action:

```bash
act issues -e test-event.json
```

### Project Structure

```
copilot-subtask-manager/
├── src/
│   ├── main.ts                  # Main entry point
│   ├── types.ts                 # Type definitions
│   ├── subtask-discovery.ts     # Finding and parsing subtasks
│   ├── dependency-resolver.ts   # Dependency analysis
│   └── assignment-manager.ts    # Copilot assignments
├── dist/                        # Compiled output (committed)
├── action.yml                   # Action metadata
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Troubleshooting

### Copilot not auto-assigned to subtasks

**Check:**
1. Parent issue has subtasks with `parent:{number}` label
2. Subtasks are in `open` state
3. Subtasks don't have unresolved dependencies
4. Workflow has proper permissions

### Dependencies not recognized

**Check:**
1. Dependency syntax matches supported patterns
2. Issue numbers are correct
3. Labels are formatted as `depends-on:#123`

### Workflow not triggering

**Check:**
1. Workflow file is in `.github/workflows/`
2. File is valid YAML
3. Permissions are configured correctly
4. Issue assignment event is firing

## Related Documentation

- [Copilot Subtask Manager Guide](../docs/COPILOT_SUBTASK_MANAGER.md) - Detailed guide
- [GitHub Copilot Docs](https://docs.github.com/en/copilot) - Copilot documentation
- [GitHub Sub-issues](https://docs.github.com/en/issues/managing-your-tasks-with-tasklists/about-tasklists) - Native sub-issues

## Contributing

Contributions welcome! See the main [README](../README.md) for contribution guidelines.

## License

MIT
