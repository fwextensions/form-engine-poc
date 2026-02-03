# Requirements Document

## Introduction

This document defines the requirements for adding LLM-assisted form schema generation to the form-editor application. Users will be able to describe forms in natural language and have an LLM generate valid YAML schemas, while retaining full manual editing capabilities. The feature integrates with the existing component catalog system to ensure generated schemas are always valid.

## Glossary

- **Form_Editor**: The Next.js application that provides a Monaco-based YAML editor with live form preview
- **Schema_Generator**: The service that manages LLM interactions and generates form schemas from natural language descriptions
- **Catalog_Prompt**: A markdown-formatted description of available components, their properties, and schema rules for LLM consumption
- **LLM_Client**: An abstraction layer for communicating with LLM providers (Anthropic Claude, OpenAI)
- **AI_Chat**: The chat interface component where users interact with the LLM to generate or modify schemas
- **YAML_Extractor**: A utility that extracts valid YAML from LLM responses containing code blocks
- **Schema_Validator**: A utility that validates generated YAML against the form-engine schema rules

## Requirements

### Requirement 1: Catalog Prompt Generation

**User Story:** As a developer, I want the component catalog to be serialized into an LLM-consumable prompt, so that the LLM understands what components are available and how to use them.

#### Acceptance Criteria

1. THE Catalog_Prompt generator SHALL produce a markdown-formatted string describing all registered components
2. WHEN generating the prompt, THE Catalog_Prompt generator SHALL extract property documentation from Zod schemas including required vs optional props, types, constraints, and default values
3. THE Catalog_Prompt generator SHALL include the component description from each catalog entry
4. THE Catalog_Prompt generator SHALL indicate which components can contain children
5. THE Catalog_Prompt generator SHALL include schema structure rules explaining the YAML format
6. THE Catalog_Prompt generator SHALL include documentation for conditional logic (rules system)
7. THE Catalog_Prompt generator SHALL include validation rules documentation
8. WHERE example generation is enabled, THE Catalog_Prompt generator SHALL include YAML examples for each component type

### Requirement 2: LLM Client Abstraction

**User Story:** As a developer, I want an abstracted LLM client interface, so that the application can support multiple LLM providers without changing the core logic.

#### Acceptance Criteria

1. THE LLM_Client interface SHALL define a chat method that accepts an array of messages and returns an async iterable of string chunks
2. THE LLM_Client interface SHALL support system, user, and assistant message roles
3. WHEN using the Anthropic provider, THE LLM_Client SHALL stream responses using Server-Sent Events (SSE)
4. WHEN an API error occurs, THE LLM_Client SHALL throw an error with a descriptive message
5. THE LLM_Client SHALL support configurable model selection and max token limits

### Requirement 3: Schema Generation Service

**User Story:** As a user, I want to generate form schemas from natural language descriptions, so that I can quickly create forms without manually writing YAML.

#### Acceptance Criteria

1. WHEN generating a new schema, THE Schema_Generator SHALL build a system prompt containing the catalog documentation
2. WHEN generating a new schema, THE Schema_Generator SHALL stream the LLM response to the caller
3. THE Schema_Generator SHALL maintain conversation history for follow-up edits
4. WHEN editing an existing schema, THE Schema_Generator SHALL include the current schema in the prompt context
5. WHEN editing an existing schema, THE Schema_Generator SHALL instruct the LLM to output the complete modified schema
6. THE Schema_Generator SHALL instruct the LLM to wrap YAML output in code blocks

### Requirement 4: Tabbed Editor Interface

**User Story:** As a user, I want to switch between manual YAML editing and AI-assisted generation, so that I can use whichever method is most efficient for my task.

#### Acceptance Criteria

1. THE Form_Editor SHALL display a tabbed interface with YAML Editor and AI Assistant tabs
2. WHEN the YAML tab is active, THE Form_Editor SHALL display the Monaco editor with the current schema
3. WHEN the AI tab is active, THE Form_Editor SHALL display the AI_Chat interface
4. WHEN switching tabs, THE Form_Editor SHALL preserve the current schema state
5. THE Form_Editor SHALL allow the AI_Chat to update the schema displayed in the YAML editor
6. WHEN the user creates a new form, THE Form_Editor SHALL automatically switch to the AI Assistant tab
7. WHEN the user creates a new form, THE Form_Editor SHALL start with an empty schema instead of default YAML

### Requirement 5: AI Chat Interface

**User Story:** As a user, I want to interact with an AI assistant through a chat interface, so that I can describe forms naturally and iterate on the design.

#### Acceptance Criteria

1. THE AI_Chat SHALL use an off-the-shelf chat UI library to streamline development
2. THE AI_Chat SHALL display a scrollable message history showing user and assistant messages
3. WHEN no messages exist, THE AI_Chat SHALL display an empty state with example prompts
4. THE AI_Chat SHALL provide a text input area for entering prompts
5. WHEN the user submits a prompt, THE AI_Chat SHALL display the streaming response in real-time
6. WHILE generating a response, THE AI_Chat SHALL disable the submit button and show a loading indicator
7. WHEN a schema exists, THE AI_Chat SHALL indicate that the AI can see and modify the current schema
8. WHEN the LLM response contains valid YAML, THE AI_Chat SHALL extract it and update the form schema

### Requirement 6: API Key Management

**User Story:** As a user, I want to configure my LLM API key, so that I can use the AI features with my own account.

#### Acceptance Criteria

1. THE Form_Editor SHALL provide a settings dialog for configuring LLM settings
2. THE settings dialog SHALL allow selecting the LLM provider (Anthropic, OpenAI)
3. THE settings dialog SHALL allow entering and saving an API key
4. THE Form_Editor SHALL persist settings to localStorage
5. IF no API key is configured, THE AI_Chat SHALL display a message prompting the user to configure settings

### Requirement 7: Schema Validation

**User Story:** As a user, I want generated schemas to be validated before being applied, so that I don't end up with broken forms.

#### Acceptance Criteria

1. WHEN extracting YAML from an LLM response, THE YAML_Extractor SHALL handle code blocks with yaml or yml language tags
2. WHEN extracting YAML from an LLM response, THE YAML_Extractor SHALL handle generic code blocks without language tags
3. IF no code block is found, THE YAML_Extractor SHALL attempt to use the raw response if it appears to be YAML
4. WHEN validating a schema, THE Schema_Validator SHALL check for valid YAML syntax
5. WHEN validating a schema, THE Schema_Validator SHALL validate against the form-engine schema parser
6. WHEN validating a schema, THE Schema_Validator SHALL check for unknown component types
7. WHEN validating a schema, THE Schema_Validator SHALL warn about duplicate field IDs
8. IF validation fails, THE AI_Chat SHALL display the validation errors to the user

### Requirement 8: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. IF the LLM API returns an error, THE AI_Chat SHALL display a user-friendly error message
2. IF the network connection fails, THE AI_Chat SHALL indicate the connection issue
3. IF YAML extraction fails, THE AI_Chat SHALL inform the user that no valid schema was found in the response
4. IF schema validation fails, THE AI_Chat SHALL display the specific validation errors
5. WHEN an error occurs, THE AI_Chat SHALL allow the user to retry or modify their request
