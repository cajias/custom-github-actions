# Copilot Instructions for Custom GitHub Actions

This repository contains reusable GitHub Actions for the Agentic Applications ecosystem.

## Repository Structure

```
custom-github-actions/
├── ai-triage/              # AI-powered issue triage action
│   ├── src/                # TypeScript source code
│   ├── dist/               # Compiled JavaScript (committed)
│   ├── action.yml          # Action metadata
│   └── README.md           # Action documentation
├── docs/                   # Project documentation
│   ├── README.md
│   └── PROJECT_AUTOMATION.md
└── README.md               # Main repository documentation
```

## Development Workflow

### Building Actions

Each action is self-contained in its own directory. To build an action:

```bash
cd <action-name>
npm install
npm run all
```

The `npm run all` command performs:
1. Format code with Prettier
2. Lint with ESLint
3. Compile TypeScript
4. Package with ncc

### Individual Build Commands

```bash
npm run format  # Format code with Prettier
npm run lint    # Lint with ESLint
npm run build   # Compile TypeScript
npm run package # Package with ncc
npm test        # Run tests with Jest
```

## Coding Standards

### TypeScript
- All actions are written in **TypeScript**
- Use strict type checking (see `tsconfig.json`)
- Follow existing patterns in the codebase
- Compiled JavaScript is committed to the `dist/` directory

### Code Style
- **Prettier** for formatting (auto-formats on build)
- **ESLint** for linting with GitHub plugin
- Use clear, descriptive variable names
- Add comments for complex logic

### Action Structure

Each GitHub Action should have:
- `src/main.ts` - Entry point
- `action.yml` - Action metadata
- `README.md` - Documentation
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `dist/` - Compiled output (committed to repo)

## Dependencies

### Core Dependencies
- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub API client

### Dev Dependencies
- `typescript` - TypeScript compiler
- `@vercel/ncc` - Package bundler
- `eslint` - Linting
- `prettier` - Code formatting
- `@typescript-eslint/*` - TypeScript ESLint rules

## Testing

### Local Testing
Use [act](https://github.com/nektos/act) to test actions locally:

```bash
act -j <job-name>
```

### Test Coverage
When adding new features, include tests if the action has a test suite.

## Documentation

### Action Documentation
Each action's `README.md` should include:
- Quick start example
- Features list
- Input/output specifications
- Usage examples (minimal and advanced)
- Configuration details
- Development instructions

### Code Comments
- Add JSDoc comments for functions and methods
- Explain complex logic or non-obvious behavior
- Document API integrations and external dependencies

## GitHub Models Integration

The AI Triage action uses GitHub Models API:
- No external API keys required
- Uses built-in `GITHUB_TOKEN`
- Requires `models: read` permission
- Default model: `openai/gpt-4o`
- Available models documented in README

## Project V2 API

For actions that integrate with GitHub Projects:
- Use GraphQL API for project operations
- Handle optional project configuration gracefully
- Document project number location
- Include setup instructions in README

## Common Patterns

### Error Handling
```typescript
try {
  // Action logic
} catch (error) {
  core.setFailed(`Action failed: ${error.message}`)
}
```

### Input Handling
```typescript
const token = core.getInput('token', { required: true })
const optionalInput = core.getInput('optional-input') || 'default-value'
```

### Output Setting
```typescript
core.setOutput('output-name', outputValue)
```

## Making Changes

### Before Making Changes
1. Understand the action's purpose and existing behavior
2. Review the action's README and documentation
3. Check existing tests and test coverage
4. Review similar actions for patterns

### Code Changes Process
1. Make minimal, focused changes
2. Update TypeScript source in `src/`
3. Run `npm run all` to format, lint, build, and package
4. Update documentation if behavior changes
5. Test locally with `act` if possible
6. Commit both source and compiled `dist/` files

### Committing Compiled Code
- **Always commit `dist/` directory** - GitHub Actions run from compiled code
- Run `npm run package` before committing
- The `dist/index.js` file must be up-to-date

## Issue Triage Labels

The AI Triage action uses these label patterns:
- **Type:** `type:feature`, `type:bug`, `type:documentation`, etc.
- **Scope:** `scope:api`, `scope:ui`, `scope:testing`, etc.
- **Priority:** `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- **Size:** `size:xs`, `size:s`, `size:m`, `size:l`, `size:xl`
- **Status:** `status:ready-for-review`, `needs-triage`

## Best Practices

1. **Type Safety** - Leverage TypeScript's type system
2. **Error Messages** - Provide clear, actionable error messages
3. **Documentation** - Keep README up-to-date with code changes
4. **Minimal Changes** - Make focused, incremental changes
5. **Testing** - Test actions before committing
6. **Dependencies** - Only add dependencies when necessary
7. **Security** - Never commit secrets or API keys
8. **Compatibility** - Ensure actions work with latest GitHub Actions runner

## Resources

- [GitHub Actions Toolkit Documentation](https://github.com/actions/toolkit)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)

## Contributing

This repository is part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project. Contributions should align with the project's goals of creating AI-powered automation tools.
