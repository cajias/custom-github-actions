# Tech Debt Audit Action

Scheduled over-engineering audit for a repository. On each run the action:

1. Checks for an open issue with the audit label (default `tech-debt-audit`).
   If one exists, the previous audit has not been resolved yet and the run is
   skipped.
2. Otherwise installs the [ponytail plugin](https://github.com/DietrichGebert/ponytail)
   from its plugin marketplace and runs its `ponytail-audit` skill through
   GitHub Copilot CLI using a Claude model, scoped to the directory you pass
   via `path`.
3. Files an issue with the ranked findings — or creates nothing when the
   report says `Lean already. Ship.`

A new audit therefore only happens once the previous audit's issue is closed.
The skill is pulled from its marketplace at run time, so audits always use
the latest published version.

## Usage

```yaml
name: Tech debt audit

on:
  schedule:
    - cron: '0 6 * * 1' # Mondays 06:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: write
  copilot-requests: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: cajias/custom-github-actions/tech-debt-audit@main
        with:
          path: src
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `path` | `.` | Directory to audit, relative to the repository root |
| `copilot_token` | `github.token` | Token for Copilot CLI auth (see [Authentication](#authentication)) |
| `github_token` | `github.token` | Token for issue operations; needs `issues: write` |
| `issue_label` | `tech-debt-audit` | Label identifying audit issues; an open one skips the run |
| `model` | `claude-sonnet-4.6` | Copilot model to run the audit with |
| `skill_marketplace` | `DietrichGebert/ponytail` | OWNER/REPO of the plugin marketplace shipping the audit skill |
| `skill_plugin` | `ponytail@ponytail` | Plugin to install, as `PLUGIN@MARKETPLACE` |
| `skill_name` | `ponytail-audit` | Skill the audit prompt invokes |

## Outputs

| Output | Description |
| --- | --- |
| `skipped` | `true` when a previous audit issue is still open and the audit did not run |
| `issue_url` | URL of the created issue; empty when skipped or when there were no findings |

## Authentication

Copilot CLI needs a token with Copilot access. Two options:

- **Default — workflow `GITHUB_TOKEN`.** Declare `copilot-requests: write` in
  the workflow `permissions` block, as in the example above. Requires the
  "Copilot in GitHub Actions" policy to be enabled for the organization or
  repository. No secrets needed.
- **Fallback — personal access token.** Create a fine-grained PAT with the
  "Copilot Requests" permission, store it as a repository secret, and pass it
  as `copilot_token`. Use this when the org policy is disabled or when usage
  should be billed to a specific user's Copilot seat.

## Notes

- `actions/checkout` must run before this action — the audit reads the
  working tree.
- The gate and issue steps use the GitHub CLI (`gh`), preinstalled on
  GitHub-hosted runners. Self-hosted runners must have `gh` on the PATH.
- Copilot CLI plugin marketplaces are compatible with Claude Code plugin
  marketplaces, which is how the ponytail skill loads natively at run time.
- The Copilot agent's shell access is a read-only allowlist (`ls`, `find`,
  `grep`, `rg`, `cat`, `head`, `tail`, `wc`, `git` minus `git push`), with
  `gh` denied. The `write` tool is enabled without path restriction, so the
  agent may modify files in the workspace; it is instructed to write only the
  report file, but this is a prompt-level constraint rather than an enforced
  sandbox. Issue creation happens in a deterministic shell step afterward.
  This limits what a prompt injection hidden in audited files could do.
- Set `persist-credentials: false` on `actions/checkout` (as in the example):
  otherwise the workflow token is written into `.git/config`, where the
  audit agent could read it and leak it into the report, which becomes a
  public issue body.
- Each run consumes Copilot premium requests according to the selected
  model's multiplier.
