# Update Homebrew Formula Action

Automatically update Homebrew formulas when your project is released. This action creates GitHub releases and updates
your Homebrew tap repository with the new version, URL, and SHA256 hash.

## Features

- ✅ Multiple versioning strategies (date-based, semver, custom)
- ✅ Automatic GitHub release creation
- ✅ SHA256 calculation for release tarballs
- ✅ Automatic formula file updates
- ✅ Secure token handling
- ✅ Skip duplicate releases
- ✅ Customizable release notes

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

jobs:
  update-homebrew:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/update-homebrew@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
          github_user: your-username
          source_repo: your-project
          tap_repo: homebrew-tools
          formula_name: your-formula
          formula_path: Formula/your-formula.rb
```

### Advanced Example

```yaml
name: Update Homebrew Formula

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'lib/**'
  workflow_dispatch:

jobs:
  update-homebrew:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/update-homebrew@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
          github_user: your-username
          source_repo: your-project
          tap_repo: homebrew-tools
          formula_name: your-formula
          formula_path: Formula/your-formula.rb
          version_strategy: semver-tag
          custom_release_notes: |
            Release ${version}
            
            ## What's New
            - Latest updates from the main branch
            
            ## Installation
            ```bash
            brew tap your-username/tools
            brew install your-formula
            ```
          skip_if_exists: true
```

## Inputs

### Required Inputs

| Input | Description |
|-------|-------------|
| `github_token` | GitHub token with permissions for creating releases and tags. Default: `${{ github.token }}` |
| `tap_repo_token` | Token with write access to the Homebrew tap repository |
| `github_user` | GitHub username of the repository owner |
| `source_repo` | Repository containing the source code |
| `tap_repo` | Repository containing the Homebrew tap |
| `formula_name` | Name of the formula file to update |
| `formula_path` | Path to the formula file within the tap repository (e.g., `Formula/my-formula.rb`) |

### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `version_strategy` | How to generate the version: `date-commit`, `semver-tag`, or `custom` | `date-commit` |
| `custom_version` | Custom version string (only used when `version_strategy` is `custom`) | `''` |
| `custom_release_notes` | Custom release notes template | `''` |
| `skip_if_exists` | Skip release creation if version already exists | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The version that was created |
| `release_url` | URL of the created GitHub release |
| `formula_updated` | Whether the formula was successfully updated |

## Version Strategies

### Date-Commit (default)

Generates versions in the format `YYYY.MM.DD-shortsha`:

```yaml
version_strategy: date-commit
# Example output: 2024.01.15-a1b2c3d
```

### Semver-Tag

Uses semantic versioning based on existing tags. Increments the patch version:

```yaml
version_strategy: semver-tag
# If latest tag is v1.2.3, creates v1.2.4
# If no tags exist, starts with v1.0.0
```

### Custom

Use a custom version string:

```yaml
version_strategy: custom
custom_version: 2.1.0-beta
# Creates version: 2.1.0-beta
```

## Formula File Format

Your Homebrew formula file should have the following structure:

```ruby
class YourFormula < Formula
  desc "Description of your tool"
  homepage "https://github.com/your-username/your-project"
  url "https://github.com/your-username/your-project/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "abc123..."
  version "1.0.0"
  license "MIT"

  def install
    # Installation steps
  end

  test do
    # Test steps
  end
end
```

The action will automatically update the `url`, `sha256`, and `version` fields.

## Token Setup

### GitHub Token

The `github_token` input uses the default `${{ github.token }}` which has permissions to:

- Create releases
- Create tags
- Read repository content

### Tap Repository Token

The `tap_repo_token` requires a Personal Access Token (PAT) with:

- `repo` scope (full control of private repositories)
- Write access to the tap repository

**To create a PAT:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Homebrew Tap Update")
4. Select the `repo` scope
5. Click "Generate token"
6. Copy the token and add it to your source repository secrets as `TAP_REPO_TOKEN`

## Custom Release Notes

You can customize release notes using template variables:

```yaml
custom_release_notes: |
  Release ${version}
  
  ## Changes
  This release includes updates from commit ${commitSha}.
  
  ## Tag
  ${tag}
```

Available template variables:

- `${version}` - The version number (e.g., `1.0.0`)
- `${tag}` - The git tag (e.g., `v1.0.0`)
- `${commitSha}` - The full commit SHA

## Example Workflow with Path Filtering

```yaml
name: Update Homebrew Formula

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'lib/**'
      - 'cmd/**'
      - 'go.mod'
      - 'go.sum'

jobs:
  update-homebrew:
    runs-on: ubuntu-latest
    steps:
      - uses: cajias/custom-github-actions/update-homebrew@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
          github_user: ${{ github.repository_owner }}
          source_repo: ${{ github.event.repository.name }}
          tap_repo: homebrew-tools
          formula_name: my-tool
          formula_path: Formula/my-tool.rb
          version_strategy: date-commit
```

## Troubleshooting

### Formula File Not Found

**Error:** `Formula file not found: Formula/my-formula.rb`

**Solution:** Verify that:

1. The formula file exists in your tap repository
2. The `formula_path` input is correct
3. The `tap_repo_token` has access to the tap repository

### Release Already Exists

**Error:** `Release v1.0.0 already exists`

**Solution:** Either:

1. Set `skip_if_exists: true` to skip duplicate releases
2. Use a different `version_strategy`
3. Manually delete the existing release if it was created in error

### SHA256 Calculation Failed

**Error:** `Failed to calculate SHA256`

**Solution:** Ensure:

1. The release was created successfully
2. The `github_token` has permission to download release assets
3. The tarball URL is accessible

### Formula Update Failed

**Error:** `Failed to update formula`

**Solution:** Check that:

1. The `tap_repo_token` has write access to the tap repository
2. The formula file follows the expected format
3. The formula file is on the `main` branch

## Security Best Practices

1. **Never commit tokens to source code**
2. **Use repository secrets for all tokens**
3. **Use minimal token scopes** (only `repo` for tap_repo_token)
4. **Rotate tokens regularly**
5. **Use different tokens for different purposes**

## How It Works

1. **Version Generation:** Generates a version based on the configured strategy
2. **Release Creation:** Creates a GitHub release with the generated tag
3. **Tarball Download:** Downloads the release tarball
4. **SHA256 Calculation:** Calculates the SHA256 hash of the tarball
5. **Formula Update:** Updates the formula file with new version, URL, and SHA256
6. **Commit & Push:** Commits changes to the tap repository

## Contributing

Contributions welcome! This action is part of the [Agentic Applications](https://github.com/users/cajias/projects/4) project.

## License

MIT
