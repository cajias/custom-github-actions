/**
 * Handle subtask operations - fetching existing subtasks and creating new ones
 */
import { ActionContext, SubtaskInfo, SubtaskFeedback } from "./types";
/**
 * Fetch existing subtasks for an issue
 * Subtasks are identified by issues that reference the parent issue
 */
export declare function fetchExistingSubtasks(ctx: ActionContext): Promise<Array<{
    number: number;
    title: string;
    body: string;
    state: string;
}>>;
/**
 * Create new subtasks for an issue
 */
export declare function createSubtasks(ctx: ActionContext, subtasks: SubtaskInfo[]): Promise<number[]>;
/**
 * Post feedback on existing subtasks
 */
export declare function postSubtaskFeedback(ctx: ActionContext, feedback: SubtaskFeedback[], overallFeedback: string | null): Promise<void>;
