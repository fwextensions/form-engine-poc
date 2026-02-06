# Implementation Plan: Vercel AI SDK Migration

## Overview

This plan migrates the form-editor's custom LLM client implementation to the Vercel AI SDK. The migration uses the SDK's `useChat` hook for client-side chat management and `streamText` for server-side streaming, supporting multiple providers (Anthropic, OpenAI, Google, Amazon Bedrock).

## Tasks

- [x] 1. Install Vercel AI SDK dependencies
  - Add `ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/amazon-bedrock` to form-editor package
  - Verify TypeScript types resolve correctly
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Update settings module for multi-provider support
  - [x] 2.1 Extend LLMProvider type to include "google" and "bedrock"
    - Update type definition in settings.ts
    - Add DEFAULT_MODELS constant with default model for each provider
    - _Requirements: 7.1, 7.2, 3.6_
  
  - [x] 2.2 Add AWS credential fields to LLMSettings interface
    - Add awsAccessKeyId, awsSecretAccessKey, awsRegion fields
    - Update saveSettings and getSettings to handle new fields
    - _Requirements: 7.3, 3.5_
  
  - [x] 2.3 Update settings validation for new providers
    - Validate provider against extended allowed list
    - Return defaults for invalid/corrupted settings
    - _Requirements: 7.4, 7.5_
  
  - [ ]* 2.4 Write property tests for settings module
    - **Property 1: Settings Round-Trip Consistency**
    - **Property 4: Settings Validation and Corruption Handling**
    - **Validates: Requirements 3.5, 3.7, 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 3. Checkpoint - Verify settings module
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Rewrite API route with Vercel AI SDK
  - [x] 4.1 Create provider factory function
    - Implement function that creates provider instance based on provider type
    - Handle API key for Anthropic/OpenAI/Google, AWS credentials for Bedrock
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Update POST handler to use streamText
    - Parse request body for provider, credentials, messages, system prompt
    - Create provider instance using factory function
    - Call streamText with model and messages
    - Return result.toUIMessageStreamResponse()
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 4.3 Implement error handling in API route
    - Return 400 for missing provider or credentials
    - Return 401 for authentication errors
    - Return 429 for rate limit errors
    - Return 500 for server errors
    - _Requirements: 4.4, 8.1, 8.2, 8.4_
  
  - [ ]* 4.4 Write property tests for API route
    - **Property 3: Invalid Request Error Handling**
    - **Validates: Requirements 4.4**

- [x] 5. Checkpoint - Verify API route
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Simplify SchemaGenerator
  - [x] 6.1 Remove LLM client dependency from SchemaGenerator
    - Remove constructor parameter for LLMClient
    - Remove generate() and edit() async generator methods
    - Keep only prompt building methods
    - _Requirements: 2.5_
  
  - [x] 6.2 Add getSystemPrompt and buildEditPrompt methods
    - getSystemPrompt() returns catalog prompt
    - buildEditPrompt(currentSchema, instructions) returns formatted edit prompt
    - _Requirements: 6.2_

- [x] 7. Refactor AIChat component to use useChat
  - [x] 7.1 Replace custom state management with useChat hook
    - Import useChat from @ai-sdk/react and DefaultChatTransport from ai
    - Configure transport with /api/llm endpoint
    - Remove manual message state management
    - _Requirements: 2.1, 5.1, 5.2_
  
  - [x] 7.2 Update message sending logic
    - Use sendMessage from useChat instead of custom streaming
    - Pass system prompt via transport configuration or initial messages
    - Handle edit vs generate mode
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.3 Update UI to use useChat state
    - Use messages from useChat for rendering
    - Use status for loading/generating indicators
    - Use error for error display
    - _Requirements: 5.3, 5.4, 8.3_
  
  - [x] 7.4 Preserve YAML extraction and validation logic
    - Extract YAML from assistant messages when streaming completes
    - Validate extracted schema
    - Call onSchemaGenerated with valid schemas
    - _Requirements: 6.4_

- [x] 8. Checkpoint - Verify AIChat component
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update Settings UI for new providers
  - [x] 9.1 Add Google and Bedrock to provider dropdown
    - Update SettingsDialog component with new provider options
    - Show appropriate credential fields based on selected provider
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 9.2 Add AWS credential input fields
    - Show AWS Access Key ID, Secret Access Key, Region fields when Bedrock selected
    - Hide API key field when Bedrock selected
    - _Requirements: 3.5, 7.3_

- [x] 10. Remove deprecated code
  - [x] 10.1 Remove or deprecate llm-client.ts
    - Delete createAnthropicClient function
    - Remove LLMClient interface exports if no longer needed
    - _Requirements: 2.4_

- [x] 11. Final checkpoint - Integration testing
  - Ensure all tests pass
  - Manually test with each provider (if API keys available)
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The `useChat` hook from `@ai-sdk/react` handles most of the streaming complexity
- AWS Bedrock requires different credentials than other providers (AWS access keys vs API key)
- The API route handles provider instantiation server-side to keep credentials secure
