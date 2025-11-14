/**
 * Homebrew formula update utilities
 */

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import { FormulaUpdate } from "./types";

/**
 * Calculate SHA256 hash of a file from URL
 */
export async function calculateSHA256(url: string): Promise<string> {
  core.info(`Calculating SHA256 for: ${url}`);

  let output = "";
  let errorOutput = "";

  await exec.exec("bash", ["-c", `curl -sL "${url}" | shasum -a 256`], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        errorOutput += data.toString();
      },
    },
  });

  if (errorOutput) {
    core.warning(`SHA256 calculation stderr: ${errorOutput}`);
  }

  const sha256 = output.trim().split(/\s+/)[0];

  if (!sha256 || sha256.length !== 64) {
    throw new Error(`Invalid SHA256 hash: ${sha256}`);
  }

  core.info(`SHA256: ${sha256}`);
  return sha256;
}

/**
 * Update Homebrew formula file
 */
export async function updateFormula(
  formulaPath: string,
  update: FormulaUpdate,
): Promise<void> {
  core.info(`Updating formula at: ${formulaPath}`);

  if (!fs.existsSync(formulaPath)) {
    throw new Error(`Formula file not found: ${formulaPath}`);
  }

  let content = fs.readFileSync(formulaPath, "utf8");

  // Update version
  content = content.replace(/version\s+"[^"]*"/, `version "${update.version}"`);

  // Update URL
  content = content.replace(/url\s+"[^"]*"/, `url "${update.url}"`);

  // Update SHA256
  content = content.replace(/sha256\s+"[^"]*"/, `sha256 "${update.sha256}"`);

  fs.writeFileSync(formulaPath, content, "utf8");
  core.info("Formula updated successfully");
}

/**
 * Checkout a repository to a specified path
 */
export async function checkoutRepository(
  repoUrl: string,
  token: string,
  targetPath: string,
): Promise<void> {
  core.info(`Checking out repository to: ${targetPath}`);

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  // Clone the repository with authentication
  const authenticatedUrl = repoUrl.replace(
    "https://github.com/",
    `https://x-access-token:${token}@github.com/`,
  );

  await exec.exec("git", ["clone", authenticatedUrl, targetPath]);
  core.info("Repository checked out successfully");
}

/**
 * Commit and push changes to a repository
 */
export async function commitAndPush(
  repoPath: string,
  filePaths: string[],
  commitMessage: string,
  userEmail: string = "actions@github.com",
  userName: string = "GitHub Actions",
): Promise<void> {
  core.info(`Committing changes in: ${repoPath}`);

  // Configure git
  await exec.exec("git", ["config", "user.email", userEmail], {
    cwd: repoPath,
  });
  await exec.exec("git", ["config", "user.name", userName], {
    cwd: repoPath,
  });

  // Add files
  for (const filePath of filePaths) {
    await exec.exec("git", ["add", filePath], {
      cwd: repoPath,
    });
  }

  // Commit
  await exec.exec("git", ["commit", "-m", commitMessage], {
    cwd: repoPath,
  });

  // Push
  await exec.exec("git", ["push"], {
    cwd: repoPath,
  });

  core.info("Changes committed and pushed successfully");
}
