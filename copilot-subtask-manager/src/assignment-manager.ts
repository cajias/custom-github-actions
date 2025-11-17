/**
 * Copilot assignment management
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { SubtaskAnalysis, AssignmentResult } from "./types";

/**
 * Assign Copilot to multiple subtasks
 */
export async function assignCopilotToSubtasks(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  assignee: string,
  subtasks: SubtaskAnalysis[],
): Promise<AssignmentResult[]> {
  const results: AssignmentResult[] = [];

  for (const subtask of subtasks) {
    try {
      await octokit.rest.issues.addAssignees({
        owner,
        repo,
        issue_number: subtask.number,
        assignees: [assignee],
      });

      core.info(`✓ Assigned ${assignee} to subtask #${subtask.number}`);
      results.push({ number: subtask.number, success: true });
    } catch (error: any) {
      core.error(
        `✗ Failed to assign ${assignee} to subtask #${subtask.number}: ${error.message}`,
      );
      results.push({
        number: subtask.number,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Post a status comment on the parent issue
 */
export async function postStatusComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
  assignee: string,
  readySubtasks: SubtaskAnalysis[],
  allSubtasks: SubtaskAnalysis[],
): Promise<void> {
  let comment = "🤖 **Copilot Subtask Manager**\n\n";

  if (allSubtasks.length === 0) {
    comment += `No subtasks found for this issue. ${assignee} will work on the parent issue directly.`;
  } else if (readySubtasks.length === 0) {
    const blockedSubtasks = allSubtasks.filter(
      (st) => !st.hasAssignees && st.unresolvedDependencies.length > 0,
    );
    const assignedSubtasks = allSubtasks.filter((st) => st.hasAssignees);

    comment += `Found ${allSubtasks.length} subtask(s), but none are ready to assign:\n\n`;

    if (assignedSubtasks.length > 0) {
      comment += "**Already Assigned:**\n";
      for (const st of assignedSubtasks) {
        comment += `- [ ] #${st.number} - ${st.title}\n`;
      }
      comment += "\n";
    }

    if (blockedSubtasks.length > 0) {
      comment += "**Blocked by Dependencies:**\n";
      for (const st of blockedSubtasks) {
        const deps = st.unresolvedDependencies.map((d) => `#${d}`).join(", ");
        comment += `- [ ] #${st.number} - ${st.title} (depends on: ${deps})\n`;
      }
    }
  } else {
    comment += `${assignee} has been assigned to ${readySubtasks.length} ready subtask(s):\n\n`;

    for (const subtask of readySubtasks) {
      comment += `- [ ] #${subtask.number} - ${subtask.title}\n`;
    }

    const blockedSubtasks = allSubtasks.filter(
      (st) =>
        !readySubtasks.includes(st) &&
        !st.hasAssignees &&
        st.unresolvedDependencies.length > 0,
    );

    if (blockedSubtasks.length > 0) {
      comment += "\n**Waiting for Dependencies:**\n";
      for (const st of blockedSubtasks) {
        const deps = st.unresolvedDependencies.map((d) => `#${d}`).join(", ");
        comment += `- [ ] #${st.number} - ${st.title} (depends on: ${deps})\n`;
      }
      comment +=
        "\n_These will be automatically assigned as dependencies are completed._";
    }
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: parentNumber,
    body: comment,
  });
}

/**
 * Post progress comment when a subtask is completed
 */
export async function postProgressComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
  completedSubtaskNumber: number,
  newlyAssignedSubtasks: SubtaskAnalysis[],
  remainingSubtasks: SubtaskAnalysis[],
): Promise<void> {
  let comment = "🤖 **Subtask Completed**\n\n";
  comment += `Subtask #${completedSubtaskNumber} has been completed! ✅\n\n`;

  if (newlyAssignedSubtasks.length > 0) {
    comment += "**Newly Assigned Subtasks:**\n";
    for (const st of newlyAssignedSubtasks) {
      comment += `- [ ] #${st.number} - ${st.title}\n`;
    }
  } else {
    comment += "No additional subtasks are ready to assign at this time.\n";
  }

  const stillBlocked = remainingSubtasks.filter(
    (st) =>
      !st.hasAssignees &&
      !newlyAssignedSubtasks.includes(st) &&
      st.unresolvedDependencies.length > 0,
  );

  if (stillBlocked.length > 0) {
    comment += "\n**Still Waiting:**\n";
    for (const st of stillBlocked) {
      const deps = st.unresolvedDependencies.map((d) => `#${d}`).join(", ");
      comment += `- [ ] #${st.number} - ${st.title} (depends on: ${deps})\n`;
    }
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: parentNumber,
    body: comment,
  });
}
