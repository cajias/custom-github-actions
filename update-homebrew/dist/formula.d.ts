/**
 * Homebrew formula update utilities
 */
import * as github from "@actions/github";
import { ActionInputs, FormulaUpdateInfo } from "./types";
/**
 * Calculate SHA256 hash of a tarball
 */
export declare function calculateTarballSha256(tarballUrl: string, token: string): Promise<string>;
/**
 * Update the Homebrew formula file
 */
export declare function updateFormula(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>, updateInfo: FormulaUpdateInfo): Promise<void>;
/**
 * Verify formula file exists in tap repository
 */
export declare function verifyFormula(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>): Promise<boolean>;
