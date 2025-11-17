/**
 * Dependency resolution logic
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { Subtask, SubtaskAnalysis } from "./types";
import { isIssueClosed } from "./subtask-discovery";

/**
 * Analyze subtasks and determine which are ready to work on
 */
export async function analyzeSubtasks(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  subtasks: Subtask[],
): Promise<SubtaskAnalysis[]> {
  const analyses: SubtaskAnalysis[] = [];

  for (const subtask of subtasks) {
    const hasAssignees = subtask.assignees.length > 0;

    // Skip if already assigned
    if (hasAssignees) {
      core.info(`Subtask #${subtask.number} already has assignees, skipping`);
      analyses.push({
        number: subtask.number,
        title: subtask.title,
        dependencies: subtask.dependencies,
        hasAssignees,
        state: subtask.state,
        isReady: false,
        unresolvedDependencies: subtask.dependencies,
      });
      continue;
    }

    // If no dependencies, it's ready
    if (subtask.dependencies.length === 0) {
      core.info(`Subtask #${subtask.number} has no dependencies, ready`);
      analyses.push({
        number: subtask.number,
        title: subtask.title,
        dependencies: [],
        hasAssignees,
        state: subtask.state,
        isReady: true,
        unresolvedDependencies: [],
      });
      continue;
    }

    // Check if all dependencies are resolved
    const unresolvedDeps: number[] = [];
    for (const depNum of subtask.dependencies) {
      const isClosed = await isIssueClosed(octokit, owner, repo, depNum);
      if (!isClosed) {
        unresolvedDeps.push(depNum);
      }
    }

    const isReady = unresolvedDeps.length === 0;

    if (isReady) {
      core.info(
        `Subtask #${subtask.number} has all dependencies resolved, ready`,
      );
    } else {
      core.info(
        `Subtask #${subtask.number} has ${unresolvedDeps.length} unresolved dependencies: ${unresolvedDeps.join(", ")}`,
      );
    }

    analyses.push({
      number: subtask.number,
      title: subtask.title,
      dependencies: subtask.dependencies,
      hasAssignees,
      state: subtask.state,
      isReady,
      unresolvedDependencies: unresolvedDeps,
    });
  }

  return analyses;
}

/**
 * Find subtasks that became ready after a specific subtask was completed
 */
export function findNewlyReadySubtasks(
  completedSubtaskNumber: number,
  analyses: SubtaskAnalysis[],
): SubtaskAnalysis[] {
  const newlyReady: SubtaskAnalysis[] = [];

  for (const analysis of analyses) {
    // Skip if already assigned or already determined not ready
    if (analysis.hasAssignees || !analysis.isReady) {
      continue;
    }

    // Check if this subtask depended on the completed one
    if (analysis.dependencies.includes(completedSubtaskNumber)) {
      // This subtask just became unblocked
      newlyReady.push(analysis);
    }
  }

  return newlyReady;
}

/**
 * Detect circular dependencies in subtasks
 */
export function detectCircularDependencies(subtasks: Subtask[]): string | null {
  const graph = new Map<number, number[]>();

  // Build dependency graph
  for (const subtask of subtasks) {
    graph.set(subtask.number, subtask.dependencies);
  }

  // Check for cycles using DFS
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function hasCycle(node: number, path: number[]): string | null {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      return `Circular dependency detected: ${cycle.map((n) => `#${n}`).join(" → ")}`;
    }

    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = graph.get(node) || [];
    for (const dep of dependencies) {
      const result = hasCycle(dep, [...path]);
      if (result) {
        return result;
      }
    }

    recursionStack.delete(node);
    return null;
  }

  for (const subtask of subtasks) {
    const result = hasCycle(subtask.number, []);
    if (result) {
      return result;
    }
  }

  return null;
}
