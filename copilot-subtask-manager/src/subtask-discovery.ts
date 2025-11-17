/**
 * Subtask discovery and dependency parsing
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { Subtask } from "./types";

/**
 * Find all subtasks for a given parent issue
 */
export async function findSubtasks(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
): Promise<Subtask[]> {
  core.info(`Looking for subtasks of parent issue #${parentNumber}`);

  // Get all open issues in the repository
  const { data: allIssues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  // Filter issues that have the parent label
  const subtasks: Subtask[] = [];
  const parentLabel = `parent:${parentNumber}`;

  for (const issue of allIssues) {
    const hasParentLabel = issue.labels.some(
      (label) =>
        typeof label === "object" && label.name && label.name === parentLabel,
    );

    const bodyMentionsParent =
      issue.body &&
      (issue.body.includes(`#${parentNumber}`) ||
        issue.body.includes(`Parent Issue: #${parentNumber}`));

    if (hasParentLabel || bodyMentionsParent) {
      const labelNames =
        issue.labels?.map((l) => (typeof l === "object" ? l.name || "" : "")) ||
        [];

      const assigneeLogins =
        issue.assignees?.map((a) => a?.login || "").filter((l) => l) || [];

      const dependencies = parseDependencies(issue.body || "", labelNames);

      subtasks.push({
        number: issue.number,
        title: issue.title,
        body: issue.body || null,
        state: issue.state,
        labels: labelNames,
        assignees: assigneeLogins,
        dependencies,
      });
    }
  }

  core.info(`Found ${subtasks.length} subtask(s)`);
  return subtasks;
}

/**
 * Parse dependency information from issue body and labels
 */
export function parseDependencies(body: string, labels: string[]): number[] {
  const dependencies: number[] = [];

  // Parse from issue body
  if (body) {
    // Pattern: "depends on #123" or "depends-on: #124"
    const dependsMatches = body.matchAll(/depends[- ]on:?\s*#(\d+)/gi);
    for (const match of dependsMatches) {
      dependencies.push(parseInt(match[1]));
    }

    // Pattern: "requires #125" or "requires: #126, #127"
    const requiresMatches = body.matchAll(/requires:?\s*#(\d+)/gi);
    for (const match of requiresMatches) {
      dependencies.push(parseInt(match[1]));
    }

    // Pattern: "blocked by #128"
    const blockedMatches = body.matchAll(/blocked\s+by:?\s*#(\d+)/gi);
    for (const match of blockedMatches) {
      dependencies.push(parseInt(match[1]));
    }
  }

  // Parse from labels (e.g., "depends-on:#123")
  for (const label of labels) {
    const match = label.match(/depends-on:#?(\d+)/i);
    if (match) {
      dependencies.push(parseInt(match[1]));
    }
  }

  // Remove duplicates and return
  return [...new Set(dependencies)];
}

/**
 * Check if an issue is closed
 */
export async function isIssueClosed(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<boolean> {
  try {
    const { data: issue } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return issue.state === "closed";
  } catch (error) {
    core.warning(`Could not check status of issue #${issueNumber}: ${error}`);
    return false; // Assume not closed if we can't check
  }
}
