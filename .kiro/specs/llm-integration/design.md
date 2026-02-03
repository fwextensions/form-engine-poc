# Design Document: LLM-Assisted Form Schema Generation

## Overview

This design describes the implementation of LLM-assisted form schema generation for the form-editor application. The feature enables users to describe forms in natural language and have an LLM generate valid YAML schemas, while maintaining full manual editing capabilities.

The architecture follows a layered approach:
1. **Catalog Prompt Layer** (form-engine): Serializes component catalog to LLM-consumable documentation
2. **LLM Client Layer** (form-editor): Abstracts LLM provider communication with streaming support
3. **Schema Generator Service** (form-editor): Orchestrates prompt building and conversation management
4. **UI Layer** (form-editor): Tabbed interface with chat component using off-the-shelf library

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           form-editor                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │      Left Pane (Tabs)      │    │         Right Pane              │  │
│  │  ┌──────────┬───────────┐  │    │                                 │  │
│  │  │   YAML   │    AI     │  │    │       Form Preview              │  │
│  │  │  Editor  │ Assistant │  │    │                                 │  │
│  │  └──────────┴───────────┘  │    │    [FormEngine render]          │  │
│  │                            │    │                                 │  │
│  │  [Monaco] or [AIChat]      │    │                                 │  │
│  └────────────────────────────┘    └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                           Services Layer                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ SchemaGenerator │──│    LLMClient     │──│   Settings/Storage     │  │
│  └────────┬────────┘  └──────────────────┘  └────────────────────────┘  │
│           │                                                              │
│  ┌────────▼────────┐  ┌──────────────────┐                              │
│  │  YamlExtractor  │  │ SchemaValidator  │                              │
│  └─────────────────┘  └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           form-engine                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Catalog Prompt Generator                      │    │
│  │  generateCatalogPrompt() → Markdown documentation for LLM       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐    │
│  │                    Component Catalog                             │    │
│  │  getRegisteredCatalog() → { components: Record<type, entry> }   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Catalog Prompt Generator (`form-engine/src/catalog/prompt.ts`)

Generates LLM-consumable documentation from the component catalog.

```typescript
export interface CatalogPromptOptions {
  /** Include YAML examples for each component */
  includeExamples?: boolean;
  /** Custom preamble text */
  preamble?: string;
}

/**
 * Generates a markdown-formatted prompt describing the catalog
 * for LLM consumption.
 */
export function generateCatalogPrompt(
  catalog: Catalog,
  options?: CatalogPromptOptions
): string;

/**
 * Extracts human-readable property documentation from a Zod schema.
 * Returns markdown-formatted property list with types, constraints,
 * required/optional status, and defaults.
 */
export function formatPropsFromZodSchema(schema: z.ZodType<any>): string;
```

The prompt includes:
- Preamble explaining the form engine
- Component documentation (type, description, props, children capability)
- Schema structure rules (YAML format, id requirements)
- Conditional logic documentation (rules system)
- Validation rules documentation

### 2. LLM Client (`form-editor/src/lib/llm-client.ts`)

Abstract interface for LLM provider communication.

```typescript
export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export interface LLMClient {
  /**
   * Sends messages to the LLM and returns a streaming response.
   * Yields string chunks as they arrive.
   */
  chat(messages: LLMMessage[]): AsyncIterable<string>;
}

/**
 * Creates an Anthropic Claude client with SSE streaming.
 */
export function createAnthropicClient(config: LLMClientConfig): LLMClient;
```

The Anthropic implementation:
- Uses the Messages API with streaming enabled
- Parses Server-Sent Events (SSE) from the response stream
- Extracts text delta events and yields content chunks
- Handles API errors with descriptive messages

### 3. Schema Generator Service (`form-editor/src/lib/schema-generator.ts`)

Orchestrates LLM interactions for schema generation and editing.

```typescript
export class SchemaGenerator {
  private client: LLMClient;
  private catalogPrompt: string;
  private conversationHistory: LLMMessage[];

  constructor(client: LLMClient);

  /**
   * Generates a new schema from a natural language description.
   * Streams the response and stores conversation history.
   */
  generate(description: string): AsyncIterable<string>;

  /**
   * Edits an existing schema based on instructions.
   * Includes current schema in context and requests complete output.
   */
  edit(currentSchema: string, instructions: string): AsyncIterable<string>;

  /**
   * Clears conversation history for a fresh start.
   */
  resetConversation(): void;
}
```

System prompt structure:
```
You are a form schema generator. You create YAML schemas for a form engine.

[Catalog Documentation]

## Output Format
- Always output valid YAML
- Wrap the schema in ```yaml code blocks
- Output the COMPLETE schema (not just changes)
- Include helpful comments

## Rules
- Only use components from the catalog
- Every field needs a unique `id`
- Use `validation.required: true` for required fields
- Use `rules` for conditional logic
```

### 4. YAML Extractor (`form-editor/src/lib/yaml-extractor.ts`)

Extracts YAML from LLM responses.

```typescript
/**
 * Extracts YAML content from an LLM response.
 * Handles: ```yaml blocks, ``` blocks, raw YAML.
 * Returns null if no valid YAML found.
 */
export function extractYamlFromResponse(response: string): string | null;
```

Extraction priority:
1. Look for ` ```yaml ` or ` ```yml ` code blocks
2. Look for generic ` ``` ` code blocks containing YAML-like content
3. Check if raw response looks like YAML (starts with `id:` or `type:`)

### 5. Schema Validator (`form-editor/src/lib/schema-validator.ts`)

Validates extracted schemas before applying.

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a YAML schema string.
 * Checks: YAML syntax, form-engine schema, component types, ID uniqueness.
 */
export function validateSchema(yamlString: string): ValidationResult;
```

Validation steps:
1. Parse YAML syntax (js-yaml)
2. Validate against form-engine schema parser
3. Check all component types exist in catalog
4. Warn about duplicate field IDs

### 6. Settings Storage (`form-editor/src/lib/settings.ts`)

Manages LLM configuration persistence.

```typescript
export type LLMProvider = "anthropic" | "openai";

export interface LLMSettings {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
}

export function getSettings(): LLMSettings;
export function saveSettings(settings: LLMSettings): void;
export function hasApiKey(): boolean;
```

### 7. UI Components

#### EditorPane (`form-editor/src/components/EditorPane.tsx`)

Tabbed container for YAML editor and AI chat.

```typescript
interface EditorPaneProps {
  schema: string;
  onSchemaChange: (schema: string) => void;
  activeTab: "yaml" | "ai";
  onTabChange: (tab: "yaml" | "ai") => void;
}
```

Uses Radix UI Tabs for the tab interface.

#### AIChat (`form-editor/src/components/AIChat.tsx`)

Chat interface using `@chatscope/chat-ui-kit-react` library.

```typescript
interface AIChatProps {
  currentSchema: string;
  onSchemaGenerated: (schema: string) => void;
}
```

The chatscope library provides:
- `MainContainer`, `ChatContainer` - Layout containers
- `MessageList`, `Message` - Message display with auto-scroll
- `MessageInput` - Input with typing indicator support
- `TypingIndicator` - Loading state display

Features:
- Streaming message display (update message content as chunks arrive)
- Empty state with example prompts
- Schema context indicator
- Validation error display
- API key configuration prompt when not set

#### SettingsDialog (`form-editor/src/components/SettingsDialog.tsx`)

Dialog for LLM configuration.

```typescript
interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

Uses Radix UI Dialog with form fields for:
- Provider selection (Anthropic/OpenAI dropdown)
- API key input (password field)
- Model selection (optional)

## Data Models

### Chat Message

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** For assistant messages, extracted schema if any */
  extractedSchema?: string;
  /** Validation result for extracted schema */
  validationResult?: ValidationResult;
}
```

### LLM Settings (localStorage)

```typescript
// Key: "form-editor-llm-settings"
interface StoredSettings {
  provider: "anthropic" | "openai";
  apiKey?: string;  // Note: For POC only, production should use server-side
  model?: string;
}
```

### Catalog Entry (existing, for reference)

```typescript
interface CatalogEntry {
  schema: z.ZodType<any>;
  hasChildren?: boolean;
  description?: string;
  transformConfig?: (data: Record<string, any>) => Record<string, any>;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Catalog Prompt Completeness

*For any* catalog with registered components, the generated prompt SHALL contain documentation for each component including its type name, description (if provided), and children capability indicator.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Zod Schema Property Extraction

*For any* Zod schema with defined properties (required, optional, with defaults, with constraints), the extracted property documentation SHALL accurately reflect the property's type, required/optional status, default value, and constraints.

**Validates: Requirements 1.2**

### Property 3: Conditional Example Inclusion

*For any* catalog and prompt generation with `includeExamples: true`, the generated prompt SHALL contain a YAML example for each component type in the catalog.

**Validates: Requirements 1.8**

### Property 4: System Prompt Contains Catalog

*For any* SchemaGenerator instance, when generating a new schema, the system prompt passed to the LLM SHALL contain the catalog documentation.

**Validates: Requirements 3.1**

### Property 5: Conversation History Maintenance

*For any* sequence of generate/edit calls on a SchemaGenerator, the conversation history SHALL contain all previous user prompts and assistant responses in order.

**Validates: Requirements 3.3**

### Property 6: Edit Prompt Includes Current Schema

*For any* edit operation with a non-empty current schema, the user message sent to the LLM SHALL contain the current schema wrapped in a code block.

**Validates: Requirements 3.4**

### Property 7: Settings Round-Trip

*For any* valid LLMSettings object, saving to localStorage and then loading SHALL produce an equivalent settings object.

**Validates: Requirements 6.4**

### Property 8: YAML Extraction from Responses

*For any* LLM response containing YAML content (whether in ` ```yaml ` blocks, generic ` ``` ` blocks, or as raw YAML-like text), the YAML extractor SHALL return the YAML content. *For any* response without YAML content, the extractor SHALL return null.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 9: YAML Syntax Validation

*For any* string input, the schema validator SHALL correctly identify valid vs invalid YAML syntax, returning appropriate error messages for invalid YAML.

**Validates: Requirements 7.4**

### Property 10: Form-Engine Schema Validation

*For any* valid YAML string, the schema validator's result SHALL be consistent with the form-engine parseRootFormSchema function—if form-engine accepts it, validation passes; if form-engine rejects it, validation fails with the same errors.

**Validates: Requirements 7.5**

### Property 11: Unknown Component Type Detection

*For any* schema containing component types not registered in the catalog, the schema validator SHALL report those types as unknown in the errors array.

**Validates: Requirements 7.6**

### Property 12: Duplicate ID Detection

*For any* schema containing multiple components with the same `id` value, the schema validator SHALL include a warning about the duplicate IDs.

**Validates: Requirements 7.7**

### Property 13: Tab Switch State Preservation

*For any* schema state in the editor, switching between YAML and AI tabs and back SHALL preserve the exact schema content.

**Validates: Requirements 4.4**

## Error Handling

### LLM Client Errors

| Error Type | Handling |
|------------|----------|
| Network failure | Throw error with message "Network error: Unable to connect to LLM service" |
| API authentication error (401) | Throw error with message "Authentication failed: Please check your API key" |
| Rate limit error (429) | Throw error with message "Rate limit exceeded: Please wait before retrying" |
| Server error (5xx) | Throw error with message "Server error: The LLM service is temporarily unavailable" |
| Invalid response format | Throw error with message "Invalid response: Unable to parse LLM response" |

### Schema Validation Errors

| Error Type | User Message |
|------------|--------------|
| Invalid YAML syntax | "YAML syntax error: [parser error message]" |
| Schema validation failure | "Schema error: [form-engine error message]" |
| Unknown component type | "Unknown component type: [type]. Available types: [list]" |
| Duplicate IDs | "Warning: Duplicate field IDs found: [ids]" |

### YAML Extraction Failures

When no valid YAML is found in an LLM response:
1. Display the full response to the user
2. Show message: "No valid schema found in the response. The AI's response is shown above."
3. Allow user to manually copy/paste if they see usable content

### Recovery Actions

- All errors allow the user to modify their prompt and retry
- Network errors show a "Retry" button
- Validation errors show the specific issues and keep the chat open for follow-up

## Testing Strategy

### Property-Based Testing

Use `fast-check` for property-based testing in TypeScript. Each property test should run minimum 100 iterations.

**Catalog Prompt Tests** (`form-engine/src/catalog/__tests__/prompt.property.test.ts`):
- Generate arbitrary catalogs with random components
- Verify prompt completeness properties (1, 2, 3)

**YAML Extraction Tests** (`form-editor/src/lib/__tests__/yaml-extractor.property.test.ts`):
- Generate arbitrary strings with/without YAML content
- Verify extraction property (8)

**Schema Validation Tests** (`form-editor/src/lib/__tests__/schema-validator.property.test.ts`):
- Generate arbitrary YAML strings (valid/invalid)
- Generate schemas with known/unknown component types
- Generate schemas with unique/duplicate IDs
- Verify validation properties (9, 10, 11, 12)

**Settings Tests** (`form-editor/src/lib/__tests__/settings.property.test.ts`):
- Generate arbitrary settings objects
- Verify round-trip property (7)

### Unit Tests

**Catalog Prompt Unit Tests**:
- Test with empty catalog
- Test with single component
- Test with component having all optional fields
- Test example generation toggle

**LLM Client Unit Tests**:
- Mock API responses for success cases
- Mock API errors (401, 429, 500)
- Test SSE parsing with sample event streams

**Schema Generator Unit Tests**:
- Test system prompt construction
- Test edit prompt includes schema
- Test conversation history accumulation
- Test resetConversation clears history

**YAML Extractor Unit Tests**:
- Test ` ```yaml ` block extraction
- Test ` ```yml ` block extraction
- Test generic ` ``` ` block extraction
- Test raw YAML detection
- Test no YAML found case

**Schema Validator Unit Tests**:
- Test valid schema passes
- Test invalid YAML syntax fails
- Test unknown component type detection
- Test duplicate ID warning

### Integration Tests

**Editor Integration Tests**:
- Test tab switching preserves schema
- Test new form switches to AI tab
- Test AI-generated schema appears in YAML editor
- Test settings persistence across page reload

### Test Configuration

```typescript
// fast-check configuration
fc.configureGlobal({
  numRuns: 100,
  verbose: true,
});
```

Each property test file should include a comment referencing the design property:
```typescript
// Feature: llm-integration, Property 8: YAML Extraction from Responses
// Validates: Requirements 7.1, 7.2, 7.3
```
