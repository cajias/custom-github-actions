/**
 * AI-powered issue analysis using multiple model providers
 */

import * as core from "@actions/core";
import { ActionContext, TriageAnalysis } from "./types";
import { getModelConfig, callModel } from "./model-providers";

/**
 * Analyze issue using AI model (supports multiple providers)
 */
export async function analyzeIssue(
  ctx: ActionContext,
  model: string,
  anthropicKey: string,
  openaiKey: string,
  githubToken: string,
  existingSubtasks?: Array<{
    number: number;
    title: string;
    body: string;
    state: string;
  }>,
): Promise<TriageAnalysis> {
  core.info(`Analyzing issue #${ctx.issueNumber} with ${model}...`);

  const issue = ctx.context.payload.issue;
  if (!issue) {
    throw new Error("Issue not found in context");
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    issue.title,
    issue.body || "",
    ctx,
    existingSubtasks,
  );

  // Get model configuration and validate API keys
  const config = getModelConfig(model, anthropicKey, openaiKey);

  // Call the appropriate AI provider
  const response = await callModel(
    config,
    systemPrompt,
    userPrompt,
    githubToken,
  );

  // Parse and validate response
  const analysis = parseAIResponse(response);

  core.info("✅ Issue analysis complete");
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
5. Whether the task requires subtasks and evaluate existing subtasks

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
  "reasoning": "brief explanation",
  "needs_subtasks": boolean,
  "subtasks_to_create": [
    {
      "title": "string",
      "body": "detailed description with acceptance criteria",
      "blocked_by": [101, 102],
      "labels": ["type:*", ...],
      "priority": "P0" | "P1" | "P2",
      "size": "XS" | "S" | "M" | "L" | "XL"
    }
  ],
  "subtask_feedback": [
    {
      "issue_number": number,
      "feedback": "detailed feedback on this subtask",
      "is_ready": boolean,
      "suggested_improvements": ["improvement1", ...]
    }
  ],
  "overall_subtask_feedback": "assessment of all subtasks together or null"
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

SUBTASK GUIDELINES:
- Create subtasks ONLY for complex tasks (M, L, XL size)
- Simple tasks (XS, S) should NOT have subtasks
- Parent task should be generic and describe acceptance criteria
- Subtasks should be specific with proper detail level
- Each subtask should answer all questions needed for successful completion
- Subtasks should link to other subtasks they are blocked by (blocked_by field)
- When subtasks exist, evaluate them individually and as a whole
- Check if subtasks correctly track requirements and acceptance criteria of parent
- Ensure subtasks provide proper ordering via blocked_by relationships

Return ONLY valid JSON, no markdown formatting.`;
}

/**
 * Build the user prompt with issue details
 */
function buildUserPrompt(
  title: string,
  body: string,
  ctx: ActionContext,
  existingSubtasks?: Array<{
    number: number;
    title: string;
    body: string;
    state: string;
  }>,
): string {
  let prompt = `**Issue Title:** ${title}

**Issue Body:**
${body}

**Repository:** ${ctx.owner}/${ctx.repo}
**Issue Number:** ${ctx.issueNumber}`;

  // Include existing subtasks if present
  if (existingSubtasks && existingSubtasks.length > 0) {
    prompt += `\n\n**Existing Subtasks:**`;
    for (const subtask of existingSubtasks) {
      prompt += `\n\n#${subtask.number} - ${subtask.title} [${subtask.state}]\n${subtask.body}`;
    }
  }

  prompt += `\n\nAnalyze this issue and provide triage information in JSON format. Consider whether this task needs subtasks or if existing subtasks need feedback.`;

  return prompt;
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(response: string): TriageAnalysis {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as TriageAnalysis;

    // Validate required fields
    validateAnalysis(parsed);

    return parsed;
  } catch (error) {
    core.error(`Failed to parse AI response: ${error}`);
    core.error(`Raw response: ${response}`);
    throw new Error("AI returned invalid JSON response");
  }
}

/**
 * Validate that the analysis has all required fields
 */
function validateAnalysis(analysis: any): asserts analysis is TriageAnalysis {
  const requiredFields = [
    "is_agent_ready",
    "labels",
    "priority",
    "size",
    "related_issues",
    "clarifying_questions",
    "reasoning",
    "needs_subtasks",
    "subtasks_to_create",
    "subtask_feedback",
  ];

  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field in AI response: ${field}`);
    }
  }

  // Validate types
  if (typeof analysis.is_agent_ready !== "boolean") {
    throw new Error("is_agent_ready must be a boolean");
  }

  if (!Array.isArray(analysis.labels)) {
    throw new Error("labels must be an array");
  }

  if (!["P0", "P1", "P2"].includes(analysis.priority)) {
    throw new Error("priority must be P0, P1, or P2");
  }

  if (!["XS", "S", "M", "L", "XL"].includes(analysis.size)) {
    throw new Error("size must be XS, S, M, L, or XL");
  }

  if (!Array.isArray(analysis.related_issues)) {
    throw new Error("related_issues must be an array");
  }

  if (!Array.isArray(analysis.clarifying_questions)) {
    throw new Error("clarifying_questions must be an array");
  }

  if (typeof analysis.reasoning !== "string") {
    throw new Error("reasoning must be a string");
  }

  if (typeof analysis.needs_subtasks !== "boolean") {
    throw new Error("needs_subtasks must be a boolean");
  }

  if (!Array.isArray(analysis.subtasks_to_create)) {
    throw new Error("subtasks_to_create must be an array");
  }

  if (!Array.isArray(analysis.subtask_feedback)) {
    throw new Error("subtask_feedback must be an array");
  }

  // Validate subtask structure
  for (const subtask of analysis.subtasks_to_create) {
    const allowedPriorities = ["critical", "high", "medium", "low"];
    const allowedSizes = ["xs", "s", "m", "l", "xl"];
    if (
      typeof subtask.title !== "string" ||
      subtask.title.trim().length === 0 ||
      typeof subtask.body !== "string" ||
      subtask.body.trim().length === 0 ||
      !Array.isArray(subtask.blocked_by) ||
      !Array.isArray(subtask.labels) ||
      typeof subtask.priority !== "string" ||
      !allowedPriorities.includes(subtask.priority) ||
      typeof subtask.size !== "string" ||
      !allowedSizes.includes(subtask.size)
    ) {
      throw new Error(
        "Each subtask must have a non-empty string title and body, blocked_by and labels as arrays, priority and size as valid strings",
      );
    }
  }

  // Validate subtask feedback structure
  for (const feedback of analysis.subtask_feedback) {
    if (
      typeof feedback.issue_number !== "number" ||
      typeof feedback.feedback !== "string" ||
      typeof feedback.is_ready !== "boolean" ||
      !Array.isArray(feedback.suggested_improvements)
    ) {
      throw new Error(
        "Each subtask feedback must have issue_number, feedback, is_ready, and suggested_improvements",
      );
    }
  }
}
