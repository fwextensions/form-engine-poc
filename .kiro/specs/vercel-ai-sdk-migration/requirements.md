# Requirements Document

## Introduction

This document specifies the requirements for migrating the form-editor's custom LLM client implementation to the Vercel AI SDK (`ai` package). The migration aims to simplify provider switching, leverage built-in streaming abstractions via `streamText` and `textStream`, and reduce custom SSE parsing code while preserving existing functionality.

## Glossary

- **Vercel_AI_SDK**: The `ai` npm package providing unified abstractions for LLM providers with streaming support
- **LLM_Client**: The abstraction layer for communicating with language model providers
- **Provider**: An LLM service (Anthropic, OpenAI, Google, Amazon Bedrock) that the SDK connects to via `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, or `@ai-sdk/amazon-bedrock`
- **streamText**: The Vercel AI SDK function for streaming text generation from language models
- **textStream**: An async iterable returned by `streamText` that yields text chunks
- **toTextStreamResponse**: SDK method to convert streaming result to a Response object for API routes
- **Schema_Generator**: The service orchestrating LLM interactions for form schema generation
- **API_Route**: Next.js server-side endpoint handling LLM requests

## Requirements

### Requirement 1: Install and Configure Vercel AI SDK

**User Story:** As a developer, I want to use the Vercel AI SDK, so that I can leverage its provider abstractions and streaming utilities.

#### Acceptance Criteria

1. WHEN the project is built, THE Build_System SHALL include the `ai` package as a dependency
2. WHEN the project is built, THE Build_System SHALL include `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, and `@ai-sdk/amazon-bedrock` provider packages as dependencies
3. WHEN TypeScript compiles the project, THE Build_System SHALL resolve all Vercel AI SDK type definitions without errors

### Requirement 2: Replace Custom LLM Client with SDK Abstractions

**User Story:** As a developer, I want to replace the custom LLM client with Vercel AI SDK, so that I can reduce maintenance burden and use standardized APIs.

#### Acceptance Criteria

1. WHEN the AIChat component needs to communicate with an LLM, THE AIChat SHALL use the `useChat` hook from `@ai-sdk/react`
2. WHEN the API route receives messages, THE API_Route SHALL use the SDK's `streamText` function for streaming responses
3. WHEN streaming responses, THE API_Route SHALL return a response using `toUIMessageStreamResponse()` for compatibility with `useChat`
4. THE custom `llm-client.ts` file SHALL be removed or deprecated after migration
5. THE SchemaGenerator SHALL be simplified to only handle prompt building (system prompt, edit prompt)

### Requirement 3: Support Multiple Providers

**User Story:** As a user, I want to switch between different LLM providers, so that I can use my preferred AI service.

#### Acceptance Criteria

1. WHEN Anthropic is selected as provider, THE LLM_Client SHALL use `createAnthropic` from `@ai-sdk/anthropic` to create a provider instance
2. WHEN OpenAI is selected as provider, THE LLM_Client SHALL use `createOpenAI` from `@ai-sdk/openai` to create a provider instance
3. WHEN Google is selected as provider, THE LLM_Client SHALL use `createGoogleGenerativeAI` from `@ai-sdk/google` to create a provider instance
4. WHEN Amazon Bedrock is selected as provider, THE LLM_Client SHALL use `createAmazonBedrock` from `@ai-sdk/amazon-bedrock` to create a provider instance
5. WHEN Amazon Bedrock is selected, THE Settings_Storage SHALL store AWS credentials (accessKeyId, secretAccessKey, region) in addition to the API key
6. WHEN a provider is selected, THE LLM_Client SHALL use the appropriate default model for that provider
7. THE Settings_Storage SHALL persist the selected provider and model preferences

### Requirement 4: Update API Route for SDK Streaming

**User Story:** As a developer, I want the API route to use Vercel AI SDK's streaming helpers, so that I can simplify server-side streaming logic.

#### Acceptance Criteria

1. WHEN the API route receives a request, THE API_Route SHALL use `streamText` from the Vercel AI SDK
2. WHEN returning a streaming response, THE API_Route SHALL use `toTextStreamResponse()` to create the Response object
3. WHEN the API route processes messages, THE API_Route SHALL pass the system message via the `system` parameter of `streamText`
4. IF the API route receives an invalid request, THEN THE API_Route SHALL return appropriate error responses with status codes

### Requirement 5: Maintain Streaming Support

**User Story:** As a user, I want to see LLM responses stream in real-time, so that I get immediate feedback during generation.

#### Acceptance Criteria

1. WHEN the LLM generates a response, THE useChat hook SHALL update the messages state incrementally as chunks arrive
2. WHEN streaming text chunks, THE AIChat component SHALL display partial responses in real-time
3. WHEN the stream completes, THE useChat hook SHALL update the status to indicate completion
4. IF a streaming error occurs, THEN THE useChat hook SHALL expose the error for display to the user

### Requirement 6: Preserve Interface Compatibility

**User Story:** As a developer, I want minimal breaking changes, so that existing components continue to work without major refactoring.

#### Acceptance Criteria

1. THE AIChat component SHALL continue to accept the same props (currentSchema, onSchemaGenerated, onOpenSettings)
2. THE SchemaGenerator SHALL continue to provide system prompt and edit prompt building functionality
3. THE settings interface SHALL remain compatible with existing stored settings (with migration for new fields)
4. WHEN the AIChat component extracts YAML from responses, THE extraction logic SHALL remain unchanged

### Requirement 7: Update Settings for Provider Configuration

**User Story:** As a user, I want to configure provider-specific settings, so that I can customize my LLM experience.

#### Acceptance Criteria

1. THE Settings_Storage SHALL store the selected provider (anthropic, openai, google, bedrock)
2. THE Settings_Storage SHALL store provider-specific model selections
3. THE Settings_Storage SHALL store AWS credentials (accessKeyId, secretAccessKey, region) for Bedrock provider
4. WHEN settings are loaded, THE Settings_Storage SHALL return valid defaults if stored values are corrupted
5. THE Settings_Storage SHALL validate provider values against allowed options

### Requirement 8: Error Handling

**User Story:** As a user, I want clear error messages when LLM requests fail, so that I can understand and resolve issues.

#### Acceptance Criteria

1. IF authentication fails, THEN THE API_Route SHALL return a 401 status with a descriptive error message
2. IF rate limiting occurs, THEN THE API_Route SHALL return a 429 status with a rate limit error message
3. IF a network error occurs, THEN THE useChat hook SHALL expose the error for display
4. IF the provider returns an error, THEN THE API_Route SHALL propagate the error message in the response
