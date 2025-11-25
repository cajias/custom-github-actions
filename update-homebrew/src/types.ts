/**
 * Type definitions for the update-homebrew action
 */

export interface ActionInputs {
  githubToken: string;
  tapRepoToken: string;
  githubUser: string;
  sourceRepo: string;
  tapRepo: string;
  formulaName: string;
  formulaPath: string;
  versionStrategy: "date-commit" | "semver-tag" | "custom";
  customVersion: string;
  customReleaseNotes: string;
  skipIfExists: boolean;
}

export interface VersionInfo {
  version: string;
  tag: string;
  commitSha: string;
}

export interface ReleaseInfo {
  version: string;
  tag: string;
  url: string;
  tarballUrl: string;
}

export interface FormulaUpdateInfo {
  version: string;
  url: string;
  sha256: string;
}
