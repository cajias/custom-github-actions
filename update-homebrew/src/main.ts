/**
 * Update Homebrew Formula GitHub Action
 *
 * This action automatically updates a Homebrew formula when a project is released:
 * - Generates version based on strategy (date-commit, semver-tag, custom)
 * - Creates GitHub release with tag
 * - Calculates SHA256 for release tarball
 * - Updates Homebrew formula with new version, URL, and SHA256
 * - Commits and pushes changes to tap repository
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { ActionInputs } from "./types";
import { generateVersion, releaseExists } from "./version";
import { createRelease, getReleaseTarballUrl } from "./release";
import {
  calculateTarballSha256,
  updateFormula,
  verifyFormula,
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
      (core.getInput("version_strategy") as
        | "date-commit"
        | "semver-tag"
        | "custom") || "date-commit",
    customVersion: core.getInput("custom_version") || "",
    customReleaseNotes: core.getInput("custom_release_notes") || "",
    skipIfExists: core.getInput("skip_if_exists") === "true",
  };
}

/**
 * Main action entry point
 */
async function run(): Promise<void> {
  try {
    core.info("🍺 Starting Homebrew formula update...");

    // Get inputs
    const inputs = getInputs();

    // Initialize GitHub clients
    const sourceOctokit = github.getOctokit(inputs.githubToken);
    const tapOctokit = github.getOctokit(inputs.tapRepoToken);

    core.info(`Source repository: ${inputs.githubUser}/${inputs.sourceRepo}`);
    core.info(`Tap repository: ${inputs.githubUser}/${inputs.tapRepo}`);
    core.info(`Formula: ${inputs.formulaPath}`);

    // Step 1: Verify formula exists
    core.info("\n📋 Step 1: Verifying formula exists...");
    const formulaExists = await verifyFormula(inputs, tapOctokit);
    if (!formulaExists) {
      throw new Error(
        `Formula file not found: ${inputs.formulaPath} in ${inputs.githubUser}/${inputs.tapRepo}`,
      );
    }
    core.info("✅ Formula file found");

    // Step 2: Generate version
    core.info("\n🔢 Step 2: Generating version...");
    const versionInfo = await generateVersion(inputs, sourceOctokit);
    core.info(`Version: ${versionInfo.version}`);
    core.info(`Tag: ${versionInfo.tag}`);
    core.info(`Commit: ${versionInfo.commitSha}`);

    // Step 3: Check if release already exists
    core.info("\n🔍 Step 3: Checking if release already exists...");
    const exists = await releaseExists(inputs, sourceOctokit, versionInfo.tag);
    if (exists) {
      if (inputs.skipIfExists) {
        core.info(`Release ${versionInfo.tag} already exists. Skipping.`);
        core.setOutput("version", versionInfo.version);
        core.setOutput("release_url", "");
        core.setOutput("formula_updated", "false");
        return;
      } else {
        throw new Error(
          `Release ${versionInfo.tag} already exists. Set skip_if_exists to true to skip.`,
        );
      }
    }
    core.info("✅ Release does not exist, proceeding...");

    // Step 4: Create release
    core.info("\n🚀 Step 4: Creating GitHub release...");
    const releaseInfo = await createRelease(inputs, sourceOctokit, versionInfo);
    core.info(`Release URL: ${releaseInfo.url}`);

    // Step 5: Get tarball URL
    core.info("\n📦 Step 5: Getting release tarball URL...");
    const tarballUrl = await getReleaseTarballUrl(
      inputs,
      sourceOctokit,
      versionInfo.tag,
    );
    core.info(`Tarball URL: ${tarballUrl}`);

    // Step 6: Calculate SHA256
    core.info("\n🔐 Step 6: Calculating tarball SHA256...");
    const sha256 = await calculateTarballSha256(tarballUrl, inputs.githubToken);

    // Step 7: Update formula
    core.info("\n✏️  Step 7: Updating Homebrew formula...");
    await updateFormula(inputs, tapOctokit, {
      version: versionInfo.version,
      url: tarballUrl,
      sha256,
    });

    // Set outputs
    core.setOutput("version", versionInfo.version);
    core.setOutput("release_url", releaseInfo.url);
    core.setOutput("formula_updated", "true");

    core.info("\n✅ Homebrew formula update complete!");
    core.info(`Version: ${versionInfo.version}`);
    core.info(`Release: ${releaseInfo.url}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed(`Action failed with unknown error: ${error}`);
    }
  }
}

// Run the action
run();
