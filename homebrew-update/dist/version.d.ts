/**
 * Version generation utilities
 */
import { VersionInfo } from "./types";
/**
 * Generate version based on the specified strategy
 */
export declare function generateVersion(strategy: "date-commit" | "semver" | "custom", customVersion?: string): Promise<VersionInfo>;
/**
 * Check if a git tag already exists
 */
export declare function tagExists(tag: string): Promise<boolean>;
/**
 * Create a git tag
 */
export declare function createTag(tag: string, message: string): Promise<void>;
/**
 * Push a git tag to remote
 */
export declare function pushTag(tag: string): Promise<void>;
