/**
 * AI-powered issue analysis using multiple model providers
 */
import { ActionContext, TriageAnalysis } from "./types";
/**
 * Analyze issue using AI model (supports multiple providers)
 */
export declare function analyzeIssue(ctx: ActionContext, model: string, anthropicKey: string, openaiKey: string, githubToken: string, existingSubtasks?: Array<{
    number: number;
    title: string;
    body: string;
    state: string;
}>): Promise<TriageAnalysis>;
