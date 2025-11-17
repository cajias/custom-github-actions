/**
 * Copilot Subtask Manager
 *
 * Automatically manages GitHub Copilot assignments for parallel subtask work:
 * - Auto-assigns Copilot to ready subtasks when assigned to parent issue
 * - Tracks dependencies between subtasks
 * - Automatically assigns next tasks when subtasks complete
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { findSubtasks } from "./subtask-discovery";
import {
  analyzeSubtasks,
  findNewlyReadySubtasks,
  detectCircularDependencies,
} from "./dependency-resolver";
import {
  assignCopilotToSubtasks,
  postStatusComment,
  postProgressComment,
} from "./assignment-manager";
import { EventContext } from "./types";

/**
 * Determine the event context and what action to take
 */
function getEventContext(context: typeof github.context): EventContext {
  const eventName = context.eventName;
  const action = context.payload.action || "";

  // Check for Copilot assignment to an issue
  if (eventName === "issues" && action === "assigned") {
    const assignee = context.payload.assignee?.login || "";
    const isCopilot = assignee === "copilot" || assignee.includes("copilot");

    return {
      eventName,
      action,
      isCopilotAssignment: isCopilot,
      isSubtaskCompletion: false,
      parentIssueNumber: isCopilot ? context.payload.issue?.number : undefined,
    };
  }

  // Check for PR completion (merged)
  if (eventName === "pull_request" && context.payload.pull_request?.merged) {
    const prBody = context.payload.pull_request.body || "";

    // Look for linked issues in PR body
    const issueMatches = prBody.matchAll(
      /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#(\d+)/gi,
    );

    const linkedIssues: number[] = [];
    for (const match of issueMatches) {
      linkedIssues.push(parseInt(match[1]));
    }

    return {
      eventName,
      action: "merged",
      isCopilotAssignment: false,
      isSubtaskCompletion: linkedIssues.length > 0,
      completedSubtaskNumber:
        linkedIssues.length > 0 ? linkedIssues[0] : undefined,
    };
  }

  return {
    eventName,
    action,
    isCopilotAssignment: false,
    isSubtaskCompletion: false,
  };
}

/**
 * Check if an issue has a parent label
 */
async function getParentIssueNumber(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<number | null> {
  const { data: issue } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const parentLabel = issue.labels.find(
    (label: any) =>
      typeof label === "object" &&
      label.name &&
      label.name.startsWith("parent:"),
  );

  if (parentLabel && typeof parentLabel === "object" && parentLabel.name) {
    const parentNum = parseInt(parentLabel.name.split(":")[1]);
    return parentNum;
  }

  return null;
}

/**
 * Handle Copilot being assigned to a parent issue
 */
async function handleCopilotAssignment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
  assignee: string,
): Promise<void> {
  core.info(`Handling Copilot assignment to parent issue #${parentNumber}`);

  // Find all subtasks
  const subtasks = await findSubtasks(octokit, owner, repo, parentNumber);

  if (subtasks.length === 0) {
    core.info("No subtasks found for this parent issue");
    await postStatusComment(
      octokit,
      owner,
      repo,
      parentNumber,
      assignee,
      [],
      [],
    );
    return;
  }

  // Check for circular dependencies
  const circularDep = detectCircularDependencies(subtasks);
  if (circularDep) {
    core.error(circularDep);
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: parentNumber,
      body: `🤖 **Copilot Subtask Manager - Error**\n\n${circularDep}\n\nPlease fix the circular dependency before proceeding.`,
    });
    core.setFailed(circularDep);
    return;
  }

  // Analyze dependencies
  const analyses = await analyzeSubtasks(octokit, owner, repo, subtasks);

  // Find ready subtasks
  const readySubtasks = analyses.filter((a) => a.isReady);

  core.info(
    `Found ${readySubtasks.length} ready subtask(s) out of ${subtasks.length} total`,
  );

  // Assign Copilot to ready subtasks
  if (readySubtasks.length > 0) {
    await assignCopilotToSubtasks(
      octokit,
      owner,
      repo,
      assignee,
      readySubtasks,
    );
  }

  // Post status comment
  await postStatusComment(
    octokit,
    owner,
    repo,
    parentNumber,
    assignee,
    readySubtasks,
    analyses,
  );
}

/**
 * Handle a subtask being completed
 */
async function handleSubtaskCompletion(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  completedSubtaskNumber: number,
): Promise<void> {
  core.info(`Handling completion of subtask #${completedSubtaskNumber}`);

  // Get the parent issue number
  const parentNumber = await getParentIssueNumber(
    octokit,
    owner,
    repo,
    completedSubtaskNumber,
  );

  if (!parentNumber) {
    core.info("Completed issue is not a subtask, skipping");
    return;
  }

  core.info(`Found parent issue #${parentNumber}`);

  // Find remaining open subtasks
  const subtasks = await findSubtasks(octokit, owner, repo, parentNumber);

  if (subtasks.length === 0) {
    core.info("No remaining subtasks found");
    await postProgressComment(
      octokit,
      owner,
      repo,
      parentNumber,
      completedSubtaskNumber,
      [],
      [],
    );
    return;
  }

  // Analyze dependencies
  const analyses = await analyzeSubtasks(octokit, owner, repo, subtasks);

  // Find subtasks that became ready
  const newlyReady = findNewlyReadySubtasks(completedSubtaskNumber, analyses);

  core.info(`Found ${newlyReady.length} newly unblocked subtask(s)`);

  // Assign Copilot to newly ready subtasks
  const copilotLogin = "copilot";
  if (newlyReady.length > 0) {
    await assignCopilotToSubtasks(
      octokit,
      owner,
      repo,
      copilotLogin,
      newlyReady,
    );
  }

  // Post progress comment
  await postProgressComment(
    octokit,
    owner,
    repo,
    parentNumber,
    completedSubtaskNumber,
    newlyReady,
    analyses,
  );
}

/**
 * Main entry point
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput("token", { required: true });

    // Initialize Octokit
    const octokit = github.getOctokit(token);
    const context = github.context;
    const { owner, repo } = context.repo;

    core.info(`Event: ${context.eventName}`);
    core.info(`Action: ${context.payload.action || "N/A"}`);

    // Determine what event triggered this
    const eventContext = getEventContext(context);

    if (eventContext.isCopilotAssignment && eventContext.parentIssueNumber) {
      const assignee = context.payload.assignee?.login || "copilot";
      await handleCopilotAssignment(
        octokit,
        owner,
        repo,
        eventContext.parentIssueNumber,
        assignee,
      );
    } else if (
      eventContext.isSubtaskCompletion &&
      eventContext.completedSubtaskNumber
    ) {
      await handleSubtaskCompletion(
        octokit,
        owner,
        repo,
        eventContext.completedSubtaskNumber,
      );
    } else {
      core.info(
        "Event is not a Copilot assignment or subtask completion, skipping",
      );
    }

    core.info("✅ Action completed successfully");
  } catch (error: any) {
    core.setFailed(`Action failed: ${error.message}`);
    if (error.stack) {
      core.debug(error.stack);
    }
  }
}

run();
