/**
 * Update GitHub Project V2 fields
 */

import * as core from "@actions/core";
import {
  ActionContext,
  TriageAnalysis,
  ProjectConfig,
  ProjectFields,
  ProjectSingleSelectField,
} from "./types";

/**
 * Add issue to project and update fields
 */
export async function updateProjectFields(
  ctx: ActionContext,
  analysis: TriageAnalysis,
  projectConfig: ProjectConfig,
): Promise<void> {
  core.info("Updating project fields...");

  // Get project fields
  const fields = await getProjectFields(ctx, projectConfig);

  // Add issue to project
  const itemId = await addIssueToProject(ctx, fields.projectId);

  // Update fields
  const targetStatus = analysis.is_agent_ready ? "Ready" : "Backlog";
  await updateField(ctx, fields, itemId, "status", targetStatus);
  await updateField(ctx, fields, itemId, "priority", analysis.priority);
  await updateField(ctx, fields, itemId, "size", analysis.size);

  core.info("✅ Project fields updated");
}

/**
 * Fetch project fields and their IDs
 */
async function getProjectFields(
  ctx: ActionContext,
  projectConfig: ProjectConfig,
): Promise<ProjectFields> {
  core.info(`Fetching project fields for project #${projectConfig.number}...`);

  const query = `
    query($owner: String!, $number: Int!) {
      user(login: $owner) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
      organization(login: $owner) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const result: any = await ctx.octokit.graphql(query, {
    owner: projectConfig.owner,
    number: projectConfig.number,
  });

  // Try user project first, then organization project
  const project = result.user?.projectV2 || result.organization?.projectV2;

  if (!project) {
    throw new Error(
      `Could not find ProjectV2 with number ${projectConfig.number} for owner ${projectConfig.owner}`,
    );
  }

  const projectId = project.id;
  const fieldNodes = project.fields.nodes;

  const statusField = fieldNodes.find(
    (f: any) => f.name === "Status",
  ) as ProjectSingleSelectField;
  const priorityField = fieldNodes.find(
    (f: any) => f.name === "Priority",
  ) as ProjectSingleSelectField;
  const sizeField = fieldNodes.find(
    (f: any) => f.name === "Size",
  ) as ProjectSingleSelectField;

  if (!statusField || !priorityField || !sizeField) {
    throw new Error(
      "Required project fields not found (Status, Priority, Size)",
    );
  }

  core.info("✅ Project fields fetched");

  return {
    projectId,
    status: statusField,
    priority: priorityField,
    size: sizeField,
  };
}

/**
 * Add issue to project
 */
async function addIssueToProject(
  ctx: ActionContext,
  projectId: string,
): Promise<string> {
  core.info("Adding issue to project...");

  const mutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
  `;

  const issueNodeId = ctx.context.payload.issue?.node_id;
  if (!issueNodeId) {
    throw new Error("Issue node_id not found in context");
  }

  const result: any = await ctx.octokit.graphql(mutation, {
    projectId,
    contentId: issueNodeId,
  });

  if (
    !result.addProjectV2ItemById ||
    !result.addProjectV2ItemById.item ||
    !result.addProjectV2ItemById.item.id
  ) {
    throw new Error(
      "Invalid response from GitHub API when adding issue to project",
    );
  }

  const itemId = result.addProjectV2ItemById.item.id;
  core.info(`✅ Added to project, item ID: ${itemId}`);

  return itemId;
}

/**
 * Update a project field to the option matching the given value
 */
async function updateField(
  ctx: ActionContext,
  fields: ProjectFields,
  itemId: string,
  fieldName: "status" | "priority" | "size",
  value: string,
): Promise<void> {
  const field = fields[fieldName];
  const option = field.options.find((o) => o.name === value);

  if (!option) {
    const label = fieldName[0].toUpperCase() + fieldName.slice(1);
    core.warning(`${label} option "${value}" not found`);
    return;
  }

  await updateSingleSelectField(
    ctx,
    fields.projectId,
    itemId,
    field.id,
    option.id,
  );

  core.info(`Set ${fieldName} to: ${value}`);
}

/**
 * Update a single select field (generic helper)
 */
async function updateSingleSelectField(
  ctx: ActionContext,
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string,
): Promise<void> {
  const mutation = `
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: {singleSelectOptionId: $value}
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;

  await ctx.octokit.graphql(mutation, {
    projectId,
    itemId,
    fieldId,
    value: optionId,
  });
}
