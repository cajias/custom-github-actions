/**
 * Process triage analysis and update GitHub issue
 */

import * as core from "@actions/core";
import { ActionContext, TriageAnalysis } from "./types";
import { createSubtasks, postSubtaskFeedback } from "./subtasks";

/**
 * Process the AI triage analysis and update the issue accordingly
 */
export async function processTriageAnalysis(
  ctx: ActionContext,
  analysis: TriageAnalysis,
): Promise<void> {
  core.info("Processing triage analysis...");
  core.info(`Agent ready: ${analysis.is_agent_ready}`);
  core.info(`Priority: ${analysis.priority}`);
  core.info(`Size: ${analysis.size}`);
  core.info(`Needs subtasks: ${analysis.needs_subtasks}`);

  // 1. Apply labels
  await applyLabels(ctx, analysis);

  // 2. Handle subtasks
  await handleSubtasks(ctx, analysis);

  // 3. Handle agent readiness
  if (!analysis.is_agent_ready) {
    await handleNotAgentReady(ctx, analysis);
  } else {
    await handleAgentReady(ctx, analysis);
  }

  // 4. Remove needs-triage label if present
  await removeTriageLabel(ctx);

  core.info("✅ Triage processing complete");
}

/**
 * Apply labels to the issue
 */
async function applyLabels(
  ctx: ActionContext,
  analysis: TriageAnalysis,
): Promise<void> {
  if (analysis.labels.length === 0) {
    core.info("No labels to apply");
    return;
  }

  core.info(`Applying labels: ${analysis.labels.join(", ")}`);

  await ctx.octokit.rest.issues.addLabels({
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.issueNumber,
    labels: analysis.labels,
  });
}

/**
 * Handle issue that is NOT agent-ready
 */
async function handleNotAgentReady(
  ctx: ActionContext,
  analysis: TriageAnalysis,
): Promise<void> {
  core.info("Issue is not agent-ready");

  // If we have clarifying questions, post them
  if (
    analysis.clarifying_questions &&
    analysis.clarifying_questions.length > 0
  ) {
    const questions = analysis.clarifying_questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");

    const body =
      `🤖 **AI Triage: Clarification Needed**\n\n` +
      `This issue needs more details before it can be assigned to an agent. ` +
      `Please provide the following information:\n\n${questions}\n\n` +
      `**Reasoning:** ${analysis.reasoning}\n\n` +
      `Once you've provided these details, add the \`needs-triage\` label again to re-run the analysis.`;

    await ctx.octokit.rest.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.issueNumber,
      body,
    });

    core.info("Posted clarifying questions");
  }

  // If we have an enhanced description, update the issue body
  if (analysis.enhanced_description) {
    await ctx.octokit.rest.issues.update({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.issueNumber,
      body: analysis.enhanced_description,
    });

    const body =
      `🤖 **AI Triage: Description Enhanced**\n\n` +
      `The issue description has been enhanced to be more specific and actionable.\n\n` +
      `**Reasoning:** ${analysis.reasoning}`;

    await ctx.octokit.rest.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.issueNumber,
      body,
    });

    core.info("Enhanced issue description");
  }
}

/**
 * Handle issue that IS agent-ready
 */
async function handleAgentReady(
  ctx: ActionContext,
  analysis: TriageAnalysis,
): Promise<void> {
  core.info("Issue is agent-ready");

  // Add ready-for-review label
  await ctx.octokit.rest.issues.addLabels({
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.issueNumber,
    labels: ["status:ready-for-review"],
  });

  // Create summary comment
  const relatedIssues =
    analysis.related_issues.length > 0
      ? `**Related Issues:** ${analysis.related_issues.map((n) => `#${n}`).join(", ")}\n`
      : "";

  const suggestedAssignee = analysis.suggested_assignee
    ? `**Suggested Assignee:** @${analysis.suggested_assignee}\n`
    : "";

  const body = `✅ **AI Triage: Agent Ready**\n\nThis issue is well-defined and ready for implementation.\n\n**Priority:** ${analysis.priority}\n**Size Estimate:** ${analysis.size}\n**Labels Applied:** ${analysis.labels.join(", ")}\n${relatedIssues}${suggestedAssignee}\n**Reasoning:** ${analysis.reasoning}`;

  await ctx.octokit.rest.issues.createComment({
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.issueNumber,
    body,
  });

  core.info("Marked issue as agent-ready");
}

/**
 * Handle subtask creation and feedback
 */
async function handleSubtasks(
  ctx: ActionContext,
  analysis: TriageAnalysis,
): Promise<void> {
  // Create new subtasks if needed
  if (analysis.needs_subtasks && analysis.subtasks_to_create.length > 0) {
    core.info(`Creating ${analysis.subtasks_to_create.length} new subtasks...`);
    const createdIssues = await createSubtasks(
      ctx,
      analysis.subtasks_to_create,
    );
    if (createdIssues.length !== analysis.subtasks_to_create.length) {
      core.warning(
        `⚠️ Only ${createdIssues.length} out of ${analysis.subtasks_to_create.length} subtasks were created. Some subtasks may have failed to create.`,
      );
    }
    core.info(
      `✅ Created ${createdIssues.length} subtasks (requested: ${analysis.subtasks_to_create.length})`,
    );
  }

  // Post feedback on existing subtasks
  if (
    analysis.subtask_feedback.length > 0 ||
    analysis.overall_subtask_feedback
  ) {
    await postSubtaskFeedback(
      ctx,
      analysis.subtask_feedback,
      analysis.overall_subtask_feedback,
    );
    core.info("✅ Posted subtask feedback");
  }
}

/**
 * Remove the needs-triage label
 */
async function removeTriageLabel(ctx: ActionContext): Promise<void> {
  try {
    await ctx.octokit.rest.issues.removeLabel({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.issueNumber,
      name: "needs-triage",
    });
    core.info("Removed needs-triage label");
  } catch (error) {
    // Label might not exist, ignore
    core.debug("needs-triage label not present or already removed");
  }
}
