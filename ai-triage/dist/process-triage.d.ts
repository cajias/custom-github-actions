/**
 * Process triage analysis and update GitHub issue
 */
import { ActionContext, TriageAnalysis } from "./types";
/**
 * Process the AI triage analysis and update the issue accordingly
 */
export declare function processTriageAnalysis(ctx: ActionContext, analysis: TriageAnalysis): Promise<void>;
