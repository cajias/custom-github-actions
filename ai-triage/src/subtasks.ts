/**
 * Handle subtask operations - fetching existing subtasks and creating new ones
 */

import * as core from "@actions/core";
import { ActionContext, SubtaskInfo, SubtaskFeedback } from "./types";

/**
 * Fetch existing subtasks for an issue
 * Subtasks are identified by issues that reference the parent issue
 */
export async function fetchExistingSubtasks(
  ctx: ActionContext,
): Promise<
  Array<{ number: number; title: string; body: string; state: string }>
> {
  core.info(`Fetching existing subtasks for issue #${ctx.issueNumber}...`);

  try {
    // Use GitHub's timeline API to find references
    const timeline = await ctx.octokit.rest.issues.listEventsForTimeline({
      owner: ctx.owner,
      repo: ctx.repo,
      issue_number: ctx.issueNumber,
      per_page: 100,
    });

    const subtaskNumbers = new Set<number>();

    // Look for cross-references in timeline events
    for (const event of timeline.data) {
      const eventAny = event as any;
      if (event.event === "cross-referenced" && eventAny.source) {
        const source = eventAny.source;
        if (source.issue) {
          subtaskNumbers.add(source.issue.number);
        }
      }
    }

    // Also search for issues that mention this issue in their body
    const searchQuery = `repo:${ctx.owner}/${ctx.repo} is:issue #${ctx.issueNumber} in:body`;
    const searchResults = await ctx.octokit.rest.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: 100,
    });

    for (const issue of searchResults.data.items) {
      if (issue.number !== ctx.issueNumber && !issue.pull_request) {
        subtaskNumbers.add(issue.number);
      }
    }

    // Fetch full details for each subtask
    const subtasks = [];
    for (const number of subtaskNumbers) {
      try {
        const { data: issue } = await ctx.octokit.rest.issues.get({
          owner: ctx.owner,
          repo: ctx.repo,
          issue_number: number,
        });

        // Only include if the issue body actually references the parent
        if (
          issue.body &&
          (issue.body.includes(`#${ctx.issueNumber}`) ||
            issue.body.includes(`${ctx.owner}/${ctx.repo}#${ctx.issueNumber}`))
        ) {
          subtasks.push({
            number: issue.number,
            title: issue.title,
            body: issue.body || "",
            state: issue.state,
          });
        }
      } catch (error) {
        core.warning(`Failed to fetch issue #${number}: ${error}`);
      }
    }

    core.info(`Found ${subtasks.length} existing subtasks`);
    return subtasks;
  } catch (error) {
    core.warning(`Error fetching subtasks: ${error}`);
    return [];
  }
}

/**
 * Create new subtasks for an issue
 */
export async function createSubtasks(
  ctx: ActionContext,
  subtasks: SubtaskInfo[],
): Promise<number[]> {
  core.info(`Creating ${subtasks.length} subtasks...`);

  const createdIssues: number[] = [];

  for (const subtask of subtasks) {
    try {
      // Add reference to parent issue in the body
      const bodyWithParent = `${subtask.body}\n\n---\n\nParent task: #${ctx.issueNumber}`;

      // Create the issue
      const { data: newIssue } = await ctx.octokit.rest.issues.create({
        owner: ctx.owner,
        repo: ctx.repo,
        title: subtask.title,
        body: bodyWithParent,
        labels: subtask.labels,
      });

      createdIssues.push(newIssue.number);
      core.info(`✅ Created subtask #${newIssue.number}: ${subtask.title}`);

      // Add a comment to the parent issue with priority and size info
      const metaInfo = `Priority: ${subtask.priority} | Size: ${subtask.size}`;
      await ctx.octokit.rest.issues.createComment({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: ctx.issueNumber,
        body: `✅ Created subtask: #${newIssue.number} - ${subtask.title}\n\n${metaInfo}`,
      });

      // If there are blocked_by relationships, add them as comments
      if (subtask.blocked_by.length > 0) {
        const blockedByText = subtask.blocked_by.map((n) => `#${n}`).join(", ");
        await ctx.octokit.rest.issues.createComment({
          owner: ctx.owner,
          repo: ctx.repo,
          issue_number: newIssue.number,
          body: `⚠️ **Blocked By:** ${blockedByText}\n\nThis subtask depends on the completion of the above tasks. Please complete those before starting this one.`,
        });
      }
    } catch (error) {
      core.error(`Failed to create subtask "${subtask.title}": ${error}`);
    }
  }

  return createdIssues;
}

/**
 * Post feedback on existing subtasks
 */
export async function postSubtaskFeedback(
  ctx: ActionContext,
  feedback: SubtaskFeedback[],
  overallFeedback: string | null,
): Promise<void> {
  core.info(`Posting feedback on ${feedback.length} subtasks...`);

  // Post individual feedback on each subtask
  for (const item of feedback) {
    try {
      const statusEmoji = item.is_ready ? "✅" : "⚠️";
      const readyText = item.is_ready
        ? "This subtask is well-defined and ready."
        : "This subtask needs improvements before it's ready.";

      let body = `${statusEmoji} **AI Triage Feedback on Subtask**\n\n${readyText}\n\n${item.feedback}`;

      if (item.suggested_improvements.length > 0) {
        const improvements = item.suggested_improvements
          .map((imp, i) => `${i + 1}. ${imp}`)
          .join("\n");
        body += `\n\n**Suggested Improvements:**\n${improvements}`;
      }

      await ctx.octokit.rest.issues.createComment({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: item.issue_number,
        body,
      });

      core.info(`✅ Posted feedback on subtask #${item.issue_number}`);
    } catch (error) {
      core.error(
        `Failed to post feedback on subtask #${item.issue_number}: ${error}`,
      );
    }
  }

  // Post overall feedback on the parent issue
  if (overallFeedback && feedback.length > 0) {
    try {
      const subtaskList = feedback
        .map((f) => {
          const statusEmoji = f.is_ready ? "✅" : "⚠️";
          return `- ${statusEmoji} #${f.issue_number}`;
        })
        .join("\n");

      const body =
        `🔍 **AI Triage: Subtask Analysis**\n\n` +
        `**Subtasks:**\n${subtaskList}\n\n` +
        `**Overall Assessment:**\n${overallFeedback}`;

      await ctx.octokit.rest.issues.createComment({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: ctx.issueNumber,
        body,
      });

      core.info("✅ Posted overall subtask feedback on parent issue");
    } catch (error) {
      core.error(`Failed to post overall feedback: ${error}`);
    }
  }
}
