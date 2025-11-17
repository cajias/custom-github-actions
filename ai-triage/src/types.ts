/**
 * Type definitions for AI-powered issue triage
 */

import { GitHub } from "@actions/github/lib/utils";
import * as github from "@actions/github";

export type Priority = "P0" | "P1" | "P2";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type Status = "Backlog" | "Ready" | "In progress" | "In review" | "Done";

/**
 * Existing subtask information fetched from GitHub
 */
export interface ExistingSubtask {
  /** Issue number */
  number: number;

  /** Issue title */
  title: string;

  /** Issue body */
  body: string;

  /** Issue state (open/closed) */
  state: string;
}

/**
 * Subtask information for creating new subtasks
 */
export interface SubtaskInfo {
  /** Title of the subtask */
  title: string;

  /** Description/body of the subtask */
  body: string;

  /** Issue numbers this subtask is blocked by (within same parent) */
  blocked_by: number[];

  /** Labels to apply to the subtask */
  labels: string[];

  /** Priority for the subtask */
  priority: Priority;

  /** Size estimate for the subtask */
  size: Size;
}

/**
 * Feedback on an existing subtask
 */
export interface SubtaskFeedback {
  /** Issue number of the subtask */
  issue_number: number;

  /** Feedback comment for this subtask */
  feedback: string;

  /** Whether the subtask is well-defined and ready */
  is_ready: boolean;

  /** Suggested improvements if not ready */
  suggested_improvements: string[];
}

/**
 * Analysis result from AI model
 */
export interface TriageAnalysis {
  /** Whether the issue is specific enough for an AI agent to implement */
  is_agent_ready: boolean;

  /** Labels to apply to the issue */
  labels: string[];

  /** Issue priority */
  priority: Priority;

  /** Size estimate */
  size: Size;

  /** Related issue numbers */
  related_issues: number[];

  /** Suggested assignee GitHub username */
  suggested_assignee: string | null;

  /** Questions to ask for clarification */
  clarifying_questions: string[];

  /** Enhanced/improved issue description */
  enhanced_description: string | null;

  /** Explanation of AI's reasoning */
  reasoning: string;

  /** Whether this task requires subtasks to be created */
  needs_subtasks: boolean;

  /** New subtasks to create (if needs_subtasks is true) */
  subtasks_to_create: SubtaskInfo[];

  /** Feedback on existing subtasks */
  subtask_feedback: SubtaskFeedback[];

  /** Overall feedback on subtasks as a whole with respect to parent */
  overall_subtask_feedback: string | null;
}

/**
 * GitHub Project V2 field types
 */
export interface ProjectField {
  id: string;
  name: string;
}

export interface ProjectSingleSelectField extends ProjectField {
  options: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Project configuration
 */
export interface ProjectConfig {
  owner: string;
  number: number;
  id?: string;
}

/**
 * Action context
 */
export interface ActionContext {
  octokit: InstanceType<typeof GitHub>;
  context: typeof github.context;
  issueNumber: number;
  owner: string;
  repo: string;
}

/**
 * Project field IDs (cached after fetching)
 */
export interface ProjectFields {
  projectId: string;
  status: ProjectSingleSelectField;
  priority: ProjectSingleSelectField;
  size: ProjectSingleSelectField;
}
