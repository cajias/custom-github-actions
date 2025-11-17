/**
 * GitHub release creation utilities
 */
import * as github from "@actions/github";
import { ActionInputs, VersionInfo, ReleaseInfo } from "./types";
/**
 * Create a GitHub release
 */
export declare function createRelease(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>, versionInfo: VersionInfo): Promise<ReleaseInfo>;
/**
 * Get the tarball URL for a release
 */
export declare function getReleaseTarballUrl(inputs: ActionInputs, octokit: ReturnType<typeof github.getOctokit>, tag: string): Promise<string>;
