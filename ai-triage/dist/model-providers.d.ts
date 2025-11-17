/**
 * Multi-provider AI model support
 * Supports GitHub Models, Anthropic, and OpenAI
 */
export type ModelProvider = "github" | "anthropic" | "openai";
export interface ModelConfig {
    provider: ModelProvider;
    model: string;
    apiKey?: string;
}
/**
 * Detect model provider from model name
 */
export declare function detectProvider(modelName: string): ModelProvider;
/**
 * Get model configuration with validation
 */
export declare function getModelConfig(model: string, anthropicKey: string, openaiKey: string): ModelConfig;
/**
 * Call the appropriate AI model based on provider
 */
export declare function callModel(config: ModelConfig, systemPrompt: string, userPrompt: string, githubToken?: string): Promise<string>;
