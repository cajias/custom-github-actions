/**
 * Homebrew Auto-Update GitHub Action
 *
 * This action automatically updates Homebrew formulas when a project is released.
 * It supports multiple versioning strategies and handles the complete workflow:
 * - Generate version based on strategy (date-based, semver, custom)
 * - Create GitHub release with tag
 * - Update Homebrew formula with new version and SHA256
 * - Commit and push changes to tap repository
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import { ActionInputs } from "./types";
import { generateVersion, tagExists, createTag, pushTag } from "./version";
import { createRelease, generateReleaseNotes } from "./release";
import {
  calculateSHA256,
  updateFormula,
  checkoutRepository,
  commitAndPush,
} from "./formula";

/**
 * Get and validate action inputs
 */
function getInputs(): ActionInputs {
  return {
    githubToken: core.getInput("github_token", { required: true }),
    tapRepoToken: core.getInput("tap_repo_token", { required: true }),
    githubUser: core.getInput("github_user", { required: true }),
    sourceRepo: core.getInput("source_repo", { required: true }),
    tapRepo: core.getInput("tap_repo", { required: true }),
    formulaName: core.getInput("formula_name", { required: true }),
    formulaPath: core.getInput("formula_path", { required: true }),
    versionStrategy:
      (core.getInput("version_strategy", { required: false }) as
        | "date-commit"
        | "semver"
        | "custom") || "date-commit",
    customVersion:
      core.getInput("custom_version", { required: false }) || undefined,
    releaseNotesTemplate:
      core.getInput("release_notes_template", { required: false }) || undefined,
  };
}

/**
 * Main action execution
 */
async function run(): Promise<void> {
  try {
    core.info("🍺 Starting Homebrew Auto-Update Action");

    // Get inputs
    const inputs = getInputs();
    core.info(`Repository: ${inputs.githubUser}/${inputs.sourceRepo}`);
    core.info(`Tap: ${inputs.githubUser}/${inputs.tapRepo}`);
    core.info(`Formula: ${inputs.formulaName}`);
    core.info(`Version Strategy: ${inputs.versionStrategy}`);

    // Step 1: Generate version
    core.startGroup("📌 Generating version");
    const versionInfo = await generateVersion(
      inputs.versionStrategy,
      inputs.customVersion,
    );
    core.info(`Version: ${versionInfo.version}`);
    core.info(`Tag: ${versionInfo.tag}`);
    core.info(`Commit: ${versionInfo.commitHash}`);
    core.endGroup();

    // Step 2: Create or verify tag
    core.startGroup("🏷️  Creating release tag");
    const exists = await tagExists(versionInfo.tag);
    if (exists) {
      core.warning(
        `Tag ${versionInfo.tag} already exists, skipping tag creation`,
      );
    } else {
      await createTag(
        versionInfo.tag,
        `Release version ${versionInfo.version}`,
      );
      await pushTag(versionInfo.tag);
    }
    core.endGroup();

    // Step 3: Create GitHub Release
    core.startGroup("📦 Creating GitHub Release");
    const releaseBody = generateReleaseNotes(
      inputs.releaseNotesTemplate,
      versionInfo.version,
      versionInfo.commitHash,
      github.context.sha,
    );

    const releaseInfo = await createRelease(
      inputs.githubToken,
      inputs.githubUser,
      inputs.sourceRepo,
      versionInfo.tag,
      `Release ${versionInfo.tag}`,
      releaseBody,
      github.context.sha,
    );
    core.info(`Release URL: ${releaseInfo.releaseUrl}`);
    core.endGroup();

    // Step 4: Calculate SHA256 of release tarball
    core.startGroup("🔐 Calculating SHA256");
    const tarballUrl = `https://github.com/${inputs.githubUser}/${inputs.sourceRepo}/archive/refs/tags/${versionInfo.tag}.tar.gz`;
    const sha256 = await calculateSHA256(tarballUrl);
    core.endGroup();

    // Step 5: Checkout tap repository
    core.startGroup("📥 Checking out tap repository");
    const tapRepoPath = path.join(process.cwd(), "tap-repo-checkout");
    const tapRepoUrl = `https://github.com/${inputs.githubUser}/${inputs.tapRepo}`;
    await checkoutRepository(tapRepoUrl, inputs.tapRepoToken, tapRepoPath);
    core.endGroup();

    // Step 6: Update formula
    core.startGroup("✏️  Updating Homebrew formula");
    const formulaFullPath = path.join(tapRepoPath, inputs.formulaPath);
    await updateFormula(formulaFullPath, {
      version: versionInfo.version,
      url: tarballUrl,
      sha256,
    });
    core.endGroup();

    // Step 7: Commit and push changes
    core.startGroup("🚀 Committing and pushing changes");
    await commitAndPush(
      tapRepoPath,
      [inputs.formulaPath],
      `Update ${inputs.formulaName} formula to ${versionInfo.version}`,
    );
    core.endGroup();

    // Set outputs
    core.setOutput("version", versionInfo.version);
    core.setOutput("tag", versionInfo.tag);
    core.setOutput("release_url", releaseInfo.releaseUrl);
    core.setOutput("formula_path", formulaFullPath);

    core.info("✅ Homebrew formula updated successfully!");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed("Action failed with an unknown error");
    }
  }
}

// Run the action
run();
