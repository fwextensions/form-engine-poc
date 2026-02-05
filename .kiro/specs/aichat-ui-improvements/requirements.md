# Requirements Document

## Introduction

This specification defines improvements to the AIChat UI component to enhance the user experience during LLM interactions. The current implementation shows partial YAML code blocks during streaming, which creates a poor user experience. This feature will separate YAML schema generation from conversational messages, hide partial YAML during streaming, show thinking indicators, and render markdown formatting in assistant responses.

## Glossary

- **AIChat**: The React component that provides the chat interface for schema generation
- **LLM**: Large Language Model that generates form schemas and conversational responses
- **YAML_Block**: A code block containing form schema in YAML format
- **Streaming**: The process of receiving LLM response content incrementally as it's generated
- **Artifact**: A structured output format that separates code/data from conversational text
- **Thinking_Indicator**: A visual element showing that the LLM is processing a request
- **Markdown**: A lightweight markup language for formatting text
- **assistant-ui**: The UI library used for chat interface components
- **AI_SDK**: Vercel AI SDK v6 used for LLM integration

## Requirements

### Requirement 1: Hide Partial YAML During Streaming

**User Story:** As a user, I want to avoid seeing incomplete YAML code during streaming, so that I don't experience visual noise and confusion.

#### Acceptance Criteria

1. WHEN the LLM is streaming a response containing a YAML block, THE AIChat SHALL NOT display the partial YAML content
2. WHEN a YAML block is complete, THE AIChat SHALL update the form preview with the complete schema
3. WHEN a YAML block is complete, THE AIChat SHALL display any accompanying message text from the LLM
4. WHILE streaming is in progress, THE AIChat SHALL hide all YAML code block content regardless of completion state

### Requirement 2: Display Thinking Indicator

**User Story:** As a user, I want to see a visual indicator when the LLM is processing my request, so that I know the system is working and haven't lost my connection.

#### Acceptance Criteria

1. WHEN a user sends a message, THE AIChat SHALL display a thinking indicator immediately
2. WHILE the LLM is generating a response, THE AIChat SHALL continue showing the thinking indicator
3. WHEN the LLM response streaming begins, THE AIChat SHALL replace the thinking indicator with the streaming content
4. WHEN streaming completes, THE AIChat SHALL remove the thinking indicator

### Requirement 3: Separate YAML from Conversational Messages

**User Story:** As a user, I want YAML schemas to be delivered separately from conversational messages, so that I can read the LLM's explanations without code blocks interrupting the flow.

#### Acceptance Criteria

1. WHEN the LLM generates a schema, THE System SHALL return the YAML as a tool call with the schema in the artifact property
2. WHEN the LLM includes explanatory text with a schema, THE AIChat SHALL display only the text in the message bubble
3. WHEN a tool call with schema artifact is received, THE AIChat SHALL update the form preview without displaying the YAML in the chat
4. WHEN validation errors occur, THE AIChat SHALL display error messages in the chat interface
5. THE System SHALL use AI SDK's tool calling feature to define a "generate_schema" tool that returns YAML

### Requirement 4: Render Markdown in Messages

**User Story:** As a user, I want to see formatted text in LLM responses, so that explanations are easier to read and understand.

#### Acceptance Criteria

1. WHEN the LLM includes markdown formatting in a message, THE AIChat SHALL render it as formatted HTML
2. THE AIChat SHALL support bold, italic, code spans, lists, and headings in markdown
3. WHEN rendering markdown, THE AIChat SHALL maintain the existing message bubble styling
4. THE AIChat SHALL NOT render markdown inside YAML code blocks

### Requirement 5: Maintain Validation and Error Display

**User Story:** As a developer, I want validation and error handling to continue working after the UI improvements, so that users still receive feedback about schema issues.

#### Acceptance Criteria

1. WHEN a schema artifact is received, THE System SHALL validate it using the existing validation logic
2. WHEN validation errors occur, THE AIChat SHALL display error messages with the same formatting as before
3. WHEN validation warnings occur, THE AIChat SHALL display warning messages with the same formatting as before
4. WHEN a valid schema is received, THE AIChat SHALL display a success indicator

### Requirement 6: Update Backend to Support Tool Calling

**User Story:** As a developer, I want the API route to support tool calling for schema generation, so that YAML schemas can be separated from conversational text.

#### Acceptance Criteria

1. THE API_Route SHALL define a "generate_schema" tool with a schema parameter for YAML content
2. WHEN the LLM calls the generate_schema tool, THE API_Route SHALL return the tool call in the response stream
3. THE API_Route SHALL use AI SDK's streamText with tools configuration
4. THE API_Route SHALL handle errors in tool execution gracefully

### Requirement 7: Preserve Existing Functionality

**User Story:** As a user, I want all existing chat features to continue working, so that the improvements don't break my workflow.

#### Acceptance Criteria

1. THE AIChat SHALL continue to support schema editing with current schema context
2. THE AIChat SHALL continue to display example prompts in the empty state
3. THE AIChat SHALL continue to show API key configuration prompts when needed
4. THE AIChat SHALL continue to support all existing LLM providers (Anthropic, OpenAI, Google, Bedrock)
5. THE AIChat SHALL continue to scroll to the latest message automatically
