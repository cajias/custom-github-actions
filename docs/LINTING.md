# Linting Guide

This project uses multiple linting tools to maintain code quality and consistency across different file types.

## Available Linters

### 1. **yamllint** - YAML Files

Lints all YAML files including:

- GitHub Actions workflows (`.github/workflows/*.yml`)
- Prompt files (`.github/prompts/*.yml`)
- Configuration files

**Configuration:** `.yamllint`

**Key Rules:**

- 2-space indentation
- Max line length: 120 characters
- Consistent formatting

### 2. **actionlint** - GitHub Actions Workflows

Specialized linter for GitHub Actions workflows that checks for:

- Invalid action references
- Missing required inputs
- Deprecated syntax
- Workflow syntax errors
- Shell script issues in `run` blocks

**No configuration needed** - uses GitHub's official schema

### 3. **markdownlint** - Markdown Documentation

Lints all `.md` files for consistency and best practices.

**Configuration:** `.markdownlint.json`

**Key Rules:**

- Max line length: 120 characters (except code blocks and tables)
- Consistent heading styles
- Proper list formatting

### 4. **ESLint + Prettier** - TypeScript Code

Lints TypeScript code in the `ai-triage/` action.

**Configuration:**

- `ai-triage/.eslintrc.json`
- `ai-triage/package.json` (prettier config)

**Key Rules:**

- TypeScript strict mode
- GitHub Actions best practices (via `eslint-plugin-github`)
- Consistent code formatting

## Quick Start

### Install All Linting Tools

```bash
make install-lint-tools
```

This installs:

- yamllint (via pip)
- actionlint (via curl)
- markdownlint-cli (via npm)
- pre-commit (via pip)
- TypeScript linters (via npm in ai-triage/)

### Run All Linters

```bash
make lint
```

### Run Individual Linters

```bash
make lint-yaml       # YAML files only
make lint-actions    # GitHub Actions workflows only
make lint-markdown   # Markdown files only
make lint-ts         # TypeScript code only
```

### Auto-Fix Issues

```bash
make fix
```

This will automatically fix issues that can be safely auto-corrected.

## Pre-Commit Hooks

Pre-commit hooks run linters automatically before each commit.

### Install Pre-Commit Hooks

```bash
make pre-commit-install
```

### What Gets Checked

When you run `git commit`, the following checks run automatically:

1. Trailing whitespace removal
2. End-of-file fixer
3. YAML syntax validation
4. Large file detection
5. Merge conflict detection
6. yamllint
7. markdownlint
8. actionlint
9. ESLint (for modified TypeScript files)
10. Prettier (for modified TypeScript files)

### Manual Pre-Commit Run

Run all pre-commit hooks on all files:

```bash
make pre-commit-run
```

Or use pre-commit directly:

```bash
pre-commit run --all-files
```

### Skip Pre-Commit Hooks

If you need to bypass hooks temporarily:

```bash
git commit --no-verify -m "Your message"
```

**Note:** CI will still run linters, so issues will be caught there.

## CI/CD Integration

All linters run automatically in CI via `.github/workflows/lint.yml`:

```yaml
on:
  pull_request:
  push:
    branches:
      - main
```

### Lint Jobs

1. **yaml-lint** - Validates all YAML files
2. **actionlint** - Validates GitHub Actions workflows
3. **markdown-lint** - Validates Markdown documentation
4. **typescript-lint** - Validates TypeScript code
5. **lint-summary** - Aggregates results

All jobs must pass for PR to be mergeable.

## Common Issues

### yamllint: Line Too Long

**Error:**

```text
error: line too long (132 > 120 characters) (line-length)
```

**Fix:**
Break long lines using YAML multiline syntax:

```yaml
# Before
- name: Very Long Step Name That Exceeds The Maximum Line Length And Should Be Broken Up

# After
- name: >-
    Very Long Step Name That Exceeds The Maximum
    Line Length And Should Be Broken Up
```

### actionlint: Unknown Action

**Error:**

```text
error: unknown action "actions/nonexistent-action@v1"
```

**Fix:**
Verify the action exists and the version is correct:

```bash
gh api repos/actions/nonexistent-action
```

### markdownlint: MD013 Line Length

**Error:**

```text
MD013/line-length: Line length [warning]
```

**Fix:**
Break long lines or add exception to `.markdownlint.json` if needed (e.g., for URLs).

### ESLint: Unused Variable

**Error:**

```text
error: 'foo' is defined but never used
```

**Fix:**
Either use the variable or prefix with underscore:

```typescript
// Before
const foo = getValue()

// After (if intentionally unused)
const _foo = getValue()
```

## Manual Tool Usage

If you prefer running tools directly:

### yamllint

```bash
# Lint all YAML files
yamllint .

# Lint specific file
yamllint .github/workflows/lint.yml

# Auto-fix (limited support)
yamllint . --fix
```

### actionlint

```bash
# Lint all workflows
actionlint

# Lint specific workflow
actionlint .github/workflows/lint.yml

# Verbose output
actionlint -verbose
```

### markdownlint

```bash
# Lint all Markdown
markdownlint '**/*.md' --config .markdownlint.json

# Auto-fix
markdownlint '**/*.md' --config .markdownlint.json --fix

# Lint specific file
markdownlint README.md
```

### ESLint + Prettier (ai-triage)

```bash
cd ai-triage

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npx eslint src/**/*.ts --fix

# Check formatting
npx prettier --check '**/*.ts'

# Auto-format
npm run format
```

## IDE Integration

### VS Code

Install these extensions for real-time linting:

1. **YAML** (Red Hat) - YAML language support + validation
2. **GitHub Actions** (cschleiden) - Workflow syntax highlighting
3. **markdownlint** (David Anson) - Markdown linting
4. **ESLint** (Microsoft) - TypeScript/JavaScript linting
5. **Prettier** (Prettier) - Code formatting

Recommended `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  },
  "files.associations": {
    "*.yml": "yaml"
  }
}
```

### JetBrains IDEs (IntelliJ, WebStorm)

1. Enable yamllint: Settings → Tools → yamllint
2. Enable ESLint: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
3. Enable Prettier: Settings → Languages & Frameworks → JavaScript → Prettier

## Best Practices

1. **Run linters before committing**

   ```bash
   make lint
   ```

2. **Fix auto-fixable issues**

   ```bash
   make fix
   ```

3. **Use pre-commit hooks** - Catches issues early

   ```bash
   make pre-commit-install
   ```

4. **Check CI logs** - If local linting passes but CI fails, check for tool version differences

5. **Keep configuration files in sync** - Update `.yamllint`, `.markdownlint.json`, etc. as needed

6. **Document exceptions** - If you need to disable a rule, document why in code comments

## Updating Linters

### Update Pre-Commit Hooks

```bash
pre-commit autoupdate
```

### Update TypeScript Linters

```bash
cd ai-triage
npm update eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier
```

### Update GitHub Actions

Check `.github/workflows/lint.yml` for action versions and update as needed.

## Makefile Commands Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make install-lint-tools` | Install all linting tools |
| `make lint` | Run all linters |
| `make lint-yaml` | Lint YAML files only |
| `make lint-actions` | Lint GitHub Actions only |
| `make lint-markdown` | Lint Markdown files only |
| `make lint-ts` | Lint TypeScript code only |
| `make fix` | Auto-fix linting issues |
| `make pre-commit-install` | Install pre-commit hooks |
| `make pre-commit-run` | Run pre-commit on all files |
| `make clean` | Clean build artifacts |
| `make build-ai-triage` | Build ai-triage action |

## Resources

- [yamllint documentation](https://yamllint.readthedocs.io/)
- [actionlint repository](https://github.com/rhysd/actionlint)
- [markdownlint rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
- [ESLint rules](https://eslint.org/docs/latest/rules/)
- [Prettier options](https://prettier.io/docs/en/options.html)
- [pre-commit documentation](https://pre-commit.com/)
