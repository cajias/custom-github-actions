# Documentation

Comprehensive guides for using and configuring Custom GitHub Actions.

## Guides

### [Project Automation Setup](./PROJECT_AUTOMATION.md)

Learn how to configure GitHub Project automation to work with the AI Triage action:

- ✅ Auto-trigger re-triage when issues move to Backlog
- ✅ Set up required project fields and labels
- ✅ Test and troubleshoot your setup
- ✅ Advanced scheduling and custom triggers

**Quick Link:** For automatic re-triage on backlog status changes, see the [Project Automation Setup](./PROJECT_AUTOMATION.md).

## Action Documentation

- [AI Issue Triage](../ai-triage/README.md) - Complete action documentation

## Quick References

### Required Permissions

```yaml
permissions:
  contents: read
  issues: write
  models: read
```

### Default Workflow Triggers

The action includes built-in trigger logic. No `if` conditions needed! The action automatically runs when:

- Issue is opened
- `needs-triage` label is added
- `triage:backlog` label is added

### Required Labels

| Label | Purpose |
|-------|---------|
| `needs-triage` | Triggers AI triage workflow |
| `triage:backlog` | Alternative trigger for backlog items |
| `status:ready-for-review` | Auto-applied when issue is agent-ready |

### Required Project Fields

| Field | Type | Options |
|-------|------|---------|
| Status | Single Select | Backlog, Ready, In progress, In review, Done |
| Priority | Single Select | P0, P1, P2 |
| Size | Single Select | XS, S, M, L, XL |

## Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Contributing

Found an issue or have a suggestion?

- [Open an issue](https://github.com/cajias/custom-github-actions/issues)
- [Submit a pull request](https://github.com/cajias/custom-github-actions/pulls)
- Part of the [Agentic Applications project](https://github.com/users/cajias/projects/4)
