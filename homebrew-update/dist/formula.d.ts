/**
 * Homebrew formula update utilities
 */
import { FormulaUpdate } from "./types";
/**
 * Calculate SHA256 hash of a file from URL
 */
export declare function calculateSHA256(url: string): Promise<string>;
/**
 * Update Homebrew formula file
 */
export declare function updateFormula(formulaPath: string, update: FormulaUpdate): Promise<void>;
/**
 * Checkout a repository to a specified path
 */
export declare function checkoutRepository(repoUrl: string, token: string, targetPath: string): Promise<void>;
/**
 * Commit and push changes to a repository
 */
export declare function commitAndPush(repoPath: string, filePaths: string[], commitMessage: string, userEmail?: string, userName?: string): Promise<void>;
