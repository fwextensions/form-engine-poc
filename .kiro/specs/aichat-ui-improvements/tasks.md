# Implementation Plan: AIChat UI Improvements

## Overview

This implementation plan breaks down the AIChat UI improvements into discrete coding tasks. The approach follows this sequence:
1. Install dependencies and update system prompt
2. Implement backend tool calling support
3. Add frontend tool UI and markdown rendering
4. Add thinking indicator
5. Update validation to work with tool calls
6. Add tests for new functionality

## Tasks

- [x] 1. Install dependencies and update system prompt
  - Install `@assistant-ui/react-markdown` package in form-editor workspace
  - Update `SchemaGenerator.getSystemPrompt()` to instruct LLM to use generate_schema tool
  - Add instructions about when to use the tool vs. conversational responses
  - _Requirements: 3.5, 6.3_

- [x] 2. Implement backend tool calling support
  - [x] 2.1 Define generate_schema tool in API route
    - Import `tool` from 'ai' package
    - Create tool definition with Zod schema for yaml and explanation parameters
    - Add tool description to guide LLM usage
    - _Requirements: 6.1_
  
  - [ ]* 2.2 Write unit test for tool definition
    - Test tool schema validation
    - Test tool description is present
    - _Requirements: 6.1_
  
  - [x] 2.3 Add tools configuration to streamText
    - Pass tools object to streamText call
    - Ensure tool calls are included in stream response
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 2.4 Write property test for tool call streaming
    - **Property 13: Tool Call Streaming**
    - **Validates: Requirements 6.2**
  
  - [ ]* 2.5 Write property test for error handling
    - **Property 14: Error Handling**
    - **Validates: Requirements 6.4**

- [x] 3. Checkpoint - Test API route changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create tool UI component for schema generation
  - [x] 4.1 Create SchemaGeneratorToolUI component
    - Use `makeAssistantToolUI` from assistant-ui
    - Render explanation text from args
    - Show loading state during streaming
    - Hide YAML content (don't render args.yaml)
    - _Requirements: 3.2, 1.1, 1.3_
  
  - [ ]* 4.2 Write unit tests for tool UI component
    - Test explanation text is rendered
    - Test loading state is shown when status is 'running'
    - Test YAML is not rendered
    - _Requirements: 3.2, 1.1, 1.3_
  
  - [ ]* 4.3 Write property test for YAML hidden during streaming
    - **Property 1: YAML Hidden During Streaming**
    - **Validates: Requirements 1.1, 1.4**
  
  - [ ]* 4.4 Write property test for explanatory text displayed
    - **Property 3: Explanatory Text Displayed**
    - **Validates: Requirements 1.3**
  
  - [ ]* 4.5 Write property test for YAML not in message bubbles
    - **Property 7: YAML Not in Message Bubbles**
    - **Validates: Requirements 3.2**

- [x] 5. Add markdown rendering to AIChat
  - [x] 5.1 Import MarkdownTextPrimitive from @assistant-ui/react-markdown
    - Add import statement
    - Update MessagePrimitive.Parts components configuration
    - Replace Text component with MarkdownTextPrimitive
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 5.2 Write unit tests for markdown rendering
    - Test markdown syntax converts to HTML
    - Test message bubble styling is preserved
    - Test various markdown features (bold, italic, lists, headings, code spans)
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 5.3 Write property test for markdown rendering
    - **Property 9: Markdown Rendered as HTML**
    - **Validates: Requirements 4.1**

- [x] 6. Integrate tool UI component into AIChat
  - [x] 6.1 Register SchemaGeneratorToolUI in MessagePrimitive.Parts
    - Add to tools.by_name configuration
    - Update both CustomMessage instances (empty state and chat state)
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 6.2 Write integration test for tool UI integration
    - Test tool UI renders when tool call is received
    - Test markdown and tool UI work together
    - _Requirements: 3.1, 3.2, 4.1_

- [x] 7. Add thinking indicator
  - [x] 7.1 Create ThinkingIndicator component
    - Create animated dots with CSS
    - Add "Thinking..." text
    - Style to match existing UI
    - _Requirements: 2.1, 2.3_
  
  - [x] 7.2 Add thinking indicator to chat interface
    - Show when thread.isRunning is true and no messages are streaming
    - Hide when messages start streaming
    - Position appropriately in the message list
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 7.3 Write unit tests for thinking indicator
    - Test indicator appears when isRunning is true
    - Test indicator disappears when messages stream
    - _Requirements: 2.1, 2.3_
  
  - [ ]* 7.4 Write property test for thinking indicator on send
    - **Property 4: Thinking Indicator on Message Send**
    - **Validates: Requirements 2.1**
  
  - [ ]* 7.5 Write property test for thinking indicator removed on stream
    - **Property 5: Thinking Indicator Removed on Stream Start**
    - **Validates: Requirements 2.3**

- [x] 8. Checkpoint - Test UI components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update validation to work with tool calls
  - [x] 9.1 Update onFinish callback to handle tool calls
    - Check for tool-call message parts in addition to text parts
    - Extract YAML from tool call args instead of markdown code blocks
    - Keep existing validation logic
    - _Requirements: 5.1, 3.4_
  
  - [ ] 9.2 Update validation state management
    - Change validationResults to track tool call IDs
    - Store validation results keyed by tool call ID
    - Update getValidationForMessage to check tool calls
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 9.3 Update form preview update logic
    - Call onSchemaGenerated when tool call has valid YAML
    - Ensure form preview updates on tool call completion
    - _Requirements: 1.2_
  
  - [ ]* 9.4 Write unit tests for validation integration
    - Test validateSchema is called with tool call YAML
    - Test validation results are stored correctly
    - Test error messages display for invalid YAML
    - Test warning messages display for warnings
    - Test success indicator displays for valid YAML
    - _Requirements: 5.1, 3.4, 5.3, 5.4_
  
  - [ ]* 9.5 Write property test for validation logic called
    - **Property 10: Validation Logic Called**
    - **Validates: Requirements 5.1**
  
  - [ ]* 9.6 Write property test for form preview updated
    - **Property 2: Form Preview Updated on Complete Schema**
    - **Validates: Requirements 1.2**
  
  - [ ]* 9.7 Write property test for validation errors displayed
    - **Property 8: Validation Errors Displayed**
    - **Validates: Requirements 3.4**
  
  - [ ]* 9.8 Write property test for validation warnings displayed
    - **Property 11: Validation Warnings Displayed**
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.9 Write property test for success indicator
    - **Property 12: Success Indicator on Valid Schema**
    - **Validates: Requirements 5.4**

- [ ] 10. Verify existing functionality preserved
  - [ ]* 10.1 Write property test for schema context in edits
    - **Property 15: Schema Context in Edits**
    - **Validates: Requirements 7.1**
  
  - [ ]* 10.2 Write unit test for example prompts in empty state
    - Test example prompts are displayed when no messages
    - _Requirements: 7.2_
  
  - [ ]* 10.3 Write unit test for API key configuration prompt
    - Test configuration prompt appears when API key is missing
    - _Requirements: 7.3_
  
  - [ ]* 10.4 Write property test for provider compatibility
    - **Property 16: Provider Compatibility**
    - **Validates: Requirements 7.4**

- [ ] 11. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility with existing functionality
- All validation and error handling logic is preserved
