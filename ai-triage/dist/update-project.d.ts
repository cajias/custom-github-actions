/**
 * Update GitHub Project V2 fields
 */
import { ActionContext, TriageAnalysis, ProjectConfig } from "./types";
/**
 * Add issue to project and update fields
 */
export declare function updateProjectFields(ctx: ActionContext, analysis: TriageAnalysis, projectConfig: ProjectConfig): Promise<void>;
