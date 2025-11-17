/**
 * Copilot assignment management
 */
import * as github from "@actions/github";
import { SubtaskAnalysis, AssignmentResult } from "./types";
/**
 * Assign Copilot to multiple subtasks
 */
export declare function assignCopilotToSubtasks(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  assignee: string,
  subtasks: SubtaskAnalysis[],
): Promise<AssignmentResult[]>;
/**
 * Post a status comment on the parent issue
 */
export declare function postStatusComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
  assignee: string,
  readySubtasks: SubtaskAnalysis[],
  allSubtasks: SubtaskAnalysis[],
): Promise<void>;
/**
 * Post progress comment when a subtask is completed
 */
export declare function postProgressComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  parentNumber: number,
  completedSubtaskNumber: number,
  newlyAssignedSubtasks: SubtaskAnalysis[],
  remainingSubtasks: SubtaskAnalysis[],
): Promise<void>;
