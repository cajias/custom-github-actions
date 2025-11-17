/**
 * Subtask discovery and dependency parsing
 */
import * as github from "@actions/github";
import { Subtask } from "./types";
/**
 * Find all subtasks for a given parent issue
 */
export declare function findSubtasks(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, parentNumber: number): Promise<Subtask[]>;
/**
 * Parse dependency information from issue body and labels
 */
export declare function parseDependencies(body: string, labels: string[]): number[];
/**
 * Check if an issue is closed
 */
export declare function isIssueClosed(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, issueNumber: number): Promise<boolean>;
