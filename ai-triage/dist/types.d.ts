/**
 * Type definitions for AI-powered issue triage
 */
import { GitHub } from "@actions/github/lib/utils";
import * as github from "@actions/github";
export type Priority = "P0" | "P1" | "P2";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type Status = "Backlog" | "Ready" | "In progress" | "In review" | "Done";
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
