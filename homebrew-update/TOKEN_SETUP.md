# Token Setup Guide for Homebrew Auto-Update Action

This guide explains how to set up the required GitHub tokens for the Homebrew Auto-Update action.

## Required Tokens

The action requires two tokens:

1. **`GITHUB_TOKEN`** - Automatically provided by GitHub Actions
2. **`TAP_REPO_TOKEN`** - Personal Access Token for your Homebrew tap repository

## Token Setup Instructions

### 1. GITHUB_TOKEN (No Setup Required)

The `GITHUB_TOKEN` is automatically provided by GitHub Actions and has permissions for:
- Creating releases
- Creating tags
- Reading repository contents

**Usage in workflow:**
```yaml
github_token: ${{ secrets.GITHUB_TOKEN }}
```

This token is automatically available and requires no manual setup.

### 2. TAP_REPO_TOKEN (Manual Setup Required)

You need to create a Personal Access Token (PAT) with write access to your Homebrew tap repository.

#### Step-by-Step Instructions:

**A. Create Personal Access Token**

1. Go to GitHub Settings → Developer settings → Personal access tokens
   - Direct link: https://github.com/settings/tokens

2. Click "Generate new token" → "Generate new token (classic)"

3. Configure the token:
   - **Name**: `Homebrew Tap Update Token` (or any descriptive name)
   - **Expiration**: Choose appropriate expiration (90 days, 1 year, or no expiration)
   - **Scopes**: Select `repo` (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

4. Click "Generate token"

5. **Important**: Copy the token immediately (it won't be shown again)

**B. Add Token to Source Repository Secrets**

1. Go to your **source repository** (the one that will trigger updates)
   - Example: `https://github.com/your-username/your-project`

2. Navigate to Settings → Secrets and variables → Actions

3. Click "New repository secret"

4. Configure the secret:
   - **Name**: `TAP_REPO_TOKEN`
   - **Value**: Paste the token you generated in step A

5. Click "Add secret"

**C. Verify Token in Workflow**

Use the token in your workflow:
```yaml
- uses: cajias/custom-github-actions/homebrew-update@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}  # Your custom token
    # ... other inputs
```

## Token Permissions

### GITHUB_TOKEN Permissions

The default `GITHUB_TOKEN` needs these permissions (automatically granted):
- `contents: write` - For creating releases and tags
- `packages: read` - For reading repository packages

If using GitHub's fine-grained tokens, ensure these permissions are enabled.

### TAP_REPO_TOKEN Permissions

The Personal Access Token needs:
- `repo` scope - Full control of the tap repository
  - Required for: pushing commits, updating files, managing branches

## Security Best Practices

### Token Security

1. **Never Commit Tokens**: Never commit tokens directly in code or workflows
2. **Use Secrets**: Always use GitHub Secrets for tokens
3. **Least Privilege**: Use tokens with minimum required permissions
4. **Expiration**: Set appropriate expiration dates for tokens
5. **Rotation**: Regularly rotate tokens (every 90 days recommended)

### Token Rotation

When rotating tokens:

1. Generate a new token with the same permissions
2. Update the `TAP_REPO_TOKEN` secret in your repository
3. Delete the old token from GitHub settings
4. Test the workflow to ensure it works with the new token

### Multiple Repositories

If you have multiple source repositories updating the same tap:

**Option 1: Organization Secret**
- If repositories are in the same organization
- Set the token as an organization secret
- All repositories can use it

**Option 2: Individual Secrets**
- Set the token separately in each repository
- More granular control
- Easier to revoke access for individual repos

## Troubleshooting

### Error: "Resource not accessible by personal access token"

**Cause**: The token doesn't have the `repo` scope

**Solution**: Regenerate the token with `repo` scope selected

### Error: "Bad credentials"

**Cause**: Token is expired, revoked, or incorrectly copied

**Solutions**:
1. Check if token is still valid in GitHub settings
2. Regenerate token if expired
3. Verify the token was copied correctly (no extra spaces)
4. Update the secret with the new token

### Error: "refusing to allow a Personal Access Token to create or update workflow"

**Cause**: Trying to modify `.github/workflows/` with a PAT

**Solution**: This is expected behavior. The action only modifies formula files, not workflows.

### Workflow Not Triggering

**Cause**: Missing or incorrect token configuration

**Solutions**:
1. Verify `TAP_REPO_TOKEN` exists in repository secrets
2. Check token hasn't expired
3. Ensure token has correct permissions
4. Test with a manual workflow dispatch

## Validation Script

You can validate your token setup with this script:

```bash
#!/bin/bash
# validate-token.sh
# Run this locally to test your token

TOKEN="your-token-here"
TAP_REPO="your-username/homebrew-tools"

echo "Testing token access to $TAP_REPO..."

# Test read access
curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$TAP_REPO" | \
  jq -r '.name // "❌ Failed to access repository"'

# Test if token has push permission
curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$TAP_REPO/collaborators/$(gh api user -q .login)/permission" | \
  jq -r '.permission // "❌ No permission found"'

echo ""
echo "If you see the repository name and 'admin' or 'write', the token is configured correctly!"
```

## Advanced: Fine-Grained Personal Access Tokens

GitHub's new fine-grained tokens provide more granular control:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens

2. Click "Generate new token"

3. Configure:
   - **Token name**: Descriptive name
   - **Expiration**: Choose expiration
   - **Repository access**: Select "Only select repositories"
     - Choose your Homebrew tap repository
   - **Repository permissions**:
     - Contents: Read and write
     - Metadata: Read-only (automatically selected)

4. Generate and add to secrets as before

## Reference Links

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Token Permissions](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps)

## Getting Help

If you encounter issues with token setup:

1. Check this guide's troubleshooting section
2. Verify token permissions in GitHub settings
3. Test token with the validation script
4. Review GitHub Actions logs for specific error messages
5. Open an issue in the [custom-github-actions repository](https://github.com/cajias/custom-github-actions/issues)

## Example: Complete Setup

Here's a complete example of setting up tokens for a project:

**Project**: `myuser/mycli`  
**Tap**: `myuser/homebrew-tools`  
**Formula**: `mycli.rb`

1. Create PAT with `repo` scope
2. Add as secret `TAP_REPO_TOKEN` in `myuser/mycli`
3. Create workflow in `myuser/mycli/.github/workflows/update-homebrew.yml`:

```yaml
name: Update Homebrew
on:
  push:
    branches: [main]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: cajias/custom-github-actions/homebrew-update@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}
          github_user: myuser
          source_repo: mycli
          tap_repo: homebrew-tools
          formula_name: mycli
          formula_path: Formula/mycli.rb
```

That's it! Push to main and the workflow will automatically update your formula.
