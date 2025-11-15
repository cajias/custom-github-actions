/**
 * Handle subtask operations - fetching existing subtasks and creating new ones
 */

import * as core from "@actions/core";
import {
  ActionContext,
  SubtaskInfo,
  SubtaskFeedback,
  ExistingSubtask,
} from "./types";

/**
 * Fetch existing subtasks for an issue
 * Subtasks are identified by issues that reference the parent issue
 */
export async function fetchExistingSubtasks(
  ctx: ActionContext,
): Promise<ExistingSubtask[]> {
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
        if (source.issue && source.issue.number !== ctx.issueNumber) {
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

    // Fetch full details for each subtask in parallel
    const subtaskPromises = Array.from(subtaskNumbers).map(
      async (number): Promise<ExistingSubtask | null> => {
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
              issue.body.includes(
                `${ctx.owner}/${ctx.repo}#${ctx.issueNumber}`,
              ))
          ) {
            return {
              number: issue.number,
              title: issue.title,
              body: issue.body || "",
              state: issue.state,
            };
          }
          return null;
        } catch (error) {
          core.warning(`Failed to fetch issue #${number}: ${error}`);
          return null;
        }
      },
    );

    const results = await Promise.all(subtaskPromises);
    const subtasks = results.filter(
      (subtask): subtask is ExistingSubtask => subtask !== null,
    );

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
  const issueNumberMap = new Map<number, number>();
  const parentCommentLines: string[] = [];

  // First pass: create all subtasks
  for (let i = 0; i < subtasks.length; i++) {
    const subtask = subtasks[i];
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
      issueNumberMap.set(i, newIssue.number);
      core.info(`✅ Created subtask #${newIssue.number}: ${subtask.title}`);

      // Collect info for batched parent comment
      const metaInfo = `Priority: ${subtask.priority} | Size: ${subtask.size}`;
      parentCommentLines.push(
        `- #${newIssue.number} - ${subtask.title} (${metaInfo})`,
      );
    } catch (error) {
      core.error(`Failed to create subtask "${subtask.title}": ${error}`);
    }
  }

  // Post a single batched comment to parent issue with all created subtasks
  if (parentCommentLines.length > 0) {
    try {
      const batchedComment = `✅ **Created ${parentCommentLines.length} subtask(s):**\n\n${parentCommentLines.join("\n")}`;
      await ctx.octokit.rest.issues.createComment({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: ctx.issueNumber,
        body: batchedComment,
      });
    } catch (error) {
      core.warning(`Failed to post batched comment on parent issue: ${error}`);
    }
  }

  // Second pass: add blocked_by comments now that all issues are created
  for (let i = 0; i < subtasks.length; i++) {
    const subtask = subtasks[i];
    const newIssueNumber = issueNumberMap.get(i);

    if (!newIssueNumber) {
      continue; // Skip if this subtask failed to create
    }

    if (subtask.blocked_by.length > 0) {
      try {
        const blockedByText = subtask.blocked_by.map((n) => `#${n}`).join(", ");
        await ctx.octokit.rest.issues.createComment({
          owner: ctx.owner,
          repo: ctx.repo,
          issue_number: newIssueNumber,
          body: `⚠️ **Blocked By:** ${blockedByText}\n\nThis subtask depends on the completion of the above tasks. Please complete those before starting this one.`,
        });
      } catch (error) {
        core.warning(
          `Failed to add blocked_by comment to subtask #${newIssueNumber}: ${error}`,
        );
      }
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
