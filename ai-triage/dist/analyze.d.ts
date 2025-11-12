/**
 * AI-powered issue analysis using GitHub Models
 */
import { ActionContext, TriageAnalysis } from './types';
/**
 * Analyze issue using GitHub Models API
 */
export declare function analyzeIssue(ctx: ActionContext, model?: string): Promise<TriageAnalysis>;
