# AI Issue Triage Action

AI-powered GitHub issue triage using multiple AI providers. This action automatically analyzes new issues and:

- **Applies appropriate labels** (type, scope, priority)
- **Sets priority and size estimates** for project management
- **Enhances descriptions** to make them agent-ready
- **Asks clarifying questions** when details are missing
- **Updates project board fields** automatically

## Features

- ✅ **Type-safe TypeScript** implementation
- ✅ **Multi-provider support** - GitHub Models (free), Anthropic (Claude), OpenAI (GPT)
- ✅ **Smart provider detection** - Auto-detects provider from model name
- ✅ **Project V2 API support** for automatic board updates
- ✅ **Smart analysis** determines if issues are ready for AI agents
- ✅ **Automatic enhancement** of issue descriptions
- ✅ **Clarifying questions** posted as comments when needed

## Model Providers

This action supports three AI providers:

### 1. GitHub Models (Free) ✨

**No API key required** - Uses your `GITHUB_TOKEN`

Available models:

- `xai/grok-3` - Latest Grok model
- `xai/grok-3-mini` - Faster, lighter Grok (default)

### 2. Anthropic (Claude) 🤖

**Requires API key** from [Anthropic Console](https://console.anthropic.com/)

Available models:

- `claude-3-5-sonnet-20241022` - Latest Claude 3.5 Sonnet
- `claude-3-5-haiku-20241022` - Faster, more affordable
- `claude-3-opus-20240229` - Most capable

**Note:** While GitHub Copilot Pro provides Claude access in IDEs, it's **not available**
via GitHub Models API. To use Claude in this action, you need a separate Anthropic API key.

### 3. OpenAI (GPT) 🧠

**Requires API key** from [OpenAI Platform](https://platform.openai.com/api-keys)

Available models:

- `gpt-4o` - Latest GPT-4 with vision
- `gpt-4o-mini` - Faster, more affordable
- `gpt-4-turbo` - Previous generation

## Quick Start

### Basic Setup (Free - GitHub Models)

Create `.github/workflows/ai-issue-triage.yml`:

```yaml
name: AI Issue Triage

on:
  issues:
    types: [opened, labeled]

permissions:
  contents: read
  issues: write
  models: read  # Required for GitHub Models

jobs:
  triage:
    runs-on: ubuntu-latest

    steps:
      - name: AI Issue Triage
        uses: cajias/custom-github-actions/ai-triage@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # Uses xai/grok-3-mini by default (free)
```

That's it! 🎉

The action automatically handles trigger logic internally and will only run when:

- ✅ Issue is opened
- ✅ `needs-triage` label is added
- ✅ `triage:backlog` label is added

### Using Claude (Anthropic)

```yaml
    steps:
      - name: AI Issue Triage with Claude
        uses: cajias/custom-github-actions/ai-triage@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          model: claude-3-5-sonnet-20241022
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Setup:**

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your repository secrets as `ANTHROPIC_API_KEY`
3. Use any `claude-*` model name

### Using GPT (OpenAI)

```yaml
    steps:
      - name: AI Issue Triage with GPT
        uses: cajias/custom-github-actions/ai-triage@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          model: gpt-4o-mini
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

**Setup:**

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your repository secrets as `OPENAI_API_KEY`
3. Use any `gpt-*` model name

### With Project Board Integration (Optional)

**Why configure project integration?**

- Automatically adds issues to your GitHub Project board
- Sets Status field (Ready/Backlog)
- Sets Priority field (P0/P1/P2)
- Sets Size field (XS/S/M/L/XL)

**Without project config:** The action still works fully - it analyzes issues, applies labels,
posts comments, and enhances descriptions. Project integration is only for automatic board
management.

```yaml
    steps:
      - name: AI Issue Triage
        uses: cajias/custom-github-actions/ai-triage@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          project-owner: your-username  # OPTIONAL: Your GitHub username or org
          project-number: 4              # OPTIONAL: Find in project URL /projects/NUMBER
```

**How to find your project number:**

For user projects:

- Go to your project: `https://github.com/users/YOUR_USERNAME/projects/`
- Click on your project
- The URL will be: `https://github.com/users/YOUR_USERNAME/projects/4` ← **4 is your project number**

For organization projects:

- Go to your organization projects: `https://github.com/orgs/YOUR_ORG/projects/`
- Click on your project
- The URL will be: `https://github.com/orgs/YOUR_ORG/projects/4` ← **4 is your project number**

## Default Triggers

The action includes built-in trigger logic and automatically runs when:

1. **Issue is opened** - All new issues are automatically triaged
2. **`needs-triage` label added** - Manual re-triage requested
3. **`triage:backlog` label added** - Backlog items re-triaged

The action checks these conditions internally, so you don't need `if` conditions in your workflow!

**For advanced users:** Set `skip-trigger-check: true` to run on all issue events (not recommended)

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `token` | GitHub token with issues/projects/models permissions | Yes | `${{ github.token }}` |
| `model` | AI model to use (auto-detects provider) | No | `xai/grok-3-mini` |
| `anthropic-api-key` | Anthropic API key (required for Claude models) | No | `''` |
| `openai-api-key` | OpenAI API key (required for GPT models) | No | `''` |
| `project-owner` | Owner of the GitHub project (for board integration) | No | `''` |
| `project-number` | Project number to update (for board integration) | No | `''` |
| `skip-trigger-check` | Skip default trigger checking (advanced) | No | `false` |

**Note:** `project-owner` and `project-number` are only needed if you want automatic GitHub
Project board updates (Status, Priority, Size fields). The action works without them - it will
still analyze issues, apply labels, and post comments.

### Model Selection Guide

**Which provider should I use?**

- **GitHub Models (Free)** - Best for getting started, no API key needed
  - `xai/grok-3-mini` (default, fast)
  - `xai/grok-3` (more capable)
  
- **Anthropic (Claude)** - Best for complex analysis, requires API key
  - `claude-3-5-sonnet-20241022` (highest quality)
  - `claude-3-5-haiku-20241022` (faster, cheaper)
  
- **OpenAI (GPT)** - Industry standard, requires API key
  - `gpt-4o` (latest, most capable)
  - `gpt-4o-mini` (faster, cheaper)

**Provider Auto-Detection:**

- Model names starting with `claude-` → Anthropic
- Model names starting with `gpt-` or `o1-` → OpenAI
- Everything else → GitHub Models

## Outputs

| Name | Description |
|------|-------------|
| `is-agent-ready` | Whether the issue is ready for AI implementation |
| `priority` | Assigned priority (P0, P1, P2) |
| `size` | Size estimate (XS, S, M, L, XL) |
| `labels` | Comma-separated list of applied labels |

## How It Works

The action performs AI-powered analysis internally:

1. **Fetches issue** details from GitHub context
2. **Calls GitHub Models API** with specialized prompts
3. **Analyzes** if the issue is agent-ready
4. **Applies labels** (type, scope, priority)
5. **Updates issue** description if needed, OR posts clarifying questions
6. **Updates project board** (if configured) with priority, size, and status

## Project Automation Setup

To enable automatic re-triage when issues are moved to Backlog:

**📚 [Read the full Project Automation Guide](../docs/PROJECT_AUTOMATION.md)**

Quick setup:

1. Go to your GitHub Project → Workflows
2. Create workflow: When status → "Backlog", Then add label → "needs-triage"
3. Issues moved to Backlog will automatically re-triage

## What Happens

### If Issue is Agent-Ready ✅

1. Applies labels
2. Adds `status:ready-for-review` label
3. Posts summary comment with priority, size, and reasoning
4. Updates project board fields (if configured)

### If Issue Needs Clarification ❓

1. Applies labels
2. **Posts clarifying questions** as a comment
3. **OR enhances the description** if possible
4. Sets project status to "Backlog"

## Development

### Build

```bash
cd ai-triage
npm install
npm run build
npm run package
```

### Test Locally

```bash
npm run all
```

This runs:

- Format checking (Prettier)
- Linting (ESLint)
- TypeScript compilation
- Packaging with ncc

## Project Structure

```text
ai-triage/
├── src/
│   ├── main.ts              # Entry point
│   ├── types.ts             # TypeScript type definitions
│   ├── analyze.ts           # AI inference and prompting
│   ├── process-triage.ts    # Issue processing logic
│   └── update-project.ts    # Project board updates
├── dist/
│   └── index.js             # Compiled output (committed)
├── action.yml               # Action metadata
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! This action is part of the Agentic Applications project.
