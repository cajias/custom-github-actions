# Custom GitHub Actions

Reusable GitHub Actions for the Agentic Applications ecosystem.

## Available Actions

### 🤖 [AI Issue Triage](./ai-triage/)

AI-powered GitHub issue triage using GitHub Models.

**Features:**
- Automatically labels issues with type, scope, and priority
- Estimates issue size (XS, S, M, L, XL)
- Enhances issue descriptions to be agent-ready
- Posts clarifying questions when needed
- Updates GitHub Project boards automatically

**Minimal Usage:**
```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
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

## Contributing

Contributions welcome! These actions are part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT
