# Token Setup Guide for Homebrew Auto-Update Action

This guide explains how to set up the required tokens for the Homebrew Auto-Update GitHub Action.

## Required Tokens

The action requires two tokens:

1. **GitHub Token** (`github_token`) - For creating releases and tags in the source repository
2. **Tap Repository Token** (`tap_repo_token`) - For updating the Homebrew tap repository

## GitHub Token Setup

The `github_token` uses the built-in `${{ secrets.GITHUB_TOKEN }}` or `${{ github.token }}` which is automatically
provided by GitHub Actions.

### Permissions Required

The default GitHub token has the following permissions by default:

- Read repository content
- Create releases
- Create tags

### Configuration

In your workflow file, you can use the default token:

```yaml
github_token: ${{ secrets.GITHUB_TOKEN }}
```

Or explicitly reference it:

```yaml
github_token: ${{ github.token }}
```

## Tap Repository Token Setup

The `tap_repo_token` requires a Personal Access Token (PAT) with write access to your Homebrew tap repository.

### Step 1: Create a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Homebrew Tap Update - my-project")
4. Set an expiration (recommended: 90 days, then rotate)
5. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

6. Click **"Generate token"**
7. **Copy the token immediately** - you won't be able to see it again!

### Step 2: Add Token to Repository Secrets

1. Go to your **source repository** (the repo that triggers the action)
2. Navigate to Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Name: `TAP_REPO_TOKEN`
5. Value: Paste the Personal Access Token you created
6. Click **"Add secret"**

### Step 3: Use Token in Workflow

In your workflow file:

```yaml
- uses: cajias/custom-github-actions/update-homebrew@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tap_repo_token: ${{ secrets.TAP_REPO_TOKEN }}  # The secret you just created
    # ... other inputs
```

## Token Validation Checklist

Before running the action, verify:

- [ ] `github_token` has permissions to create releases and tags in the source repository
- [ ] `tap_repo_token` has write access to the tap repository
- [ ] Both tokens are correctly configured as repository secrets
- [ ] Workflow file references the correct secret names

## Token Security Best Practices

### 1. Use Minimal Scopes

Only grant the minimum permissions needed:

- For `tap_repo_token`: Only the `repo` scope is required
- For `github_token`: Use the default token (automatically scoped)

### 2. Rotate Tokens Regularly

- Set token expiration when creating PATs (recommended: 90 days)
- Create calendar reminders to rotate tokens before expiration
- Keep a secure record of when tokens need rotation

### 3. Use Separate Tokens

- Create different PATs for different purposes
- Don't reuse tokens across multiple projects
- This limits the impact if a token is compromised

### 4. Monitor Token Usage

- Review GitHub's audit logs regularly
- Check for unexpected token usage
- Revoke tokens immediately if suspicious activity is detected

### 5. Organization-Level Tokens

For organization repositories, consider using:

- GitHub Apps instead of PATs (more secure)
- Fine-grained PATs (when available) for better scope control

## Troubleshooting

### Token Validation Failed

**Error:** `Bad credentials` or `Resource not accessible by token`

**Solutions:**

1. Verify the token is correct and hasn't expired
2. Check that the token has the `repo` scope
3. Ensure the token has access to the tap repository
4. Try regenerating the token

### Token Expired

**Error:** `Token expired`

**Solutions:**

1. Create a new Personal Access Token following the steps above
2. Update the `TAP_REPO_TOKEN` secret with the new token
3. Consider using longer expiration periods (up to 1 year)

### Permission Denied

**Error:** `Permission denied` or `403 Forbidden`

**Solutions:**

1. Verify the token owner has write access to the tap repository
2. Check organization settings for token restrictions
3. Ensure the repository isn't archived or read-only

## Automated Token Setup (Future Enhancement)

Future versions of this action may include:

- Token validation before running
- Automatic token scope verification
- Helpful error messages for token issues
- Setup wizard for first-time configuration

## Additional Resources

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Token Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

## Support

If you encounter token-related issues:

1. Check this guide's troubleshooting section
2. Review the main [README](./README.md) for action-specific issues
3. Open an issue in the repository with details (never include actual tokens!)
