/**
 * Type definitions for Copilot Subtask Manager
 */

export interface Subtask {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  assignees: string[];
  dependencies: number[];
}

export interface SubtaskAnalysis {
  number: number;
  title: string;
  dependencies: number[];
  hasAssignees: boolean;
  state: string;
  isReady: boolean;
  unresolvedDependencies: number[];
}
