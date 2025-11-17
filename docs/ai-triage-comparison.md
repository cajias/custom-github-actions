# AI Triage Action Comparison: v1 vs v2

This document compares the two AI triage action implementations available in this repository.

## Quick Comparison

| Aspect | v1 (TypeScript) | v2 (MCP + Script) |
|--------|-----------------|-------------------|
| **Path** | `ai-triage/` | `ai-triage-mcp/` |
| **Implementation** | TypeScript + Node.js | YAML + Composite Action |
| **Lines of Code** | ~500 TypeScript | ~200 YAML |
| **AI Integration** | Custom OpenAI SDK | actions/ai-inference |
| **Tool Use** | Manual/Limited | Automatic (MCP) |
| **Agentic Behavior** | Single call | ReAct loop (5 iterations) |
| **Maintainability** | Complex | Simple |
| **Extensibility** | Requires code changes | Update prompts/config |
| **Testing** | Unit + Integration | Workflow testing |
| **GitHub Integration** | Custom Octokit | GitHub Script |
| **AI Providers** | GitHub Models, Anthropic, OpenAI | GitHub Models |
| **Project Support** | ✅ GitHub Projects V2 | ❌ Coming soon |
| **Cost** | Direct API costs | GitHub Models (free tier) |
| **Setup Complexity** | Medium (API keys) | Low (optional MCP) |

## When to Use v1 (TypeScript)

Choose `ai-triage` if you need:

- ✅ **GitHub Projects V2 integration** - Automatic project field updates
- ✅ **Multiple AI providers** - Anthropic (Claude), OpenAI (GPT), GitHub Models
- ✅ **TypeScript-based actions** - Prefer compiled, type-safe code
- ✅ **Direct API integration** - Need fine-grained control over AI calls
- ✅ **Custom enhancements** - Automatic issue description enhancement
- ✅ **Clarifying questions** - Posts questions when details are missing
- ✅ **Proven stability** - Production-tested implementation

### Usage Example (v1)

```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    model: claude-3-5-sonnet-20241022
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    project-owner: your-username
    project-number: 4
```

## When to Use v2 (MCP + Script)

Choose `ai-triage-mcp` if you want:

- ✅ **Simpler maintenance** - YAML-based configuration, no build step
- ✅ **Automatic tool use** - MCP provides ReAct loop with GitHub tools
- ✅ **Better separation** - AI for analysis, GitHub Script for operations
- ✅ **Free tier option** - Works with GitHub Models API (no API key needed)
- ✅ **Native sub-issues** - Creates proper parent-child relationships
- ✅ **Less code** - 60% less code to maintain
- ✅ **Latest architecture** - Modern agentic approach with tool loops

### Usage Example (v2)

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

## Feature Comparison

### Labels and Classification

| Feature | v1 | v2 |
|---------|----|----|
| Type labels | ✅ | ✅ |
| Priority labels | ✅ | ✅ |
| Scope labels | ✅ | ✅ |
| Custom labels | ✅ | ✅ |
| Size estimation | ✅ | ❌ |

### Issue Enhancement

| Feature | v1 | v2 |
|---------|----|----|
| Description enhancement | ✅ | ❌ |
| Clarifying questions | ✅ | ❌ |
| Triage comment | ✅ | ✅ |
| Similar issues search | Limited | ✅ (via MCP) |
| Code analysis | Limited | ✅ (via MCP) |

### Subtask Management

| Feature | v1 | v2 |
|---------|----|----|
| Create subtasks | ✅ | ✅ |
| Native sub-issues | ❌ | ✅ |
| Tasklist in parent | ❌ | ✅ |
| Subtask labels | ✅ | ✅ |
| Parent linking | ✅ | ✅ |

### Project Integration

| Feature | v1 | v2 |
|---------|----|----|
| Projects V2 support | ✅ | ❌ (planned) |
| Field updates | ✅ | ❌ (planned) |
| Status changes | ✅ | ❌ (planned) |

### AI Capabilities

| Feature | v1 | v2 |
|---------|----|----|
| Single analysis | ✅ | ✅ |
| Multi-step reasoning | Limited | ✅ (ReAct loop) |
| Tool use | Manual | Automatic (MCP) |
| Context gathering | Limited | ✅ (via MCP) |
| Max iterations | 1 | 5 |

## Architecture Comparison

### v1 (TypeScript) Architecture

```text
┌─────────────────────────────────────────┐
│         TypeScript Action               │
├─────────────────────────────────────────┤
│                                          │
│  1. Validate Inputs                     │
│  2. Detect AI Provider                  │
│  3. Single AI Call                      │
│     ├─> OpenAI SDK                      │
│     ├─> Anthropic SDK                   │
│     └─> GitHub Models API               │
│  4. Parse Response                      │
│  5. Apply Labels (Octokit)              │
│  6. Update Projects (GraphQL)           │
│  7. Enhance Description (Octokit)       │
│  8. Post Comment (Octokit)              │
│                                          │
└─────────────────────────────────────────┘
```

### v2 (MCP + Script) Architecture

```text
┌─────────────────────────────────────────┐
│       Composite Action (YAML)           │
├─────────────────────────────────────────┤
│                                          │
│  1. Get Issue Details                   │
│     └─> GitHub Script                   │
│  2. AI Analysis with MCP                │
│     ├─> actions/ai-inference            │
│     ├─> GitHub MCP Server (optional)    │
│     ├─> ReAct Loop (max 5 iterations)   │
│     └─> Returns JSON                    │
│  3. Validate Response                   │
│     └─> GitHub Script (JSON parsing)    │
│  4. Apply Labels                        │
│     └─> GitHub Script                   │
│  5. Create Subtasks                     │
│     └─> GitHub Script (with tasklists)  │
│  6. Post Comment                        │
│     └─> GitHub Script                   │
│                                          │
└─────────────────────────────────────────┘
```

## Migration Guide

### From v1 to v2

If you want to try v2, here's what changes:

**Before (v1):**

```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    model: claude-3-5-sonnet-20241022
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    project-owner: your-username
    project-number: 4
```

**After (v2):**

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    # model defaults to openai/gpt-4o
    # Optional: enable MCP for better context
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

**Breaking Changes:**

1. **No project support yet** - Project V2 integration coming in future release
2. **Different AI providers** - Only GitHub Models API supported currently
3. **Different outputs** - Output structure changed (see docs)
4. **No description enhancement** - Focus on triage only
5. **No clarifying questions** - Focus on triage only

**New Features:**

1. **Native sub-issues** - Proper parent-child relationships
2. **Automatic tool use** - MCP provides context gathering
3. **ReAct loop** - Multi-step reasoning
4. **Free tier** - Works without API keys

### From v2 to v1

If v2 doesn't meet your needs, you can switch back:

**Before (v2):**

```yaml
- uses: cajias/custom-github-actions/ai-triage-mcp@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    enable-github-mcp: true
    github-mcp-token: ${{ secrets.TRIAGE_PAT }}
```

**After (v1):**

```yaml
- uses: cajias/custom-github-actions/ai-triage@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    # Use any supported model
    model: xai/grok-3-mini
    # Optional: project integration
    project-owner: your-username
    project-number: 4
```

## Cost Comparison

### v1 (TypeScript)

**With GitHub Models (Free Tier):**

- xai/grok-3-mini: Free, rate limited
- ~1 request per issue
- **Cost:** $0

**With Anthropic:**

- Claude 3.5 Sonnet: ~$3 per 1M tokens
- ~2000 tokens per issue
- **Cost:** ~$0.006 per issue

**With OpenAI:**

- GPT-4o: ~$5 per 1M tokens
- ~2000 tokens per issue
- **Cost:** ~$0.01 per issue

### v2 (MCP + Script)

**GitHub Models (Free Tier):**

- openai/gpt-4o: Free, rate limited
- ~3 requests per issue (with MCP tools)
- 10 req/min, 50 req/day limit
- **Cost:** $0
- **Capacity:** ~15 issues/day

## Future Roadmap

### v1 (TypeScript)

- ✅ Stable and production-ready
- 🔄 Ongoing maintenance
- ⬜ New AI providers as available
- ⬜ Enhanced project integration

### v2 (MCP + Script)

- ✅ Core triage functionality complete
- 🔄 Active development
- ⬜ GitHub Projects V2 integration
- ⬜ Repository-specific configurations
- ⬜ Custom label mappings
- ⬜ Multiple issue type support
- ⬜ Advanced MCP tool usage
- ⬜ Batch processing support

## Recommendations

### For Production Use

**Use v1** if you need:

- Production stability
- Project integration
- Multiple AI providers
- Description enhancement

### For Experimentation

**Use v2** if you want:

- Latest agentic architecture
- Simpler maintenance
- Free tier option
- Native sub-issues

### For New Projects

**Start with v2** if:

- You don't need project integration yet
- You want simpler code
- You're comfortable with GitHub Models

**Start with v1** if:

- You need all features now
- You need project integration
- You prefer TypeScript

## Support

For issues specific to:

- **v1 (TypeScript)**: [ai-triage/README.md](../ai-triage/README.md)
- **v2 (MCP + Script)**: [ai-triage-mcp/README.md](../ai-triage-mcp/README.md)

## Contributing

Both implementations are actively maintained. Contributions welcome!

- **v1**: TypeScript, requires `npm run all` to build
- **v2**: YAML, no build step required

## License

MIT
