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
  await updateStatus(ctx, fields, itemId, analysis.is_agent_ready);
  await updatePriority(ctx, fields, itemId, analysis.priority);
  await updateSize(ctx, fields, itemId, analysis.size);

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

  const itemId = result.addProjectV2ItemById.item.id;
  core.info(`✅ Added to project, item ID: ${itemId}`);

  return itemId;
}

/**
 * Update Status field
 */
async function updateStatus(
  ctx: ActionContext,
  fields: ProjectFields,
  itemId: string,
  isAgentReady: boolean,
): Promise<void> {
  const targetStatus = isAgentReady ? "Ready" : "Backlog";
  const statusOption = fields.status.options.find(
    (o) => o.name === targetStatus,
  );

  if (!statusOption) {
    core.warning(`Status option "${targetStatus}" not found`);
    return;
  }

  await updateSingleSelectField(
    ctx,
    fields.projectId,
    itemId,
    fields.status.id,
    statusOption.id,
  );

  core.info(`Set status to: ${targetStatus}`);
}

/**
 * Update Priority field
 */
async function updatePriority(
  ctx: ActionContext,
  fields: ProjectFields,
  itemId: string,
  priority: string,
): Promise<void> {
  const priorityOption = fields.priority.options.find(
    (o) => o.name === priority,
  );

  if (!priorityOption) {
    core.warning(`Priority option "${priority}" not found`);
    return;
  }

  await updateSingleSelectField(
    ctx,
    fields.projectId,
    itemId,
    fields.priority.id,
    priorityOption.id,
  );

  core.info(`Set priority to: ${priority}`);
}

/**
 * Update Size field
 */
async function updateSize(
  ctx: ActionContext,
  fields: ProjectFields,
  itemId: string,
  size: string,
): Promise<void> {
  const sizeOption = fields.size.options.find((o) => o.name === size);

  if (!sizeOption) {
    core.warning(`Size option "${size}" not found`);
    return;
  }

  await updateSingleSelectField(
    ctx,
    fields.projectId,
    itemId,
    fields.size.id,
    sizeOption.id,
  );

  core.info(`Set size to: ${size}`);
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
