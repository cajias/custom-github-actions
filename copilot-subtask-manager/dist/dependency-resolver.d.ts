/**
 * Dependency resolution logic
 */
import * as github from "@actions/github";
import { Subtask, SubtaskAnalysis } from "./types";
/**
 * Analyze subtasks and determine which are ready to work on
 */
export declare function analyzeSubtasks(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  subtasks: Subtask[],
): Promise<SubtaskAnalysis[]>;
/**
 * Find subtasks that became ready after a specific subtask was completed
 */
export declare function findNewlyReadySubtasks(
  completedSubtaskNumber: number,
  analyses: SubtaskAnalysis[],
): SubtaskAnalysis[];
/**
 * Detect circular dependencies in subtasks
 */
export declare function detectCircularDependencies(
  subtasks: Subtask[],
): string | null;
