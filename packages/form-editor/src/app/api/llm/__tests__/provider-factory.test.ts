import { describe, it, expect } from "vitest";
import { createProvider } from "../route";
import type { LLMProvider } from "@/lib/settings";

/**
 * Unit tests for the provider factory function.
 * 
 * These tests verify that the createProvider function correctly instantiates
 * provider instances based on the provider type and validates credentials.
 */

describe("Provider Factory", () => {
	describe("Anthropic Provider", () => {
		it("should throw error when API key is missing", () => {
			expect(() => {
				createProvider("anthropic", {});
			}).toThrow("API key is required for Anthropic provider");
		});

		it("should create Anthropic provider with valid API key", () => {
			const provider = createProvider("anthropic", {
				apiKey: "test-api-key",
			});
			
			expect(provider).toBeDefined();
			expect(typeof provider).toBe("function");
		});
	});

	describe("OpenAI Provider", () => {
		it("should throw error when API key is missing", () => {
			expect(() => {
				createProvider("openai", {});
			}).toThrow("API key is required for OpenAI provider");
		});

		it("should create OpenAI provider with valid API key", () => {
			const provider = createProvider("openai", {
				apiKey: "test-api-key",
			});
			
			expect(provider).toBeDefined();
			expect(typeof provider).toBe("function");
		});
	});

	describe("Google Provider", () => {
		it("should throw error when API key is missing", () => {
			expect(() => {
				createProvider("google", {});
			}).toThrow("API key is required for Google provider");
		});

		it("should create Google provider with valid API key", () => {
			const provider = createProvider("google", {
				apiKey: "test-api-key",
			});
			
			expect(provider).toBeDefined();
			expect(typeof provider).toBe("function");
		});
	});

	describe("Bedrock Provider", () => {
		it("should throw error when AWS credentials are missing", () => {
			expect(() => {
				createProvider("bedrock", {});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when only accessKeyId is provided", () => {
			expect(() => {
				createProvider("bedrock", {
					awsAccessKeyId: "test-key-id",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when only secretAccessKey is provided", () => {
			expect(() => {
				createProvider("bedrock", {
					awsSecretAccessKey: "test-secret",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when only region is provided", () => {
			expect(() => {
				createProvider("bedrock", {
					awsRegion: "us-east-1",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when accessKeyId is missing", () => {
			expect(() => {
				createProvider("bedrock", {
					awsSecretAccessKey: "test-secret",
					awsRegion: "us-east-1",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when secretAccessKey is missing", () => {
			expect(() => {
				createProvider("bedrock", {
					awsAccessKeyId: "test-key-id",
					awsRegion: "us-east-1",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should throw error when region is missing", () => {
			expect(() => {
				createProvider("bedrock", {
					awsAccessKeyId: "test-key-id",
					awsSecretAccessKey: "test-secret",
				});
			}).toThrow("AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication");
		});

		it("should create Bedrock provider with valid AWS credentials", () => {
			const provider = createProvider("bedrock", {
				awsAccessKeyId: "test-key-id",
				awsSecretAccessKey: "test-secret",
				awsRegion: "us-east-1",
			});
			
			expect(provider).toBeDefined();
			expect(typeof provider).toBe("function");
		});
	});

	describe("Invalid Provider", () => {
		it("should throw error for unsupported provider", () => {
			expect(() => {
				createProvider("invalid-provider" as LLMProvider, {
					apiKey: "test-key",
				});
			}).toThrow("Unsupported provider: invalid-provider");
		});
	});
});

