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

## Contributing

Contributions welcome! These actions are part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT
