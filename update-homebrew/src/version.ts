/**
 * Version generation utilities
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { ActionInputs, VersionInfo } from "./types";

/**
 * Generate version based on the configured strategy
 */
export async function generateVersion(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
): Promise<VersionInfo> {
  const context = github.context;
  const commitSha = context.sha;

  core.info(`Using version strategy: ${inputs.versionStrategy}`);

  switch (inputs.versionStrategy) {
    case "date-commit":
      return generateDateCommitVersion(commitSha);
    case "semver-tag":
      return await generateSemverTagVersion(inputs, octokit, commitSha);
    case "custom":
      return generateCustomVersion(inputs, commitSha);
    default:
      throw new Error(`Unknown version strategy: ${inputs.versionStrategy}`);
  }
}

/**
 * Generate version based on date and commit hash
 * Format: YYYY.MM.DD-shortsha
 */
function generateDateCommitVersion(commitSha: string): VersionInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const shortSha = commitSha.substring(0, 7);

  const version = `${year}.${month}.${day}-${shortSha}`;
  const tag = `v${version}`;

  core.info(`Generated date-commit version: ${version}`);

  return {
    version,
    tag,
    commitSha,
  };
}

/**
 * Generate version based on semver tags
 * Uses the latest tag and increments patch version
 */
async function generateSemverTagVersion(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  commitSha: string,
): Promise<VersionInfo> {
  try {
    // Get the latest release
    const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
      owner: inputs.githubUser,
      repo: inputs.sourceRepo,
    });

    const latestTag = latestRelease.tag_name;
    core.info(`Latest release tag: ${latestTag}`);

    // Parse semver (expecting vX.Y.Z format)
    const match = latestTag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error(
        `Latest tag ${latestTag} is not in semver format (X.Y.Z)`,
      );
    }

    const [, major, minor, patch] = match;
    const newPatch = parseInt(patch, 10) + 1;
    const version = `${major}.${minor}.${newPatch}`;
    const tag = `v${version}`;

    core.info(`Generated semver version: ${version}`);

    return {
      version,
      tag,
      commitSha,
    };
  } catch (error: any) {
    if (error.status === 404) {
      // No releases yet, start with 1.0.0
      core.info("No previous releases found, starting with 1.0.0");
      return {
        version: "1.0.0",
        tag: "v1.0.0",
        commitSha,
      };
    }
    throw error;
  }
}

/**
 * Generate custom version
 */
function generateCustomVersion(
  inputs: ActionInputs,
  commitSha: string,
): VersionInfo {
  if (!inputs.customVersion) {
    throw new Error(
      "custom_version input is required when using custom strategy",
    );
  }

  const version = inputs.customVersion;
  const tag = version.startsWith("v") ? version : `v${version}`;

  core.info(`Using custom version: ${version}`);

  return {
    version,
    tag,
    commitSha,
  };
}

/**
 * Check if a release already exists for the given tag
 */
export async function releaseExists(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  tag: string,
): Promise<boolean> {
  try {
    await octokit.rest.repos.getReleaseByTag({
      owner: inputs.githubUser,
      repo: inputs.sourceRepo,
      tag,
    });
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}
