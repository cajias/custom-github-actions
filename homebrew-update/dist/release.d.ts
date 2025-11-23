/**
 * GitHub Release creation utilities
 */
import { ReleaseInfo } from "./types";
/**
 * Create a GitHub Release
 */
export declare function createRelease(token: string, owner: string, repo: string, tagName: string, releaseName: string, body: string, commitSha: string): Promise<ReleaseInfo>;
/**
 * Generate release notes from template
 */
export declare function generateReleaseNotes(template: string | undefined, version: string, commitHash: string, commitSha: string): string;
