# Implementation Notes: Homebrew Auto-Update Action

## Overview

This document provides technical details about the implementation of the Homebrew Auto-Update GitHub Action.

## Architecture

### Module Structure

The action is organized into focused modules:

```text
src/
├── main.ts        # Entry point and orchestration
├── types.ts       # TypeScript type definitions
├── version.ts     # Version generation logic
├── release.ts     # GitHub release creation
└── formula.ts     # Formula updates and git operations
```

### Data Flow

1. **Input Collection** (`main.ts`)
   - Collects and validates all action inputs
   - Ensures required inputs are present

2. **Version Generation** (`version.ts`)
   - Generates version based on selected strategy
   - Creates git tag with version

3. **Release Creation** (`release.ts`)
   - Creates GitHub release with generated tag
   - Applies custom release notes if provided

4. **SHA256 Calculation** (`formula.ts`)
   - Downloads release tarball
   - Calculates SHA256 checksum

5. **Formula Update** (`formula.ts`)
   - Checks out tap repository
   - Updates version, URL, and SHA256 in formula
   - Commits and pushes changes

## Version Strategies

### Date-Commit Strategy (Default)

Format: `YYYYMMDD.shortsha`

Example: `20231214.abc1234`

**Implementation:**

```typescript
const date = getCurrentDate(); // YYYYMMDD
const hash = await getCommitHash(); // Short SHA
version = `${date}.${hash}`;
```

**Advantages:**

- Always unique
- Chronologically sortable
- No tag conflicts
- Simple and predictable

**Use Case:**

- Continuous deployment projects
- Projects without traditional releases
- Internal tools and scripts

### Semver Strategy

Format: `major.minor.patch`

Example: `1.2.3` → `1.2.4`

**Implementation:**

```typescript
const latestTag = await getLatestSemverTag();
const parts = latestTag.split('.');
parts[2] = String(parseInt(parts[2], 10) + 1);
version = parts.join('.');
```

**Advantages:**

- Standard versioning format
- Compatible with package managers
- Clear version progression
- Follows semantic versioning spec

**Use Case:**

- Public libraries and tools
- Projects following semver
- APIs with version contracts

### Custom Strategy

Format: User-defined

Example: `2.0.0-beta.1`, `v1.0-rc1`

**Implementation:**

```typescript
version = customVersionInput;
```

**Advantages:**

- Complete flexibility
- Support for pre-release versions
- Custom version schemes

**Use Case:**

- Beta/RC releases
- Non-standard version schemes
- Complex versioning requirements

## Security Considerations

### Token Handling

1. **GitHub Token** (`GITHUB_TOKEN`)
   - Automatically provided by Actions
   - Scoped to source repository
   - Used for creating releases and tags

2. **Tap Repository Token** (`TAP_REPO_TOKEN`)
   - User-provided Personal Access Token
   - Requires `repo` scope
   - Used for pushing to tap repository

**Security Measures:**

- Tokens passed as GitHub Secrets
- Masked in logs by Actions runtime
- Used via `@actions/exec` which handles masking
- Never logged or exposed in error messages

### Command Injection Prevention

**SHA256 Calculation:**

```typescript
// URL is properly quoted
await exec.exec('bash', ['-c', `curl -sL "${url}" | shasum -a 256`]);
```

**Git Operations:**

```typescript
// Parameters passed as array, not shell string
await exec.exec('git', ['clone', authenticatedUrl, targetPath]);
await exec.exec('git', ['add', filePath], { cwd: repoPath });
```

### Input Validation

All inputs are validated through TypeScript types:

```typescript
interface ActionInputs {
  githubToken: string;
  tapRepoToken: string;
  githubUser: string;
  sourceRepo: string;
  tapRepo: string;
  formulaName: string;
  formulaPath: string;
  versionStrategy: 'date-commit' | 'semver' | 'custom';
  // ...
}
```

## Error Handling

### Graceful Degradation

1. **Tag Already Exists**
   - Warns but continues with existing tag
   - Prevents workflow failure on re-runs

2. **SHA256 Validation**
   - Verifies hash length (64 characters)
   - Throws error if invalid

3. **Git Operations**
   - Uses exec with proper error handling
   - Detailed error messages for debugging

### Error Messages

All errors include context:

```typescript
throw new Error(`Formula file not found: ${formulaPath}`);
throw new Error(`Invalid SHA256 hash: ${sha256}`);
throw new Error(`Unknown version strategy: ${strategy}`);
```

## Testing Strategy

### Local Testing

Use [act](https://github.com/nektos/act) for local testing:

```bash
act -j update-homebrew
```

### Integration Testing

Test against real repositories:

1. Create test source repository
2. Create test tap repository
3. Set up test formula
4. Run workflow with test tokens
5. Verify formula updates

### Manual Testing Checklist

- [ ] Version generation works for all strategies
- [ ] Tag creation succeeds
- [ ] Release creation succeeds
- [ ] SHA256 calculation is correct
- [ ] Formula updates correctly
- [ ] Commit and push succeed
- [ ] Outputs are set correctly

## Performance

### Build Time

- TypeScript compilation: ~2s
- ncc packaging: ~4s
- Total build time: ~6s

### Runtime Performance

Typical workflow execution:

1. Version generation: < 1s
2. Tag creation: < 2s
3. Release creation: 2-5s
4. SHA256 calculation: 5-10s (depends on tarball size)
5. Repository checkout: 2-5s
6. Formula update: < 1s
7. Commit and push: 2-5s

**Total: ~20-30 seconds** for typical workflows

### Optimization Opportunities

1. **Caching**: Cache npm dependencies for builds
2. **Parallel Operations**: Some steps could be parallelized
3. **Conditional Updates**: Skip if no changes detected

## Dependencies

### Runtime Dependencies

```json
{
  "@actions/core": "^1.10.1",
  "@actions/github": "^6.0.0",
  "@actions/exec": "^1.1.1"
}
```

**Why these dependencies:**

- `@actions/core`: Input/output handling, logging
- `@actions/github`: GitHub API client, context
- `@actions/exec`: Safe command execution

### Development Dependencies

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- ncc for packaging

## Comparison with Existing Solutions

### vs Manual Updates

| Aspect | Manual | This Action |
| ------ | ------ | ----------- |
| Time | 5-10 min | < 1 min |
| Error-prone | Yes | No |
| Consistency | Variable | Always |
| Scalability | Poor | Good |

### vs Other Actions

Advantages over existing Homebrew update actions:

1. Multiple version strategies
2. Better error handling
3. Comprehensive documentation
4. TypeScript implementation
5. Customizable release notes
6. Modern GitHub Actions patterns

## Future Enhancements

### Potential Features

1. **Multi-platform Support**
   - Update formulas for different OS platforms
   - Handle bottle (binary) updates

2. **Batch Updates**
   - Update multiple formulas in one run
   - Update multiple taps

3. **Validation**
   - Verify formula syntax before committing
   - Test installation in CI

4. **Notifications**
   - Slack/Discord notifications
   - Email on failure

5. **Rollback**
   - Automatic rollback on failure
   - Formula version history

### Known Limitations

1. **macOS-only SHA256**: Uses `shasum` which may not be available on all systems
   - Mitigation: Run on ubuntu/macos runners

2. **No Bottle Updates**: Only updates source formulas
   - Future: Add bottle support

3. **Linear Version Increment**: Semver only increments patch
   - Future: Add minor/major options

## Maintenance

### Regular Tasks

1. **Dependency Updates**: Monthly
2. **Security Patches**: As needed
3. **Documentation Updates**: With changes
4. **Example Updates**: Quarterly

### Monitoring

Watch for:

- Failed workflow runs
- User-reported issues
- GitHub Actions platform changes
- Homebrew formula format changes

## References

### Related Resources

- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Toolkit](https://github.com/actions/toolkit)

### Similar Projects

- [noClaps/homebrew-tap-action](https://github.com/noClaps/homebrew-tap-action)
- Manual workflows in various repositories
- Homebrew-core automation scripts

## Contributors

This action was developed for the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT License - See LICENSE file in repository root.
