/**
 * AI-powered issue analysis using multiple model providers
 */
import { ActionContext, TriageAnalysis, ExistingSubtask } from "./types";
/**
 * Analyze issue using AI model (supports multiple providers)
 */
export declare function analyzeIssue(
  ctx: ActionContext,
  model: string,
  anthropicKey: string,
  openaiKey: string,
  githubToken: string,
  existingSubtasks?: ExistingSubtask[],
): Promise<TriageAnalysis>;
