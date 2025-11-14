# Custom GitHub Actions

Reusable GitHub Actions for the Agentic Applications ecosystem.

## Available Actions

### 🤖 [AI Issue Triage](./ai-triage/)

AI-powered GitHub issue triage with multi-provider support (GitHub Models, Anthropic, OpenAI).

**Features:**
- Automatically labels issues with type, scope, and priority
- Estimates issue size (XS, S, M, L, XL)
- Enhances issue descriptions to be agent-ready
- Posts clarifying questions when needed
- Updates GitHub Project boards automatically
- Supports multiple AI providers (GitHub Models, Claude, GPT)

**Minimal Usage (Free):**
```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    # Uses xai/grok-3-mini by default (free, no API key needed)
```

**With Claude (Anthropic):**
```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    model: claude-3-5-sonnet-20241022
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**With GPT (OpenAI):**
```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    model: gpt-4o-mini
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

**With Project Board Integration (Optional):**
```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    project-owner: your-username  # For automatic board updates
    project-number: 4              # Your project number
```

**Documentation:**
- [Action README](./ai-triage/README.md)
- [Project Automation Setup](./docs/PROJECT_AUTOMATION.md)

---

## 🧪 Experimental: AI Triage POC (MCP + GitHub Script)

Next-generation AI triage using:
- **GitHub Models API** (GPT-4o) - Free tier available
- **Model Context Protocol (MCP)** - Automatic tool use with ReAct loops
- **GitHub Script** - Deterministic write operations

**Key Improvements over v1:**
- ✅ No custom AI code (500 lines → ~200 lines YAML)
- ✅ Automatic tool use loop (searches similar issues, analyzes code)
- ✅ Better separation: AI for analysis, Script for operations
- ✅ Read-only MCP (safer by design)

**Status:** POC validation phase - testing alongside v1

**Documentation:**
- [POC Documentation](./docs/ai-triage-mcp-poc.md)
- [Architecture Validation](./docs/ai-triage-mcp-poc.md#validated-assumptions)

---

## Coming Soon

- **Homebrew Auto-Update Action** - Automatically update Homebrew formulas
- **Release Notes Generator** - AI-powered release notes from PRs
- **Code Review Assistant** - Automated code review suggestions

## Development

Each action is self-contained in its own directory with:
- TypeScript source code
- Compiled JavaScript (committed to repo)
- Action metadata (`action.yml`)
- Documentation (`README.md`)

### Building Actions

```bash
cd <action-name>
npm install
npm run all
```

This will:
1. Format code with Prettier
2. Lint with ESLint
3. Compile TypeScript
4. Package with ncc

### Testing Locally

Use [act](https://github.com/nektos/act) to test actions locally:

```bash
act -j triage
```

### Linting

This project uses multiple linters to maintain code quality:

**Quick Start:**
```bash
# Install all linting tools
make install-lint-tools

# Run all linters
make lint

# Auto-fix issues
make fix

# Install pre-commit hooks
make pre-commit-install
```

**Available Linters:**
- **yamllint** - YAML files (workflows, prompts)
- **actionlint** - GitHub Actions workflows
- **markdownlint** - Documentation
- **ESLint + Prettier** - TypeScript code

See [LINTING.md](./docs/LINTING.md) for detailed documentation.

## Contributing

Contributions welcome! These actions are part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT
