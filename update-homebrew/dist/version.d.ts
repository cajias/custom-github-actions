/**
 * Version generation utilities
 */
import * as github from "@actions/github";
import { ActionInputs, VersionInfo } from "./types";
/**
 * Generate version based on the configured strategy
 */
export declare function generateVersion(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>): Promise<VersionInfo>;
/**
 * Check if a release already exists for the given tag
 */
export declare function releaseExists(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>, tag: string): Promise<boolean>;
