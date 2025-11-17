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
- [v1 vs v2 Comparison](./docs/ai-triage-comparison.md)

---

## 🚀 [AI Issue Triage v2 (MCP + GitHub Script)](./ai-triage-mcp/)

Next-generation AI triage using GitHub Models API with Model Context Protocol.

**Features:**

- **GitHub Models API** (GPT-4o) - Free tier available, no API key needed
- **Model Context Protocol (MCP)** - Optional automatic tool use with ReAct loops
- **GitHub Script** - Deterministic write operations
- **Native Sub-issues** - Creates proper parent-child issue relationships

**Key Improvements over v1:**

- ✅ No custom AI code (500 lines → ~200 lines YAML)
- ✅ Automatic tool use loop (searches similar issues, analyzes code)
- ✅ Better separation: AI for analysis, Script for operations
- ✅ Read-only MCP (safer by design)

**Minimal Usage:**

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    # Uses openai/gpt-4o by default (free tier available)
```

**With MCP (Enhanced Context):**

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

**Documentation:**

- [Action README](./ai-triage-mcp/README.md)
- [Testing Guide](./ai-triage-mcp/TESTING.md)
- [POC Validation](./docs/ai-triage-mcp-poc.md)
- [v1 vs v2 Comparison](./docs/ai-triage-comparison.md)

---

### 🍺 [Homebrew Auto-Update](./homebrew-update/)

Automatically update Homebrew formulas when your project is released.

**Features:**
- Multiple versioning strategies (date-based, semver, custom)
- Automated GitHub release creation
- SHA256 calculation and formula updates
- Git operations (commit and push to tap)
- Customizable release notes

**Minimal Usage:**
```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
    github_user: your-username
    source_repo: your-project
    tap_repo: homebrew-tools
    formula_name: your-formula
    formula_path: Formula/your-formula.rb
```

**Documentation:**
- [Action README](./homebrew-update/README.md)

---

## Coming Soon

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
