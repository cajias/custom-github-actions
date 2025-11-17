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
export interface AssignmentResult {
    number: number;
    success: boolean;
    error?: string;
}
export interface ParentIssueContext {
    number: number;
    title: string;
    assignee: string | null;
}
export interface EventContext {
    eventName: string;
    action: string;
    isCopilotAssignment: boolean;
    isSubtaskCompletion: boolean;
    parentIssueNumber?: number;
    completedSubtaskNumber?: number;
}
