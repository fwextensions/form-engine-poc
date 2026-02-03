# Implementation Plan: LLM-Assisted Form Schema Generation

## Overview

This plan implements LLM-assisted form schema generation in phases: catalog prompt generation (form-engine), then LLM client and utilities (form-editor), then UI components. Each task builds incrementally with property tests validating correctness.

## Tasks

- [ ] 1. Implement Catalog Prompt Generator
  - [x] 1.1 Create `generateCatalogPrompt()` function in `form-engine/src/catalog/prompt.ts`
    - Implement function that takes Catalog and CatalogPromptOptions
    - Generate markdown sections: preamble, components, schema rules, conditional logic, validation
    - Export from `form-engine/src/catalog/index.ts` and `form-engine/src/index.ts`
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [x] 1.2 Implement `formatPropsFromZodSchema()` for Zod schema introspection
    - Extract property names, types, required/optional status
    - Extract default values and constraints (min, max, enum values)
    - Handle nested objects and arrays
    - _Requirements: 1.2_

  - [x] 1.3 Add component documentation formatting
    - Include component type, description, hasChildren indicator
    - Format props from Zod schema
    - Add YAML examples when `includeExamples` option is true
    - _Requirements: 1.3, 1.4, 1.8_

  - [x] 1.4 Write property tests for catalog prompt generation
    - **Property 1: Catalog Prompt Completeness**
    - **Property 2: Zod Schema Property Extraction**
    - **Property 3: Conditional Example Inclusion**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.8**

- [ ] 2. Implement LLM Client and Utilities
  - [x] 2.1 Create LLM client interface and Anthropic implementation in `form-editor/src/lib/llm-client.ts`
    - Define LLMMessage and LLMClient interfaces
    - Implement `createAnthropicClient()` with SSE streaming
    - Parse SSE events and yield text delta chunks
    - Handle API errors with descriptive messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Create YAML extractor in `form-editor/src/lib/yaml-extractor.ts`
    - Implement `extractYamlFromResponse()` function
    - Handle ```yaml, ```yml, and generic ``` code blocks
    - Detect raw YAML content (starts with id: or type:)
    - Return null when no YAML found
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.3 Write property tests for YAML extraction
    - **Property 8: YAML Extraction from Responses**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 2.4 Create schema validator in `form-editor/src/lib/schema-validator.ts`
    - Implement `validateSchema()` function returning ValidationResult
    - Check YAML syntax using js-yaml
    - Validate against form-engine parseRootFormSchema
    - Check for unknown component types against catalog
    - Detect duplicate field IDs
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 2.5 Write property tests for schema validation
    - **Property 9: YAML Syntax Validation**
    - **Property 10: Form-Engine Schema Validation**
    - **Property 11: Unknown Component Type Detection**
    - **Property 12: Duplicate ID Detection**
    - **Validates: Requirements 7.4, 7.5, 7.6, 7.7**

  - [x] 2.6 Create settings storage in `form-editor/src/lib/settings.ts`
    - Implement `getSettings()`, `saveSettings()`, `hasApiKey()` functions
    - Use localStorage with key "form-editor-llm-settings"
    - Handle missing/corrupted storage gracefully
    - _Requirements: 6.4_

  - [x] 2.7 Write property tests for settings round-trip
    - **Property 7: Settings Round-Trip**
    - **Validates: Requirements 6.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Schema Generator Service
  - [x] 4.1 Create SchemaGenerator class in `form-editor/src/lib/schema-generator.ts`
    - Constructor takes LLMClient, initializes catalog prompt
    - Implement `generate()` method for new schema creation
    - Implement `edit()` method for modifying existing schemas
    - Implement `resetConversation()` method
    - Build system prompt with catalog documentation
    - Maintain conversation history array
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.2 Write property tests for schema generator
    - **Property 4: System Prompt Contains Catalog**
    - **Property 5: Conversation History Maintenance**
    - **Property 6: Edit Prompt Includes Current Schema**
    - **Validates: Requirements 3.1, 3.3, 3.4**

- [ ] 5. Implement UI Components
  - [x] 5.1 Install chat UI library dependency
    - Add `@chatscope/chat-ui-kit-react` and `@chatscope/chat-ui-kit-styles` to form-editor
    - _Requirements: 5.1_

  - [x] 5.2 Create SettingsDialog component in `form-editor/src/components/SettingsDialog.tsx`
    - Use Radix UI Dialog for modal
    - Add provider dropdown (Anthropic/OpenAI)
    - Add API key password input
    - Save/cancel buttons
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.3 Create AIChat component in `form-editor/src/components/AIChat.tsx`
    - Use chatscope components (MainContainer, ChatContainer, MessageList, Message, MessageInput)
    - Display empty state with example prompts when no messages
    - Show streaming responses in real-time
    - Show loading indicator during generation
    - Display schema context indicator when schema exists
    - Extract YAML from responses and call onSchemaGenerated
    - Display validation errors inline
    - Show API key prompt when not configured
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.4 Create EditorPane component in `form-editor/src/components/EditorPane.tsx`
    - Use Radix UI Tabs for YAML/AI tab interface
    - Render Monaco editor in YAML tab
    - Render AIChat in AI tab
    - Pass schema state between tabs
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 5.5 Write property test for tab state preservation
    - **Property 13: Tab Switch State Preservation**
    - **Validates: Requirements 4.4**

- [ ] 6. Integrate into Form Editor Page
  - [x] 6.1 Update `form-editor/src/app/page.tsx` to use EditorPane
    - Replace Monaco editor with EditorPane component
    - Add activeTab state management
    - Add settings button to toolbar
    - _Requirements: 4.1_

  - [x] 6.2 Update new form behavior
    - Modify handleNewForm to set empty schema instead of default YAML
    - Switch to AI tab when creating new form
    - _Requirements: 4.6, 4.7_

  - [x] 6.3 Add settings button to EditorToolbar
    - Add gear icon button that opens SettingsDialog
    - _Requirements: 6.1_

- [~] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All property tests are required and use fast-check with minimum 100 iterations
- The chatscope library provides pre-built chat UI components to accelerate development
- All new files should follow existing naming conventions (PascalCase for components, camelCase for utilities)
