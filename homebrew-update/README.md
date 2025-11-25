# Homebrew Auto-Update Action

Automatically update Homebrew formulas when your project is released. This action handles the
complete workflow of creating releases and updating your Homebrew tap.

## Features

- 🏷️ **Multiple Versioning Strategies**: Date-based, semver, or custom versions
- 📦 **Automated Releases**: Creates GitHub releases with tags automatically
- 🔐 **SHA256 Calculation**: Automatically calculates and updates formula checksums
- ✏️ **Formula Updates**: Updates version, URL, and SHA256 in your formula file
- 🚀 **Git Operations**: Commits and pushes changes to your tap repository
- 📝 **Customizable Release Notes**: Template-based release note generation

## Quick Start

### Minimal Example

```yaml
name: Update Homebrew Formula

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
  workflow_dispatch:

jobs:
  update-homebrew:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Required for version generation

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

## Prerequisites

### 1. Create a Homebrew Tap Repository

If you don't have one yet:

```bash
# Create a new repository named 'homebrew-<tap-name>'
# For example: homebrew-tools, homebrew-tap, etc.
```

### 2. Create a Formula File

Create a basic formula in your tap repository at `Formula/your-formula.rb`:

```ruby
class YourFormula < Formula
  desc "Your project description"
  homepage "https://github.com/your-username/your-project"
  url "https://github.com/your-username/your-project/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "abc123..." # Will be automatically updated
  version "1.0.0"     # Will be automatically updated

  def install
    # Your installation steps
    bin.install "your-binary"
  end

  test do
    system "#{bin}/your-binary", "--version"
  end
end
```

### 3. Set Up Repository Secrets

In your source repository, add these secrets:

1. **`TAP_REPO_TOKEN`**: Personal Access Token with `repo` scope
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Add as secret in your source repository

2. **`GITHUB_TOKEN`**: This is automatically provided by GitHub Actions (no setup needed)

## Configuration

### Inputs

| Input | Required | Default | Description |
| ----- | -------- | ------- | ----------- |
| `github_token` | Yes | `${{ github.token }}` | GitHub token for creating releases |
| `tap_repo_token` | Yes | - | Token with write access to tap repository |
| `github_user` | Yes | - | GitHub username or organization |
| `source_repo` | Yes | - | Source repository name |
| `tap_repo` | Yes | - | Tap repository name |
| `formula_name` | Yes | - | Formula name (without .rb) |
| `formula_path` | Yes | - | Path to formula file in tap repo |
| `version_strategy` | No | `date-commit` | Version generation strategy |
| `custom_version` | No | - | Custom version (when strategy is 'custom') |
| `release_notes_template` | No | - | Template for release notes |

### Outputs

| Output | Description |
| ------ | ----------- |
| `version` | Generated version string |
| `tag` | Git tag created |
| `release_url` | URL of the GitHub release |
| `formula_path` | Full path to updated formula |

## Versioning Strategies

### Date-Commit (Default)

Generates versions like `20231214.abc1234`:

```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    version_strategy: date-commit
    # Other inputs...
```

### Semver

Automatically increments patch version:

```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    version_strategy: semver
    # Other inputs...
```

If the latest tag is `v1.2.3`, the next version will be `v1.2.4`.

### Custom

Use a specific version:

```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    version_strategy: custom
    custom_version: 2.0.0-beta.1
    # Other inputs...
```

## Advanced Examples

### With Custom Release Notes

```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
    github_user: username
    source_repo: my-project
    tap_repo: homebrew-tools
    formula_name: my-formula
    formula_path: Formula/my-formula.rb
    release_notes_template: |
      ## Version {VERSION}
      
      Automated release built from commit {COMMIT_SHA}
      
      ### Changes
      - Latest updates as of {COMMIT_HASH}
```

### With Path Filters

Only trigger when specific files change:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'bin/**'
      - 'lib/**'
  workflow_dispatch:
```

### Multiple Formulas

Update multiple formulas from the same source:

```yaml
jobs:
  update-formula-1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: cajias/custom-github-actions/homebrew-update@main
        with:
          # ... inputs for formula 1

  update-formula-2:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: cajias/custom-github-actions/homebrew-update@main
        with:
          # ... inputs for formula 2
```

## How It Works

1. **Version Generation**: Creates a version based on your chosen strategy
2. **Tag Creation**: Creates and pushes a git tag to your source repository
3. **Release Creation**: Creates a GitHub release with the tag
4. **SHA256 Calculation**: Downloads the release tarball and calculates its SHA256
5. **Formula Checkout**: Clones your tap repository
6. **Formula Update**: Updates the version, URL, and SHA256 in your formula
7. **Commit & Push**: Commits and pushes the changes back to your tap

## Troubleshooting

### Tag Already Exists

If the tag already exists, the action will skip tag creation and continue with the release process.

### Permission Denied

Ensure your `TAP_REPO_TOKEN` has write access to the tap repository:

- The token needs `repo` scope
- The token owner must have write access to the tap repository

### SHA256 Mismatch

If users report checksum mismatches:

- Ensure the release is fully created before the SHA256 is calculated
- Wait a few seconds between release creation and formula update
- Verify the tarball URL is correct

### Formula Not Found

Check that:

- The `formula_path` is correct relative to the tap repository root
- The formula file exists in your tap repository
- The path uses forward slashes (even on Windows)

## Best Practices

1. **Use `fetch-depth: 0`**: Required for proper version generation with semver strategy
2. **Test Locally First**: Test your formula with `brew install --build-from-source`
3. **Pin Versions**: Use a specific version tag for the action in production
4. **Path Filters**: Use path filters to avoid unnecessary releases
5. **Manual Trigger**: Include `workflow_dispatch` for manual testing

## Real-World Example

See the implementation in the [cajias/zi](https://github.com/cajias/zi) repository:

- Source: `.github/workflows/update-homebrew-tap.yml`
- Tap: [cajias/homebrew-tools](https://github.com/cajias/homebrew-tools)
- Formula: `shell-settings.rb`

## Development

### Building the Action

```bash
cd homebrew-update
npm install
npm run all
```

This will:

1. Format code with Prettier
2. Lint with ESLint
3. Compile TypeScript
4. Package with ncc

### Testing Locally

Use [act](https://github.com/nektos/act) to test the action locally:

```bash
act -j update-homebrew
```

## Contributing

Contributions welcome! This action is part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT
