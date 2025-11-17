# AI Issue Triage (MCP + GitHub Script)

AI-powered GitHub issue triage using GitHub Models API with Model Context Protocol (MCP) for automatic
tool use and context gathering.

> **🚀 Quick Start:** New to this action? See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide.

## Overview

This action provides next-generation AI triage using:

- **GitHub Models API** (GPT-4o) - Free tier available, no external API key needed
- **Model Context Protocol (MCP)** - Automatic tool use with ReAct loops
- **GitHub Script** - Deterministic write operations
- **Native Sub-issues** - Creates proper parent-child issue relationships

## Key Features

- ✅ **Automatic tool use** - AI searches similar issues and analyzes code automatically
- ✅ **No custom AI code** - Uses `actions/ai-inference` action (200 lines vs 500+ lines)
- ✅ **Better separation** - AI for analysis, GitHub Script for operations
- ✅ **Read-only MCP** - Safer by design (AI can search but not modify)
- ✅ **Free tier available** - Uses GitHub Models API
- ✅ **Structured output** - Returns validated JSON with triage data
- ✅ **Native sub-issues** - Creates GitHub sub-issue relationships with tasklists
- ✅ **Automatic labeling** - Applies type, priority, and scope labels
- ✅ **Subtask creation** - Breaks down complex issues automatically

## Quick Start

### Basic Usage (Free - GitHub Models)

Create `.github/workflows/ai-triage.yml`:

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
      - name: AI Triage
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # Uses openai/gpt-4o by default (free tier available)
```

That's it! 🎉

### With MCP Tool Access (Enhanced)

For automatic context gathering (search similar issues, analyze code):

```yaml
    steps:
      - name: AI Triage with MCP
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          enable-github-mcp: true
          github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

**Note:** MCP requires a Personal Access Token (PAT) with `repo` scope. See [Setup Instructions](#setup-instructions) below.

### Manual Trigger

You can also trigger triage manually:

```yaml
name: AI Issue Triage

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
      - name: AI Triage
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.inputs.issue_number || '' }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token for API access (requires `issues: write`) | Yes | `${{ github.token }}` |
| `github-mcp-token` | GitHub token for MCP access (requires `repo` scope) | No | `''` |
| `model` | AI model to use for analysis | No | `openai/gpt-4o` |
| `max-tokens` | Maximum tokens for AI response | No | `1500` |
| `enable-github-mcp` | Enable GitHub MCP for tool use | No | `false` |
| `issue-number` | Issue number to triage (auto-detected from event) | No | `''` |

### Available Models

GitHub Models API supports:

- `openai/gpt-4o` - Latest GPT-4 with vision (default)
- `openai/gpt-4o-mini` - Faster, more affordable
- `openai/gpt-4-turbo` - Previous generation
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- See [GitHub Models documentation](https://docs.github.com/en/github-models) for full list

## Outputs

| Output | Description |
|--------|-------------|
| `issue-number` | The issue number that was triaged |
| `category` | Issue category (bug, feature, documentation, question, enhancement) |
| `priority` | Issue priority (low, medium, high, critical) |
| `complexity` | Issue complexity (low, medium, high) |
| `labels` | Comma-separated list of applied labels |
| `subtask-numbers` | Comma-separated list of created subtask issue numbers |

### Using Outputs

```yaml
    steps:
      - name: AI Triage
        id: triage
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Use Triage Results
        run: |
          echo "Issue #${{ steps.triage.outputs.issue-number }} triaged"
          echo "Category: ${{ steps.triage.outputs.category }}"
          echo "Priority: ${{ steps.triage.outputs.priority }}"
          echo "Complexity: ${{ steps.triage.outputs.complexity }}"
          echo "Labels: ${{ steps.triage.outputs.labels }}"
          echo "Subtasks: ${{ steps.triage.outputs.subtask-numbers }}"
```

## Setup Instructions

### Basic Setup (No MCP)

1. No additional setup needed! The action works with `GITHUB_TOKEN` out of the box.
2. Ensure your workflow has the required permissions:

   ```yaml
   permissions:
     contents: read
     issues: write
     models: read  # Required for GitHub Models
   ```

### Advanced Setup (With MCP)

MCP enables the AI to automatically search similar issues and analyze code. To enable it:

#### 1. Create Personal Access Token (PAT)

GitHub MCP requires a PAT with these permissions:

- `repo` - Full repository access
- `read:org` - Read organization data

**Steps:**

1. Go to GitHub Settings → Developer settings → [Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Generate new token with `repo` and `read:org` scopes
3. Copy the token

#### 2. Add Secret to Repository

1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `TRIAGE_PAT`
4. Value: Paste your PAT
5. Click "Add secret"

#### 3. Enable MCP in Workflow

```yaml
    steps:
      - name: AI Triage with MCP
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          enable-github-mcp: true
          github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

## What This Action Does

When an issue is opened or edited, the action:

1. **Fetches issue details** - Title, body, author, labels
2. **Analyzes with AI** - Uses GitHub Models API (GPT-4o)
   - If MCP enabled: AI automatically searches similar issues and code
   - Returns structured JSON with triage data
3. **Validates response** - Ensures proper JSON structure and required fields
4. **Applies labels** - Based on AI analysis (type, priority, scope)
5. **Creates subtasks** - If issue is complex enough
   - Creates separate issues with `subtask` label
   - Links to parent issue with `parent:X` label
   - Inherits non-triage labels from parent (e.g., `automated-test`, `area:*`, `team:*`)
   - Updates parent issue body with tasklist (native sub-issues)
6. **Posts comment** - Summary of triage analysis

### Example Output

When triage completes, you'll see:

**Labels added:**

- `type:bug`
- `priority:high`
- `scope:authentication`

**Comment posted:**

```markdown
## AI Triage Analysis

**Category:** bug
**Priority:** high
**Complexity:** medium

**Reasoning:**
This appears to be a critical authentication bug affecting user login.
Similar issues (#123, #456) were resolved by updating the token validation
logic. The complexity is medium as it requires both backend and test changes.

**Similar Issues:** #123, #456

**Subtasks:**
- [ ] #789 Investigate root cause in authentication module
- [ ] #790 Implement fix and add regression tests

---
*Generated with [actions/ai-inference](https://github.com/actions/ai-inference) + GitHub MCP*
```

**Parent issue updated:**

The issue body is automatically updated with a tasklist:

```markdown
## Subtasks
- [ ] #789
- [ ] #790
```

This creates native GitHub sub-issue relationships that:

- Show hierarchy in the UI
- Auto-update checkboxes when subtasks close
- Integrate with GitHub Projects v2
- Enable better filtering and querying

**Label Inheritance:**

Subtasks automatically inherit non-triage labels from their parent issue:

- ✅ Inherited: `automated-test`, `area:*`, `team:*`, `sprint:*`, custom labels
- ❌ Not inherited: `type:*`, `priority:*`, `complexity:*` (triage-specific)

This ensures subtasks maintain organizational context while allowing each to receive its own triage classification if needed.

## Architecture

This action uses a hybrid architecture:

```text
┌─────────────────────────────────────────────────────────┐
│                    Composite Action                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Get Issue Details (github-script)                    │
│     └─> Fetch issue via GitHub API                       │
│                                                           │
│  2. AI Analysis with MCP (actions/ai-inference)          │
│     ├─> Connect to GitHub MCP Server (if enabled)        │
│     ├─> Provide GitHub read-only tools to GPT-4o         │
│     ├─> Automatic ReAct loop (max 5 iterations)          │
│     └─> Return structured JSON                           │
│                                                           │
│  3. Validate AI Response (github-script)                 │
│     └─> Parse and validate JSON structure                │
│                                                           │
│  4. Apply Labels (github-script)                         │
│     └─> Add labels via GitHub API                        │
│                                                           │
│  5. Create Subtasks (github-script)                      │
│     ├─> Create linked issues via GitHub API              │
│     └─> Update parent with tasklist (sub-issues)         │
│                                                           │
│  6. Add Triage Comment (github-script)                   │
│     └─> Post analysis summary                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**✅ Advantages:**

1. **No Custom AI Code** - 200 lines of YAML vs 500+ lines of TypeScript
2. **Automatic Tool Use** - MCP provides ReAct loop out of the box
3. **Separation of Concerns**:
   - AI does analysis (non-deterministic)
   - GitHub Script does operations (deterministic)
4. **Read-Only MCP** - AI can search but not modify (safer)
5. **Maintainable** - Prompts in YAML, logic in Script, clear boundaries
6. **Cost Effective** - GitHub Models API (free tier available)

**⚠️ Considerations:**

1. **PAT Required for MCP** - Cannot use `GITHUB_TOKEN` for MCP access
2. **Read-Only MCP** - Write operations still need GitHub Script
3. **Max 5 Tool Iterations** - Hardcoded in `actions/ai-inference` (reasonable limit)
4. **JSON Parsing** - Requires careful prompt engineering for structured output

## Comparison with v1 (TypeScript)

For a detailed comparison between v1 and v2, see [AI Triage Comparison Guide](../docs/ai-triage-comparison.md).

**Quick comparison:**

| Aspect | v1 (TypeScript) | v2 (MCP + Script) |
|--------|----------------|-------------------|
| **Lines of Code** | ~500 | ~200 (YAML) |
| **AI Integration** | Custom OpenAI SDK | actions/ai-inference |
| **Tool Use** | Manual | Automatic (MCP) |
| **Maintainability** | Complex | Simple |
| **Testing** | Unit + Integration | Workflow testing |
| **Extensibility** | Requires code changes | Update prompts/config |
| **Agentic Behavior** | Limited (single call) | ReAct loop (5 iterations) |
| **GitHub Integration** | Custom Octokit | GitHub Script |
| **Cost** | Direct API costs | GitHub Models (free tier) |
| **Setup** | API key required | Optional (works without MCP) |

## Cost Analysis

### GitHub Models (Free Tier)

- GPT-4o: 10 requests/min, 50 requests/day
- 8000 tokens in, 4000 tokens out per request

### Typical Triage

- ~1000 tokens input (issue + context)
- ~500 tokens output (JSON response)
- ~2-3 MCP tool calls per issue (if enabled)
- **Total: ~3 requests per triage**

**Capacity:** ~15 issues/day on free tier

For higher volume, consider:

- GitHub Copilot Pro+ (higher limits)
- Direct OpenAI API integration
- Batch processing during off-peak hours

## Debugging

### Check Workflow Logs

1. Go to Actions tab
2. Select failed workflow run
3. Expand steps to see detailed logs

### Common Issues

**Issue:** "Failed to connect to GitHub MCP server"

- **Cause:** Invalid or missing PAT
- **Fix:** Check `github-mcp-token` has correct permissions (`repo` scope)

**Issue:** "Validation failed: No JSON object found in response"

- **Cause:** AI didn't return valid JSON
- **Fix:** This is expected occasionally - the action posts a failure comment

**Issue:** "Resource not accessible by integration"

- **Cause:** Missing workflow permissions
- **Fix:** Add required permissions to workflow YAML:

  ```yaml
  permissions:
    contents: read
    issues: write
    models: read
  ```

**Issue:** "Rate limit exceeded"

- **Cause:** Too many AI inference calls
- **Fix:** GitHub Models has rate limits (check quotas in [GitHub Models](https://github.com/marketplace/models))

## Migration from v1

If you're currently using `cajias/custom-github-actions/ai-triage@main`:

### Differences

1. **Simpler architecture** - YAML-based composite action
2. **MCP support** - Optional automatic tool use
3. **Different outputs** - More granular output values
4. **No project support yet** - Project V2 integration coming soon

### Migration Steps

1. Update your workflow to use `ai-triage-mcp`:

   ```yaml
   - uses: cajias/custom-github-actions/ai-triage-mcp@main
   ```

2. Update inputs if needed:

   ```yaml
   with:
     token: ${{ secrets.GITHUB_TOKEN }}
     # Remove: anthropic-api-key, openai-api-key
     # Add (optional): enable-github-mcp, github-mcp-token
   ```

3. Update outputs if you use them:

   ```yaml
   # Old: steps.triage.outputs.is-agent-ready
   # New: steps.triage.outputs.complexity
   ```

4. Test on a non-critical repository first

### When to Use v1 vs v2

**Use v1 (TypeScript) if:**

- You need GitHub Projects V2 integration
- You prefer TypeScript-based actions
- You need Anthropic/OpenAI direct integration
- You want more customization options

**Use v2 (MCP + Script) if:**

- You want simpler, more maintainable code
- You want automatic tool use (MCP)
- You're okay with GitHub Models API
- You prefer YAML-based configuration

## Examples

### Basic Triage

```yaml
name: AI Issue Triage

on:
  issues:
    types: [opened]

permissions:
  contents: read
  issues: write
  models: read

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### With MCP and Custom Model

```yaml
name: AI Issue Triage

on:
  issues:
    types: [opened, edited]

permissions:
  contents: read
  issues: write
  models: read

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          model: openai/gpt-4o-mini
          enable-github-mcp: true
          github-mcp-token: ${{ secrets.TRIAGE_PAT }}
          max-tokens: 2000
```

### Manual Trigger with Outputs

```yaml
name: AI Issue Triage

on:
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to triage'
        required: true
        type: number

permissions:
  contents: read
  issues: write
  models: read

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: Triage Issue
        id: triage
        uses: cajias/custom-github-actions/ai-triage-mcp@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.inputs.issue_number }}

      - name: Report Results
        run: |
          echo "✅ Triaged issue #${{ steps.triage.outputs.issue-number }}"
          echo "Category: ${{ steps.triage.outputs.category }}"
          echo "Priority: ${{ steps.triage.outputs.priority }}"
          echo "Complexity: ${{ steps.triage.outputs.complexity }}"
```

## Testing

This action includes comprehensive integration tests to ensure reliability.

### Running Tests

Tests are automatically run on:

- Pull requests that modify the action
- Weekly schedule (Sundays at midnight UTC)
- Manual workflow dispatch

To run tests manually:

```bash
# Using GitHub CLI
gh workflow run test-ai-triage-mcp.yml

# Or from GitHub UI: Actions → Integration Tests - AI Triage MCP → Run workflow
```

### Test Coverage

- ✅ Basic triage functionality (labels, comments)
- ✅ Subtask creation for complex issues
- ✅ Error handling and edge cases
- ✅ Automatic cleanup of test artifacts

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## Contributing

Contributions welcome! This action is part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

When submitting changes:

1. Run integration tests with your changes
1. Update documentation if behavior changes
1. Follow existing code style and patterns

## References

- [actions/ai-inference](https://github.com/actions/ai-inference)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [actions/github-script](https://github.com/actions/github-script)

## License

MIT
