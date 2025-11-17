/**
 * Type definitions for Homebrew Update Action
 */
export interface ActionInputs {
    githubToken: string;
    tapRepoToken: string;
    githubUser: string;
    sourceRepo: string;
    tapRepo: string;
    formulaName: string;
    formulaPath: string;
    versionStrategy: "date-commit" | "semver" | "custom";
    customVersion?: string;
    releaseNotesTemplate?: string;
}
export interface VersionInfo {
    version: string;
    tag: string;
    commitHash: string;
}
export interface ReleaseInfo {
    tagName: string;
    releaseUrl: string;
    tarballUrl: string;
}
export interface FormulaUpdate {
    version: string;
    url: string;
    sha256: string;
}
