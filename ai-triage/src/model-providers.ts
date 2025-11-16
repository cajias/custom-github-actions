/**
 * Multi-provider AI model support
 * Supports GitHub Models, Anthropic, and OpenAI
 */

import * as core from "@actions/core";

export type ModelProvider = "github" | "anthropic" | "openai";

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
}

/**
 * Detect model provider from model name
 */
export function detectProvider(modelName: string): ModelProvider {
  const normalized = modelName.toLowerCase();

  // Claude models → Anthropic
  if (normalized.startsWith("claude-")) {
    return "anthropic";
  }

  // GPT models → OpenAI
  if (normalized.startsWith("gpt-") || normalized.startsWith("o1-")) {
    return "openai";
  }

  // Default to GitHub Models (handles xai/*, meta-llama/*, etc.)
  return "github";
}

/**
 * Get model configuration with validation
 */
export function getModelConfig(
  model: string,
  anthropicKey: string,
  openaiKey: string,
): ModelConfig {
  const provider = detectProvider(model);

  const config: ModelConfig = {
    provider,
    model,
  };

  // Validate API keys for providers that need them
  if (provider === "anthropic") {
    if (!anthropicKey) {
      throw new Error(
        `Model '${model}' requires an Anthropic API key. ` +
          `Please provide 'anthropic-api-key' input. ` +
          `Get your API key at: https://console.anthropic.com/`,
      );
    }
    config.apiKey = anthropicKey;
  } else if (provider === "openai") {
    if (!openaiKey) {
      throw new Error(
        `Model '${model}' requires an OpenAI API key. ` +
          `Please provide 'openai-api-key' input. ` +
          `Get your API key at: https://platform.openai.com/api-keys`,
      );
    }
    config.apiKey = openaiKey;
  }

  core.info(`Using ${provider} provider for model: ${model}`);
  return config;
}

/**
 * Call the appropriate AI model based on provider
 */
export async function callModel(
  config: ModelConfig,
  systemPrompt: string,
  userPrompt: string,
  githubToken?: string,
): Promise<string> {
  switch (config.provider) {
    case "anthropic":
      return callAnthropicAPI(
        config.model,
        config.apiKey!,
        systemPrompt,
        userPrompt,
      );
    case "openai":
      return callOpenAIAPI(
        config.model,
        config.apiKey!,
        systemPrompt,
        userPrompt,
      );
    case "github":
      return callGitHubModels(
        config.model,
        githubToken!,
        systemPrompt,
        userPrompt,
      );
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Call Anthropic API (for Claude models)
 */
async function callAnthropicAPI(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  core.debug("Calling Anthropic API...");

  const endpoint = "https://api.anthropic.com/v1/messages";

  const body = {
    model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.3,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as any;

    if (!result.content || result.content.length === 0) {
      throw new Error("No response from Anthropic API");
    }

    if (!result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response structure from Anthropic API");
    }

    const content = result.content[0].text;
    core.debug(`Anthropic response: ${content}`);

    return content;
  } catch (error: any) {
    core.error(`Anthropic API error: ${error.message}`);
    throw new Error(`Failed to call Anthropic API: ${error.message}`);
  }
}

/**
 * Call OpenAI API (for GPT models)
 */
async function callOpenAIAPI(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  core.debug("Calling OpenAI API...");

  const endpoint = "https://api.openai.com/v1/chat/completions";

  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as any;

    if (!result.choices || result.choices.length === 0) {
      throw new Error("No response from OpenAI API");
    }

    if (
      !result.choices[0] ||
      !result.choices[0].message ||
      !result.choices[0].message.content
    ) {
      throw new Error("Invalid response structure from OpenAI API");
    }

    const content = result.choices[0].message.content;
    core.debug(`OpenAI response: ${content}`);

    return content;
  } catch (error: any) {
    core.error(`OpenAI API error: ${error.message}`);
    throw new Error(`Failed to call OpenAI API: ${error.message}`);
  }
}

/**
 * Call GitHub Models API (for Grok and other free models)
 */
async function callGitHubModels(
  model: string,
  githubToken: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  core.debug("Calling GitHub Models API...");

  const endpoint = "https://models.github.ai/inference/chat/completions";

  const body = {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    model,
    temperature: 0.3,
    max_tokens: 2000,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as any;

    if (!result.choices || result.choices.length === 0) {
      throw new Error("No response from GitHub Models API");
    }

    if (
      !result.choices[0] ||
      !result.choices[0].message ||
      !result.choices[0].message.content
    ) {
      throw new Error("Invalid response structure from GitHub Models API");
    }

    const content = result.choices[0].message.content;
    core.debug(`GitHub Models response: ${content}`);

    return content;
  } catch (error: any) {
    core.error(`GitHub Models API error: ${error.message}`);
    throw new Error(`Failed to call GitHub Models API: ${error.message}`);
  }
}
