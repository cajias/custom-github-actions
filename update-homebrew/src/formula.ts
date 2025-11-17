/**
 * Homebrew formula update utilities
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as crypto from "crypto";
import { ActionInputs, FormulaUpdateInfo } from "./types";

/**
 * Calculate SHA256 hash of a tarball
 */
export async function calculateTarballSha256(
  tarballUrl: string,
  token: string,
): Promise<string> {
  core.info(`Calculating SHA256 for ${tarballUrl}...`);

  try {
    // Use native fetch with authorization
    const response = await fetch(tarballUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tarball: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const hash = crypto.createHash("sha256");
    hash.update(Buffer.from(buffer));
    const sha256 = hash.digest("hex");

    core.info(`✅ SHA256: ${sha256}`);
    return sha256;
  } catch (error: any) {
    throw new Error(`Failed to calculate SHA256: ${error.message}`);
  }
}

/**
 * Update the Homebrew formula file
 */
export async function updateFormula(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  updateInfo: FormulaUpdateInfo,
): Promise<void> {
  core.info(`Updating formula ${inputs.formulaName}...`);

  try {
    // Get current formula content
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner: inputs.githubUser,
      repo: inputs.tapRepo,
      path: inputs.formulaPath,
    });

    if (!("content" in fileData) || Array.isArray(fileData)) {
      throw new Error("Formula file not found or is a directory");
    }

    const currentContent = Buffer.from(fileData.content, "base64").toString(
      "utf-8",
    );

    // Update the formula content
    const updatedContent = updateFormulaContent(
      currentContent,
      updateInfo.version,
      updateInfo.url,
      updateInfo.sha256,
    );

    // Commit the updated formula
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: inputs.githubUser,
      repo: inputs.tapRepo,
      path: inputs.formulaPath,
      message: `Update ${inputs.formulaName} to ${updateInfo.version}`,
      content: Buffer.from(updatedContent).toString("base64"),
      sha: fileData.sha,
      branch: "main",
    });

    core.info(`✅ Formula updated to version ${updateInfo.version}`);
  } catch (error: any) {
    throw new Error(`Failed to update formula: ${error.message}`);
  }
}

/**
 * Update the formula content with new version, URL, and SHA256
 */
function updateFormulaContent(
  content: string,
  version: string,
  url: string,
  sha256: string,
): string {
  let updated = content;

  // Update version
  // Look for patterns like: version "X.Y.Z"
  updated = updated.replace(/version\s+"[^"]+"/, `version "${version}"`);

  // Update URL
  // Look for patterns like: url "https://..."
  updated = updated.replace(/url\s+"[^"]+"/, `url "${url}"`);

  // Update SHA256
  // Look for patterns like: sha256 "abc123..."
  updated = updated.replace(/sha256\s+"[^"]+"/, `sha256 "${sha256}"`);

  return updated;
}

/**
 * Verify formula file exists in tap repository
 */
export async function verifyFormula(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
): Promise<boolean> {
  try {
    await octokit.rest.repos.getContent({
      owner: inputs.githubUser,
      repo: inputs.tapRepo,
      path: inputs.formulaPath,
    });
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}
