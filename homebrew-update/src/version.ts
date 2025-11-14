/**
 * Version generation utilities
 */

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { VersionInfo } from "./types";

/**
 * Get the short commit hash from git
 */
async function getCommitHash(): Promise<string> {
  let output = "";
  await exec.exec("git", ["rev-parse", "--short", "HEAD"], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output.trim();
}

/**
 * Get the current date in YYYYMMDD format
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get the latest semver tag from git
 */
async function getLatestSemverTag(): Promise<string | null> {
  let output = "";
  try {
    await exec.exec("git", ["describe", "--tags", "--abbrev=0"], {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
      ignoreReturnCode: true,
    });
    const tag = output.trim();
    return tag || null;
  } catch {
    return null;
  }
}

/**
 * Generate version based on the specified strategy
 */
export async function generateVersion(
  strategy: "date-commit" | "semver" | "custom",
  customVersion?: string,
): Promise<VersionInfo> {
  const commitHash = await getCommitHash();

  let version: string;
  let tag: string;

  switch (strategy) {
    case "date-commit": {
      const date = getCurrentDate();
      version = `${date}.${commitHash}`;
      tag = `v${version}`;
      core.info(`Generated date-based version: ${version}`);
      break;
    }

    case "semver": {
      const latestTag = await getLatestSemverTag();
      if (latestTag) {
        // Remove 'v' prefix if present
        const currentVersion = latestTag.replace(/^v/, "");
        const parts = currentVersion.split(".");

        // Increment patch version
        if (parts.length === 3) {
          parts[2] = String(parseInt(parts[2], 10) + 1);
          version = parts.join(".");
        } else {
          // Fallback if tag format is unexpected
          version = `${currentVersion}.1`;
        }
      } else {
        // No existing tags, start with 1.0.0
        version = "1.0.0";
      }
      tag = `v${version}`;
      core.info(
        `Generated semver version: ${version} (previous: ${latestTag || "none"})`,
      );
      break;
    }

    case "custom": {
      if (!customVersion) {
        throw new Error(
          "Custom version strategy requires custom_version input",
        );
      }
      version = customVersion;
      tag = customVersion.startsWith("v") ? customVersion : `v${customVersion}`;
      core.info(`Using custom version: ${version}`);
      break;
    }

    default:
      throw new Error(`Unknown version strategy: ${strategy}`);
  }

  return {
    version,
    tag,
    commitHash,
  };
}

/**
 * Check if a git tag already exists
 */
export async function tagExists(tag: string): Promise<boolean> {
  let output = "";
  const exitCode = await exec.exec("git", ["tag", "-l", tag], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    ignoreReturnCode: true,
  });

  return exitCode === 0 && output.trim() === tag;
}

/**
 * Create a git tag
 */
export async function createTag(tag: string, message: string): Promise<void> {
  await exec.exec("git", ["tag", "-a", tag, "-m", message]);
  core.info(`Created tag: ${tag}`);
}

/**
 * Push a git tag to remote
 */
export async function pushTag(tag: string): Promise<void> {
  await exec.exec("git", ["push", "origin", tag]);
  core.info(`Pushed tag: ${tag}`);
}
