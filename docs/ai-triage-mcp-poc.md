# AI Triage POC - MCP + GitHub Script

This POC demonstrates a hybrid architecture for AI-powered issue triage using:
- **GitHub Models API** (GPT-4o) for AI inference
- **Model Context Protocol (MCP)** for read-only GitHub tools access
- **GitHub Script** for write operations (labels, comments, subtasks)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Get Issue Details (github-script)                        │
│     └─> Fetch issue via GitHub API                           │
│                                                               │
│  2. AI Analysis with MCP (actions/ai-inference@v1.2)         │
│     ├─> Connect to GitHub MCP Server                         │
│     │   └─> https://api.githubcopilot.com/mcp/               │
│     ├─> Provide GitHub read-only tools to GPT-4o             │
│     │   ├─> Search similar issues                            │
│     │   ├─> Review code                                      │
│     │   └─> Analyze patterns                                 │
│     ├─> Automatic ReAct loop (max 5 iterations)              │
│     └─> Return structured JSON                               │
│                                                               │
│  3. Validate AI Response (github-script)                     │
│     └─> Parse and validate JSON structure                    │
│                                                               │
│  4. Apply Labels (github-script)                             │
│     └─> Add labels via GitHub API                            │
│                                                               │
│  5. Create Subtasks (github-script)                          │
│     └─> Create linked issues via GitHub API                  │
│                                                               │
│  6. Add Triage Comment (github-script)                       │
│     └─> Post analysis summary                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### ✅ Advantages

1. **No Custom AI Code** - 500 lines of TypeScript replaced with YAML config
2. **Automatic Tool Use** - MCP provides ReAct loop out of the box
3. **Separation of Concerns**:
   - AI does analysis (non-deterministic)
   - GitHub Script does operations (deterministic)
4. **Read-Only MCP** - AI can search but not modify (safer)
5. **Maintainable** - Prompts in YAML, logic in Script, clear boundaries
6. **Cost Effective** - GPT-4o via GitHub Models (free tier available)

### ⚠️ Limitations

1. **PAT Required** - Cannot use `GITHUB_TOKEN` for MCP
2. **Read-Only MCP** - Write operations still need custom code
3. **Max 5 Tool Iterations** - Hardcoded in action (reasonable limit)
4. **JSON Parsing** - Requires careful prompt engineering for structured output

## Validated Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `enable-github-mcp` exists | ✅ | [action.yml:53](https://github.com/actions/ai-inference/blob/main/action.yml#L53) |
| Automatic tool use loop | ✅ | [inference.ts:85-142](https://github.com/actions/ai-inference/blob/main/src/inference.ts#L85) |
| GitHub Models supports tools | ✅ | [REST API docs](https://docs.github.com/en/rest/models/inference) |
| GPT-4o available | ✅ | Default model in action |
| MCP can write to GitHub | ❌ | Read-only mode only |

## Setup Instructions

### 1. Create Personal Access Token (PAT)

GitHub MCP requires a PAT with these permissions:
- `repo` - Full repository access
- `read:org` - Read organization data

**Steps:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` and `read:org` scopes
3. Copy the token

### 2. Add Secret to Repository

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `TRIAGE_PAT`
4. Value: Paste your PAT
5. Click "Add secret"

### 3. Deploy Workflow

The POC workflow is in:
```
.github/workflows/ai-triage-mcp-poc.yml
```

It will automatically run on:
- Issue opened
- Issue edited
- Manual trigger (workflow_dispatch)

### 4. Test the POC

**Option 1: Create a test issue**
```bash
gh issue create --title "Test Issue for AI Triage" --body "This is a test issue to validate the AI triage POC workflow"
```

**Option 2: Manually trigger workflow**
```bash
gh workflow run ai-triage-mcp-poc.yml --field issue_number=123
```

**Option 3: Use GitHub UI**
1. Go to Actions tab
2. Select "AI Triage POC - MCP + GitHub Script"
3. Click "Run workflow"
4. Enter issue number
5. Click "Run workflow"

## Prompt File (Optional)

For better prompt management, use the structured prompt file:
```
.github/prompts/triage.prompt.yml
```

To use it, update the workflow step:
```yaml
- name: AI Analysis with MCP
  uses: actions/ai-inference@v1.2
  with:
    model: openai/gpt-4o
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
    prompt-file: .github/prompts/triage.prompt.yml
    input: |
      issue_number: ${{ steps.issue.outputs.number }}
      issue_title: ${{ steps.issue.outputs.title }}
      issue_author: ${{ steps.issue.outputs.author }}
      issue_body: ${{ steps.issue.outputs.body }}
      repo_full_name: ${{ github.repository }}
      current_labels: ""
```

## Expected Output

When an issue is triaged, you'll see:

1. **Labels added** - Based on AI analysis
2. **Subtasks created** - As separate issues with `subtask` label
3. **Comment posted** with:
   - Category, priority, complexity
   - AI reasoning
   - Links to similar issues
   - Checklist of subtasks

**Example comment:**
```markdown
## AI Triage Analysis

**Category:** bug
**Priority:** high
**Complexity:** medium

**Reasoning:**
This appears to be a critical authentication bug affecting user login.
Similar issues (#123, #456) were resolved by updating the token validation
logic. The complexity is medium as it requires both backend and test changes.

**Similar Issues:** #123, #456

**Subtasks:**
- [ ] #789 Investigate root cause in authentication module
- [ ] #790 Implement fix and add regression tests

---
*Generated with [actions/ai-inference](https://github.com/actions/ai-inference) + GitHub MCP*
```

## Debugging

### Check Workflow Logs

1. Go to Actions tab
2. Select failed workflow run
3. Expand "AI Analysis with MCP" step
4. Look for MCP connection logs:
   ```
   Connecting to GitHub MCP server...
   Successfully connected to GitHub MCP server
   Retrieved 15 tools from GitHub MCP server
   ```

### Common Issues

**Issue:** "Failed to connect to GitHub MCP server"
- **Cause:** Invalid or missing PAT
- **Fix:** Check `TRIAGE_PAT` secret has correct permissions

**Issue:** "Validation failed: No JSON object found in response"
- **Cause:** AI didn't return valid JSON
- **Fix:** Update system prompt to emphasize JSON-only output

**Issue:** "Resource not accessible by integration"
- **Cause:** Missing workflow permissions
- **Fix:** Add required permissions to workflow YAML

**Issue:** "Rate limit exceeded"
- **Cause:** Too many AI inference calls
- **Fix:** GitHub Models has rate limits (check quotas)

## Migration Path

To migrate your existing `ai-triage` action to this architecture:

1. **Phase 1: POC Validation** (Current)
   - Deploy this POC alongside existing action
   - Test on non-critical repositories
   - Compare results with current implementation

2. **Phase 2: Feature Parity**
   - Add project field updates
   - Add repository-specific configurations
   - Add custom label mappings
   - Add support for multiple issue types

3. **Phase 3: Gradual Migration**
   - Update one repository at a time
   - Monitor for regressions
   - Gather user feedback

4. **Phase 4: Deprecation**
   - Archive old `ai-triage` action
   - Update documentation
   - Migrate all repositories

## Next Steps

1. ✅ **Validate POC** - Test on sample issues
2. ⬜ **Add Project Support** - Update project fields via GraphQL
3. ⬜ **Add Configuration** - Repository-specific triage rules
4. ⬜ **Improve Prompts** - Refine based on real results
5. ⬜ **Add Analytics** - Track triage accuracy
6. ⬜ **Production Deploy** - Migrate existing repositories

## Cost Analysis

**GitHub Models (Free Tier):**
- GPT-4o: 10 requests/min, 50 requests/day
- 8000 tokens in, 4000 tokens out per request

**Typical Triage:**
- ~1000 tokens input (issue + context)
- ~500 tokens output (JSON response)
- ~2-3 MCP tool calls per issue
- **Total: ~3 requests per triage**

**Capacity:** ~15 issues/day on free tier

For higher volume, consider:
- GitHub Copilot Pro+ (higher limits)
- Direct OpenAI API integration
- Batch processing during off-peak hours

## Comparison with Current Implementation

| Aspect | Current (TypeScript) | POC (MCP + Script) |
|--------|---------------------|-------------------|
| **Lines of Code** | ~500 | ~200 (mostly YAML) |
| **AI Integration** | Custom OpenAI SDK | actions/ai-inference |
| **Tool Use** | Manual | Automatic (MCP) |
| **Maintainability** | Complex | Simple |
| **Testing** | Unit + Integration | Workflow testing |
| **Extensibility** | Requires code changes | Update prompts/config |
| **Agentic Behavior** | Limited (single call) | ReAct loop (5 iterations) |
| **GitHub Integration** | Custom Octokit | GitHub Script |
| **Cost** | Direct API costs | GitHub Models (free tier) |

## References

- [actions/ai-inference](https://github.com/actions/ai-inference)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [actions/github-script](https://github.com/actions/github-script)

## Support

For issues with this POC:
1. Check workflow logs in Actions tab
2. Review [debugging section](#debugging) above
3. Open an issue in this repository

For issues with underlying tools:
- **actions/ai-inference**: https://github.com/actions/ai-inference/issues
- **GitHub Models**: https://docs.github.com/en/github-models
- **GitHub MCP**: https://github.com/github/github-mcp-server/issues
