/**
 * GitHub release creation utilities
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { ActionInputs, VersionInfo, ReleaseInfo } from "./types";

/**
 * Create a GitHub release
 */
export async function createRelease(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  versionInfo: VersionInfo,
): Promise<ReleaseInfo> {
  core.info(`Creating release ${versionInfo.tag}...`);

  // Generate release notes
  const releaseNotes = generateReleaseNotes(inputs, versionInfo);

  try {
    const { data: release } = await octokit.rest.repos.createRelease({
      owner: inputs.githubUser,
      repo: inputs.sourceRepo,
      tag_name: versionInfo.tag,
      name: versionInfo.tag,
      body: releaseNotes,
      draft: false,
      prerelease: false,
      target_commitish: versionInfo.commitSha,
    });

    core.info(`✅ Release created: ${release.html_url}`);

    return {
      version: versionInfo.version,
      tag: versionInfo.tag,
      url: release.html_url,
      tarballUrl: release.tarball_url || "",
    };
  } catch (error: any) {
    throw new Error(`Failed to create release: ${error.message}`);
  }
}

/**
 * Generate release notes
 */
function generateReleaseNotes(
  inputs: ActionInputs,
  versionInfo: VersionInfo,
): string {
  if (inputs.customReleaseNotes) {
    return inputs.customReleaseNotes
      .replace(/\$\{version\}/g, versionInfo.version)
      .replace(/\$\{tag\}/g, versionInfo.tag)
      .replace(/\$\{commitSha\}/g, versionInfo.commitSha);
  }

  // Default release notes
  return `Release ${versionInfo.version}

## Changes
This release includes the latest changes from commit ${versionInfo.commitSha.substring(0, 7)}.

## Installation
Update your Homebrew formula to use this version.`;
}

/**
 * Get the tarball URL for a release
 */
export async function getReleaseTarballUrl(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  tag: string,
): Promise<string> {
  try {
    const { data: release } = await octokit.rest.repos.getReleaseByTag({
      owner: inputs.githubUser,
      repo: inputs.sourceRepo,
      tag,
    });

    if (!release.tarball_url) {
      throw new Error("Release tarball URL is not available");
    }
    return release.tarball_url;
  } catch (error: any) {
    throw new Error(`Failed to get release tarball URL: ${error.message}`);
  }
}
