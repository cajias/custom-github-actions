# Testing Guide for AI Triage MCP Action

This document describes the integration test suite for the `ai-triage-mcp` action.

## Overview

The test suite validates that the AI triage action works correctly by:

1. Creating test issues with known content
2. Triggering the triage action
3. Verifying expected behavior (labels, comments, subtasks)
4. Automatically cleaning up test artifacts

## Test Workflow

The integration tests are defined in `.github/workflows/test-ai-triage-mcp.yml`.

### When Tests Run

- **Pull Requests**: Automatically on PRs that modify:
  - `ai-triage-mcp/**` (action code)
  - `.github/workflows/ai-triage-mcp-poc.yml` (POC workflow)
  - `.github/workflows/test-ai-triage-mcp.yml` (test workflow itself)

- **Schedule**: Weekly on Sundays at midnight UTC

- **Manual**: Via workflow dispatch (Actions tab → Select workflow → "Run workflow")

### Test Cases

#### 1. Basic Triage (`test-basic-triage`)

**Purpose**: Verify basic functionality of the triage action.

**Test Issue**:

```text
Title: [Test] Simple bug report
Body: This is a test bug. The application crashes on startup when clicking the submit button.
Label: automated-test
```

**Verifications**:

- ✅ Issue receives `type:*` label
- ✅ Issue receives `priority:*` label
- ✅ Triage comment is posted with:
  - Category
  - Priority
  - Complexity
  - Reasoning
- ✅ No subtasks created (simple issue)

#### 2. Subtask Creation (`test-subtask-creation`)

**Purpose**: Verify complex issues trigger subtask creation.

**Test Issue**:

```text
Title: [Test] Complex feature requiring multiple implementation steps
Body: We need to implement a new authentication system. This includes:
  1. Database schema updates for user credentials
  2. Backend API implementation for login/logout
  3. Frontend UI components for login form
  4. Integration tests for authentication flow
  5. Documentation updates for API endpoints
  6. Security audit and vulnerability testing
Label: automated-test
```

**Verifications**:

- ✅ Parent issue body contains "## Subtasks" section (if AI determines complexity warrants it)
- ✅ Subtask issues created with:
  - `subtask` label
  - `parent:X` label (where X is parent issue number)
  - `automated-test` label (for cleanup)
- ✅ Parent issue includes tasklist (`- [ ] #N`)

**Note**: The AI may decide that an issue doesn't need subtasks based on its analysis.
This is acceptable behavior - the test will pass with a warning in such cases.

#### 3. Error Handling (`test-error-handling`)

**Purpose**: Verify action handles edge cases gracefully.

**Test Issue**:

```text
Title: [Test] Issue with minimal content
Body: Test
Label: automated-test
```

**Verifications**:

- ✅ Action either:
  - Successfully triages and applies labels, OR
  - Fails gracefully with error comment
- ✅ No unhandled exceptions or crashes

#### 4. Cleanup (`cleanup-test-issues`)

**Purpose**: Remove all test artifacts after tests complete.

**Process**:

1. Lists all open issues with `automated-test` label
2. Deletes each issue
3. Runs even if tests fail (`if: always()`)

**Why Delete vs Close?**

We delete test issues rather than closing them to avoid cluttering the issue list.
Test issues are temporary artifacts, not historical records.

## Running Tests Manually

### From GitHub UI

1. Go to the **Actions** tab
2. Select **Integration Tests - AI Triage MCP** workflow
3. Click **Run workflow**
4. Optionally specify a branch to test
5. Click **Run workflow** button

### Using GitHub CLI

```bash
# Run tests on current branch
gh workflow run test-ai-triage-mcp.yml

# Run tests on specific branch
gh workflow run test-ai-triage-mcp.yml -f branch=feature/my-changes
```

### Watch test progress

```bash
gh run watch
```

## Test Labels

All test issues are labeled with `automated-test` to:

1. Identify them as test artifacts
2. Enable automatic cleanup
3. Filter them from production issue queries

**Important**: If you create test issues manually, always add the `automated-test` label
so they get cleaned up.

## Verifying Test Results

### Successful Test Run

When all tests pass, you'll see:

```text
✅ All tests passed successfully
```

In the **Test Summary** job.

### Failed Test Run

When tests fail, check the individual job logs:

- **test-basic-triage**: Basic triage functionality issues
- **test-subtask-creation**: Subtask creation problems
- **test-error-handling**: Error handling failures

Common failure reasons:

1. **Action changes broke functionality**: Review recent commits
2. **GitHub Models API rate limits**: Wait and retry
3. **Network issues**: Retry the workflow

## Debugging Failed Tests

### Check Test Issue State

If a test fails, you can examine the test issue before cleanup:

```bash
# List recent test issues
gh issue list --label automated-test --limit 20

# View specific test issue
gh issue view <issue-number>
```

### Check Workflow Logs

```bash
# List recent workflow runs
gh run list --workflow test-ai-triage-mcp.yml

# View specific run
gh run view <run-id>

# Download logs
gh run download <run-id>
```

### Manual Cleanup

If cleanup job fails, manually delete test issues:

```bash
# List test issues
gh issue list --label automated-test --json number --jq '.[].number'

# Delete all test issues
gh issue list --label automated-test --json number --jq '.[].number' | xargs -I {} gh issue delete {} --yes
```

## Test Isolation

Tests are isolated from production issues through:

1. **Labeling**: `automated-test` label distinguishes test issues
2. **Naming**: `[Test]` prefix in issue titles
3. **Automatic cleanup**: Test issues deleted after each run
4. **Separate workflow**: Tests don't interfere with production triage

## Adding New Tests

To add a new test case:

1. **Add a new job** in `.github/workflows/test-ai-triage-mcp.yml`:

```yaml
test-new-scenario:
  name: Test New Scenario
  runs-on: ubuntu-latest
  
  steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Create test issue
      # ... create issue with automated-test label
    
    - name: Trigger triage
      uses: ./ai-triage-mcp
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        issue-number: ${{ steps.create-issue.outputs.issue_number }}
    
    - name: Verify expected behavior
      # ... add verifications
```

1. **Update cleanup job** to include new test in `needs`:

```yaml
cleanup-test-issues:
  needs: [test-basic-triage, test-subtask-creation, test-error-handling, test-new-scenario]
```

1. **Update test summary** to include new test result.

1. **Document the test** in this file.

## Best Practices

### For Test Development

- **Always use `automated-test` label** on test issues
- **Use `[Test]` prefix** in issue titles
- **Keep test issues minimal** - focus on specific scenarios
- **Verify cleanup works** - don't leave test issues behind
- **Add descriptive names** to test jobs
- **Document expected behavior** in test steps

### For Test Maintenance

- **Run tests before merging** PRs that affect the action
- **Investigate failures promptly** - they indicate real issues
- **Update tests when behavior changes** - keep tests current
- **Review test coverage** - ensure major features are tested

## CI Integration

The test workflow is integrated into the CI pipeline:

1. **PR checks**: Tests run automatically on PRs
2. **Required status**: Can be set as required check for merging
3. **Weekly validation**: Ensures action continues working
4. **Manual testing**: Available for development and debugging

## Limitations

### Current Limitations

1. **AI non-determinism**: AI responses may vary, so tests use flexible assertions
2. **Timing dependencies**: Tests use sleep delays for workflow completion
3. **Rate limits**: GitHub Models API has usage limits
4. **No MCP testing**: Tests currently don't test with MCP enabled (requires PAT)

### Future Improvements

Potential enhancements:

- [ ] Add tests with MCP enabled (requires secure PAT handling)
- [ ] Add performance benchmarks (triage duration)
- [ ] Add tests for different AI models
- [ ] Add tests with different max-tokens settings
- [ ] Use workflow status API instead of sleep delays
- [ ] Add test fixtures directory with issue templates
- [ ] Add comparison tests (v1 vs v2 behavior)

## Troubleshooting

### Tests Pass Locally but Fail in CI

- Check GitHub Models API availability
- Verify permissions are correct
- Review rate limit status

### Cleanup Job Fails

- Manually delete test issues: `gh issue list --label automated-test`
- Check token permissions (needs `issues: write`)

### Test Issues Not Being Created

- Verify `GH_TOKEN` is set correctly
- Check repository permissions
- Ensure `automated-test` label exists (will be created if missing)

### Triage Not Completing

- Increase wait time in test steps
- Check ai-triage-mcp-poc.yml workflow is enabled
- Verify the action is being triggered correctly

## Support

For questions or issues with the test suite:

1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Open an issue with:
   - Test that failed
   - Error messages
   - Workflow run link
