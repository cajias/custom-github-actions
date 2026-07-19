/**
 * Type definitions for Homebrew Update Action
 */
export interface VersionInfo {
  version: string;
  tag: string;
  commitHash: string;
}
export interface ReleaseInfo {
  tagName: string;
  releaseUrl: string;
}
