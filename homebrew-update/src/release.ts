/**
 * GitHub Release creation utilities
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { ReleaseInfo } from "./types";

/**
 * Create a GitHub Release
 */
export async function createRelease(
  token: string,
  owner: string,
  repo: string,
  tagName: string,
  releaseName: string,
  body: string,
  commitSha: string,
): Promise<ReleaseInfo> {
  const octokit = github.getOctokit(token);

  core.info(`Creating release for tag: ${tagName}`);

  const response = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    name: releaseName,
    body,
    target_commitish: commitSha,
    generate_release_notes: true,
  });

  const releaseUrl = response.data.html_url;
  const tarballUrl =
    response.data.tarball_url ||
    `https://github.com/${owner}/${repo}/archive/refs/tags/${tagName}.tar.gz`;

  core.info(`Release created: ${releaseUrl}`);

  return {
    tagName,
    releaseUrl,
    tarballUrl,
  };
}

/**
 * Generate release notes from template
 */
export function generateReleaseNotes(
  template: string | undefined,
  version: string,
  commitHash: string,
  commitSha: string,
): string {
  if (template) {
    return template
      .replace(/\{VERSION\}/g, version)
      .replace(/\{COMMIT_HASH\}/g, commitHash)
      .replace(/\{COMMIT_SHA\}/g, commitSha);
  }

  return `Automated release of version ${version}

Contains the latest changes as of commit ${commitSha}`;
}
