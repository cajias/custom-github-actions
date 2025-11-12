/**
 * AI-powered issue analysis using GitHub Models
 */

import * as core from '@actions/core';
import { ActionContext, TriageAnalysis } from './types';

/**
 * Analyze issue using GitHub Models API
 */
export async function analyzeIssue(
  ctx: ActionContext,
  model: string = 'openai/gpt-4o'
): Promise<TriageAnalysis> {
  core.info(`Analyzing issue #${ctx.issueNumber} with ${model}...`);

  const issue = ctx.context.payload.issue;
  if (!issue) {
    throw new Error('Issue not found in context');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(issue.title, issue.body || '', ctx);

  // Call GitHub Models API
  const response = await callGitHubModels(model, systemPrompt, userPrompt);

  // Parse and validate response
  const analysis = parseAIResponse(response);

  core.info('✅ Issue analysis complete');
  return analysis;
}

/**
 * Build the system prompt for the AI
 */
function buildSystemPrompt(): string {
  return `You are an expert GitHub issue triager for the PlanGEN project, a Python framework
for solving complex problems using LLMs in a multi-agent approach.

Analyze issues and determine:
1. If the issue is specific and actionable enough for an AI agent to implement
2. What labels, priority, and size are appropriate
3. Whether clarifying questions are needed
4. If the description should be enhanced

Return a JSON object with this EXACT structure:
{
  "is_agent_ready": boolean,
  "labels": ["type:*", "scope:*", ...],
  "priority": "P0" | "P1" | "P2",
  "size": "XS" | "S" | "M" | "L" | "XL",
  "related_issues": [numbers],
  "suggested_assignee": null,
  "clarifying_questions": ["question1", ...],
  "enhanced_description": "improved description or null",
  "reasoning": "brief explanation"
}

Labeling guidelines:
- type:bug - Something isn't working
- type:feature - New feature or request
- type:refactor - Code refactoring
- type:chore - Maintenance tasks

Scopes: api-design, infrastructure, documentation, visualization, testing,
        performance, architecture, security, packaging

An issue is "agent_ready" if it has:
- Clear acceptance criteria
- Specific technical details
- Well-defined scope
- No ambiguous requirements

If NOT agent_ready, either provide enhanced_description OR clarifying_questions.

Priority guidelines:
- P0: Critical bugs, security issues, blocking issues
- P1: Important features, significant bugs
- P2: Nice-to-have features, minor improvements

Size guidelines:
- XS: < 1 hour (typo fixes, documentation updates)
- S: 1-4 hours (small features, simple bug fixes)
- M: 1-2 days (medium features, complex bug fixes)
- L: 3-5 days (large features, architectural changes)
- XL: 1+ weeks (major features, significant refactoring)

Return ONLY valid JSON, no markdown formatting.`;
}

/**
 * Build the user prompt with issue details
 */
function buildUserPrompt(
  title: string,
  body: string,
  ctx: ActionContext
): string {
  return `**Issue Title:** ${title}

**Issue Body:**
${body}

**Repository:** ${ctx.owner}/${ctx.repo}
**Issue Number:** ${ctx.issueNumber}

Analyze this issue and provide triage information in JSON format.`;
}

/**
 * Call GitHub Models inference API
 */
async function callGitHubModels(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  core.debug('Calling GitHub Models API...');

  // GitHub Models API endpoint (new endpoint as of May 2025)
  const endpoint = 'https://models.github.ai/inference/chat/completions';

  // Prepare request body
  const body = {
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    model: model,
    temperature: 0.3, // Lower temperature for more consistent output
    max_tokens: 2000,
  };

  try {
    // Get GitHub token from context
    const token = core.getInput('token', { required: true });

    // Make direct fetch request with Bearer auth
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28', // Required for GitHub Models API
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as any;

    if (!result.choices || result.choices.length === 0) {
      throw new Error('No response from AI model');
    }

    const content = result.choices[0].message.content;
    core.debug(`AI response: ${content}`);

    return content;
  } catch (error: any) {
    core.error(`GitHub Models API error: ${error.message}`);
    throw new Error(`Failed to call GitHub Models API: ${error.message}`);
  }
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(response: string): TriageAnalysis {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as TriageAnalysis;

    // Validate required fields
    validateAnalysis(parsed);

    return parsed;
  } catch (error) {
    core.error(`Failed to parse AI response: ${error}`);
    core.error(`Raw response: ${response}`);
    throw new Error('AI returned invalid JSON response');
  }
}

/**
 * Validate that the analysis has all required fields
 */
function validateAnalysis(analysis: any): asserts analysis is TriageAnalysis {
  const requiredFields = [
    'is_agent_ready',
    'labels',
    'priority',
    'size',
    'related_issues',
    'clarifying_questions',
    'reasoning',
  ];

  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field in AI response: ${field}`);
    }
  }

  // Validate types
  if (typeof analysis.is_agent_ready !== 'boolean') {
    throw new Error('is_agent_ready must be a boolean');
  }

  if (!Array.isArray(analysis.labels)) {
    throw new Error('labels must be an array');
  }

  if (!['P0', 'P1', 'P2'].includes(analysis.priority)) {
    throw new Error('priority must be P0, P1, or P2');
  }

  if (!['XS', 'S', 'M', 'L', 'XL'].includes(analysis.size)) {
    throw new Error('size must be XS, S, M, L, or XL');
  }

  if (!Array.isArray(analysis.related_issues)) {
    throw new Error('related_issues must be an array');
  }

  if (!Array.isArray(analysis.clarifying_questions)) {
    throw new Error('clarifying_questions must be an array');
  }

  if (typeof analysis.reasoning !== 'string') {
    throw new Error('reasoning must be a string');
  }
}
