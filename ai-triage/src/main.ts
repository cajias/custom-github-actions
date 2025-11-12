/**
 * AI-powered GitHub issue triage action
 *
 * This action uses GitHub Models to analyze issues and:
 * - Apply appropriate labels
 * - Set priority and size estimates
 * - Enhance descriptions to be agent-ready
 * - Ask clarifying questions when needed
 * - Update project board fields
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { analyzeIssue } from "./analyze";
import { processTriageAnalysis } from "./process-triage";
import { updateProjectFields } from "./update-project";
import { ActionContext, ProjectConfig } from "./types";

/**
 * Check if the action should run based on default triggers
 */
function shouldRunTriage(context: typeof github.context): boolean {
  const action = context.payload.action;
  const issue = context.payload.issue;

  // Trigger 1: Issue opened
  if (action === "opened") {
    core.info("✅ Trigger: Issue opened");
    return true;
  }

  // Trigger 2 & 3: Check for specific labels
  if (action === "labeled" && issue?.labels) {
    const labels = issue.labels.map((l: any) => l.name);

    if (labels.includes("needs-triage")) {
      core.info("✅ Trigger: needs-triage label added");
      return true;
    }

    if (labels.includes("triage:backlog")) {
      core.info("✅ Trigger: triage:backlog label added");
      return true;
    }
  }

  return false;
}

/**
 * Main action entry point
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput("token", { required: true });
    const model = core.getInput("model") || "xai/grok-3-mini";
    const anthropicKey = core.getInput("anthropic-api-key") || "";
    const openaiKey = core.getInput("openai-api-key") || "";
    const projectOwner = core.getInput("project-owner");
    const projectNumber = core.getInput("project-number");
    const skipTriggerCheck = core.getInput("skip-trigger-check") === "true";

    // Initialize GitHub client
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Validate context
    if (!context.payload.issue) {
      throw new Error("This action must be triggered by an issue event");
    }

    const issueNumber = context.payload.issue.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    core.info(`Processing issue #${issueNumber} in ${owner}/${repo}`);

    // Check default triggers (unless skipped)
    if (!skipTriggerCheck && !shouldRunTriage(context)) {
      core.info("⏭️  Skipping: Does not match default triggers");
      core.info(
        "Triggers: issue opened, or labels: needs-triage, triage:backlog",
      );
      return;
    }

    // Create action context
    const ctx: ActionContext = {
      octokit,
      context,
      issueNumber,
      owner,
      repo,
    };

    // Analyze issue with AI
    const analysis = await analyzeIssue(
      ctx,
      model,
      anthropicKey,
      openaiKey,
      token,
    );
    core.info("AI analysis complete");
    core.debug(`Analysis: ${JSON.stringify(analysis, null, 2)}`);

    // Process triage (update issue, add labels, post comments)
    await processTriageAnalysis(ctx, analysis);

    // Update project fields if configured
    if (projectOwner && projectNumber) {
      const projectConfig: ProjectConfig = {
        owner: projectOwner,
        number: parseInt(projectNumber, 10),
      };

      await updateProjectFields(ctx, analysis, projectConfig);
    } else {
      core.info("Project configuration not provided, skipping project update");
    }

    // Set outputs
    core.setOutput("is-agent-ready", analysis.is_agent_ready);
    core.setOutput("priority", analysis.priority);
    core.setOutput("size", analysis.size);
    core.setOutput("labels", analysis.labels.join(","));

    core.info("✅ Triage complete!");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unknown error occurred");
    }
  }
}

// Run the action
run();
