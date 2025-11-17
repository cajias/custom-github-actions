# Quick Start Guide: Copilot Subtask Manager

Get started with automated Copilot subtask assignments in 5 minutes.

## Step 1: Create the Workflow (2 minutes)

Create `.github/workflows/copilot-subtask-manager.yml` in your repository:

```yaml
name: Copilot Subtask Manager

on:
  issues:
    types: [assigned]
  pull_request:
    types: [closed]

permissions:
  contents: read
  issues: write
  pull-requests: read

jobs:
  manage-subtasks:
    runs-on: ubuntu-latest
    steps:
      - name: Manage Copilot Subtasks
        uses: cajias/custom-github-actions/copilot-subtask-manager@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**That's it!** The basic setup is complete.

## Step 2: Create a Parent Issue (1 minute)

Create a new parent issue (let's say it becomes #100):

```markdown
## Feature: User Authentication

Implement user authentication system with the following components:

- Database schema
- Backend API
- Frontend UI
- Integration tests
```

## Step 3: Create Subtask Issues (2 minutes)

Create each subtask as a separate issue with the `parent:100` label:

### Issue #101: Database schema for users

```markdown
Title: Database schema for users
Labels: parent:100

Create the database schema for the user authentication system.

Tables needed:

- users (id, email, password_hash, created_at)
- sessions (id, user_id, token, expires_at)
```

### Issue #102: Backend authentication API

```markdown
Title: Backend authentication API
Labels: parent:100

Implement REST API endpoints for authentication.

Endpoints:

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

**Dependencies:**
Depends on #101
```

### Issue #103: Frontend login UI

```markdown
Title: Frontend login UI
Labels: parent:100

Create React components for login and registration.

Components:

- LoginForm
- RegisterForm
- AuthProvider
```

### Issue #104: Integration tests

```markdown
Title: Integration tests
Labels: parent:100

Write end-to-end tests for authentication workflows.

**Dependencies:**
Requires #102, #103
```

## Step 4: Assign Copilot to Parent (30 seconds)

1. Go to the parent issue
2. Click "Assignees" on the right sidebar
3. Search for `copilot-swe-agent`
4. Click to assign

## Step 5: Approve Workflow (30 seconds)

⚠️ **Important**: GitHub requires manual approval for bot-triggered workflows.

1. Go to the "Actions" tab in your repository
2. You'll see a workflow run waiting for approval
3. Click "Approve and run workflows"

## What Happens Next?

The Copilot Subtask Manager will:

1. ✅ **Immediately assign** Copilot to #101 and #103 (no dependencies)
2. ⏸️ **Block** #102 and #104 (have dependencies)
3. 💬 **Post a comment** on the parent issue showing the status

When #101's PR is merged:

- ✅ Copilot is **auto-assigned** to #102

When #103's PR is merged:

- ⏸️ #104 is still blocked (needs #102)

When #102's PR is merged:

- ✅ Copilot is **auto-assigned** to #104

## Expected Timeline

**Without automation:** 2+ hours of manual tracking

- Create parent issue
- Wait for #101 to complete (~30 min)
- Manually assign Copilot to #102
- Wait for #103 to complete (~30 min)
- Wait for #102 to complete (~30 min)
- Manually assign Copilot to #104
- Wait for #104 to complete (~30 min)

**With automation:** ~2 hours, but fully automated

- Create parent issue and subtasks (5 min)
- Assign Copilot to parent (30 sec)
- Everything else happens automatically! ✨

## Tips for Success

### ✅ Do's

- **Add `parent:{number}` label** to all subtasks
- **Create all subtasks first** before assigning Copilot
- **Specify dependencies clearly** using "Depends on #123" or "Requires #123" in subtask bodies
- **Use "Closes #123"** in PR descriptions to link PRs to subtasks
- **Keep dependencies simple** when possible

### ❌ Don'ts

- Don't assign Copilot to individual subtasks (assign to parent instead)
- Don't create circular dependencies (A depends on B, B depends on A)
- Don't forget to approve workflows when triggered by bots
- Don't delete the parent issue while subtasks are in progress

## Troubleshooting

### Workflow doesn't run after Copilot assignment?

**Solution**: Go to Actions tab and click "Approve and run workflows"

### No subtasks were assigned?

**Check**:

- Subtasks have `parent:{number}` label matching the parent issue number
- Subtasks exist and are open
- Subtasks don't all have dependencies

## Next Steps

- Read the [full README](./README.md) for advanced features
- Explore [dependency specification methods](./README.md#dependency-specification)
- Check out [usage examples](./README.md#usage-example)

## Get Help

- Open an issue in the [repository](https://github.com/cajias/custom-github-actions)
- Check existing [issues](https://github.com/cajias/custom-github-actions/issues) for similar problems

---

**Happy automating!** 🤖✨
