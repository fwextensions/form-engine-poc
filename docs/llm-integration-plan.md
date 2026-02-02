# LLM Integration Plan for Form Engine

## Overview

This plan outlines how to add LLM-assisted form schema generation to form-engine-poc, inspired by [vercel-labs/json-render](https://github.com/vercel-labs/json-render). Users will be able to describe forms in natural language and have an LLM generate valid YAML schemas, while retaining full manual editing capabilities.

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        form-editor                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   Left Pane (Tabs)   │    │        Right Pane            │  │
│  │  ┌────────┬────────┐ │    │                              │  │
│  │  │  YAML  │   AI   │ │    │      Form Preview            │  │
│  │  └────────┴────────┘ │    │                              │  │
│  │                      │    │                              │  │
│  │  [Monaco Editor]     │    │   [FormEngine render]        │  │
│  │       - or -         │    │                              │  │
│  │  [AI Chat Interface] │    │                              │  │
│  │                      │    │                              │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### New Packages/Modules

1. **`form-engine/catalog/prompt.ts`** - Catalog-to-prompt serialization
2. **`form-editor/components/AIChat.tsx`** - Chat interface component
3. **`form-editor/lib/llm-client.ts`** - LLM API integration
4. **`form-editor/lib/schema-diff.ts`** - Schema diff/merge utilities

---

## Phase 1: Catalog Prompt Generation

### 1.1 Create `generateCatalogPrompt()` function

Add to `packages/form-engine/src/catalog/prompt.ts`:

```typescript
import { Catalog, CatalogEntry } from "./catalog";

export interface CatalogPromptOptions {
  /** Include example schemas for each component */
  includeExamples?: boolean;
  /** Include JSON Schema definitions */
  includeJsonSchema?: boolean;
  /** Custom preamble text */
  preamble?: string;
}

/**
 * Generates a markdown-formatted prompt describing the catalog
 * for LLM consumption. The prompt explains available components,
 * their props, and how to structure valid form schemas.
 */
export function generateCatalogPrompt(
  catalog: Catalog,
  options: CatalogPromptOptions = {}
): string {
  const sections: string[] = [];

  // Preamble
  sections.push(options.preamble || getDefaultPreamble());

  // Component documentation
  sections.push("## Available Components\n");
  for (const [type, entry] of Object.entries(catalog.components)) {
    sections.push(formatComponentDocs(type, entry, options));
  }

  // Schema structure rules
  sections.push(getSchemaStructureRules());

  // Conditional logic documentation
  sections.push(getConditionalLogicDocs());

  // Validation rules
  sections.push(getValidationDocs());

  return sections.join("\n\n");
}

function formatComponentDocs(
  type: string,
  entry: CatalogEntry,
  options: CatalogPromptOptions
): string {
  let doc = `### \`${type}\`\n`;
  doc += entry.description ? `${entry.description}\n` : "";
  doc += entry.hasChildren ? "**Can contain children**\n" : "";

  // Extract prop info from Zod schema
  doc += formatPropsFromSchema(entry.schema);

  if (options.includeExamples) {
    doc += getExampleForType(type);
  }

  return doc;
}
```

### 1.2 Schema-to-prompt utilities

```typescript
/**
 * Extracts human-readable prop documentation from a Zod schema.
 */
function formatPropsFromSchema(schema: z.ZodType<any>): string {
  // Use zod's introspection to extract:
  // - Required vs optional props
  // - Types and constraints
  // - Default values
  // - Enum options (for select, radiogroup, etc.)
}
```

### 1.3 Export from package

```typescript
// packages/form-engine/src/index.ts
export { generateCatalogPrompt } from "./catalog/prompt";
```

---

## Phase 2: LLM Integration

### 2.1 LLM Client Abstraction

Create `packages/form-editor/lib/llm-client.ts`:

```typescript
export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMClient {
  chat(messages: LLMMessage[]): AsyncIterable<string>;
}

// Anthropic implementation
export function createAnthropicClient(apiKey: string): LLMClient {
  return {
    async *chat(messages) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          stream: true,
          messages: messages.map(m => ({
            role: m.role === "system" ? "user" : m.role,
            content: m.content,
          })),
          system: messages.find(m => m.role === "system")?.content,
        }),
      });

      // Stream parsing...
      for await (const chunk of parseSSE(response.body)) {
        yield chunk;
      }
    }
  };
}

// Optional: OpenAI, local models, etc.
export function createOpenAIClient(apiKey: string): LLMClient { /* ... */ }
```

### 2.2 Schema Generation Service

```typescript
// packages/form-editor/lib/schema-generator.ts
import { generateCatalogPrompt, getRegisteredCatalog } from "form-engine";
import type { LLMClient, LLMMessage } from "./llm-client";

export class SchemaGenerator {
  private client: LLMClient;
  private catalogPrompt: string;
  private conversationHistory: LLMMessage[] = [];

  constructor(client: LLMClient) {
    this.client = client;
    this.catalogPrompt = generateCatalogPrompt(getRegisteredCatalog(), {
      includeExamples: true,
    });
  }

  /**
   * Generate a new schema from a description.
   */
  async *generate(description: string): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt("generate");
    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: description },
    ];

    let fullResponse = "";
    for await (const chunk of this.client.chat(messages)) {
      fullResponse += chunk;
      yield chunk;
    }

    // Store in history for follow-up edits
    this.conversationHistory = [
      ...messages,
      { role: "assistant", content: fullResponse },
    ];
  }

  /**
   * Edit an existing schema based on instructions.
   */
  async *edit(currentSchema: string, instructions: string): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt("edit");
    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...this.conversationHistory,
      {
        role: "user",
        content: `Current schema:\n\`\`\`yaml\n${currentSchema}\n\`\`\`\n\nRequested changes: ${instructions}`
      },
    ];

    for await (const chunk of this.client.chat(messages)) {
      yield chunk;
    }
  }

  private buildSystemPrompt(mode: "generate" | "edit"): string {
    return `You are a form schema generator. You create YAML schemas for a form engine.

${this.catalogPrompt}

## Output Format
- Always output valid YAML
- Wrap the schema in \`\`\`yaml code blocks
- ${mode === "edit" ? "Output the COMPLETE modified schema, not just the changes" : ""}
- Include helpful comments explaining complex parts

## Rules
- Only use components from the catalog above
- Every field needs a unique \`id\`
- Use \`validation.required: true\` or label asterisk notation for required fields
- Use \`rules\` for conditional logic (show/hide based on other field values)
`;
  }
}
```

---

## Phase 3: UI Components

### 3.1 Tabbed Editor Pane

```tsx
// packages/form-editor/components/EditorPane.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { MonacoEditor } from "./MonacoEditor";
import { AIChat } from "./AIChat";

interface EditorPaneProps {
  schema: string;
  onSchemaChange: (schema: string) => void;
}

export function EditorPane({ schema, onSchemaChange }: EditorPaneProps) {
  const [activeTab, setActiveTab] = useState<"yaml" | "ai">("yaml");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="yaml">
          <CodeIcon /> YAML Editor
        </TabsTrigger>
        <TabsTrigger value="ai">
          <SparklesIcon /> AI Assistant
        </TabsTrigger>
      </TabsList>

      <TabsContent value="yaml" className="h-full">
        <MonacoEditor
          value={schema}
          onChange={onSchemaChange}
          language="yaml"
        />
      </TabsContent>

      <TabsContent value="ai" className="h-full">
        <AIChat
          currentSchema={schema}
          onSchemaGenerated={onSchemaChange}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### 3.2 AI Chat Interface

```tsx
// packages/form-editor/components/AIChat.tsx
interface AIChatProps {
  currentSchema: string;
  onSchemaGenerated: (schema: string) => void;
}

export function AIChat({ currentSchema, onSchemaGenerated }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const generatorRef = useRef<SchemaGenerator | null>(null);

  // Initialize generator with API key from settings/env
  useEffect(() => {
    const apiKey = getApiKey(); // From settings or env
    if (apiKey) {
      generatorRef.current = new SchemaGenerator(
        createAnthropicClient(apiKey)
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || !generatorRef.current) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsGenerating(true);

    try {
      let assistantMessage = "";
      const isEdit = currentSchema.trim().length > 0;

      const stream = isEdit
        ? generatorRef.current.edit(currentSchema, userMessage)
        : generatorRef.current.generate(userMessage);

      for await (const chunk of stream) {
        assistantMessage += chunk;
        // Update UI with streaming response
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant") {
            updated[lastIdx].content = assistantMessage;
          } else {
            updated.push({ role: "assistant", content: assistantMessage });
          }
          return updated;
        });
      }

      // Extract YAML from response and apply
      const extractedYaml = extractYamlFromResponse(assistantMessage);
      if (extractedYaml) {
        onSchemaGenerated(extractedYaml);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <EmptyState>
            <p>Describe the form you want to create, or ask for changes to the current schema.</p>
            <ExamplePrompts onSelect={setInput} />
          </EmptyState>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={currentSchema
              ? "Describe changes to make..."
              : "Describe the form you want to create..."}
            className="flex-1 resize-none"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !input.trim()}
          >
            {isGenerating ? <Spinner /> : <SendIcon />}
          </button>
        </div>

        {currentSchema && (
          <p className="text-xs text-gray-500 mt-2">
            AI can see your current schema and will modify it based on your request.
          </p>
        )}
      </div>
    </div>
  );
}
```

### 3.3 Schema Diff View (Optional Enhancement)

When AI generates changes, show a diff before applying:

```tsx
// packages/form-editor/components/SchemaDiff.tsx
import { diffLines } from "diff";

interface SchemaDiffProps {
  original: string;
  proposed: string;
  onAccept: () => void;
  onReject: () => void;
}

export function SchemaDiff({ original, proposed, onAccept, onReject }: SchemaDiffProps) {
  const diff = diffLines(original, proposed);

  return (
    <div className="border rounded-lg">
      <div className="flex justify-between items-center p-2 border-b bg-gray-50">
        <span className="font-medium">Proposed Changes</span>
        <div className="flex gap-2">
          <button onClick={onReject} className="text-red-600">Reject</button>
          <button onClick={onAccept} className="text-green-600">Accept</button>
        </div>
      </div>
      <pre className="p-4 text-sm overflow-auto">
        {diff.map((part, i) => (
          <span
            key={i}
            className={
              part.added ? "bg-green-100 text-green-800" :
              part.removed ? "bg-red-100 text-red-800" :
              ""
            }
          >
            {part.value}
          </span>
        ))}
      </pre>
    </div>
  );
}
```

---

## Phase 4: API Key Management

### 4.1 Settings Storage

```typescript
// packages/form-editor/lib/settings.ts
const STORAGE_KEY = "form-editor-settings";

interface Settings {
  llmProvider: "anthropic" | "openai";
  apiKey?: string;
  // Don't store key in localStorage in production - use server-side
}

export function getSettings(): Settings {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { llmProvider: "anthropic" };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
```

### 4.2 Settings UI

```tsx
// packages/form-editor/components/SettingsDialog.tsx
export function SettingsDialog() {
  const [settings, setSettings] = useState(getSettings);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button><GearIcon /></button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>

        <label>
          LLM Provider
          <select
            value={settings.llmProvider}
            onChange={e => setSettings(s => ({ ...s, llmProvider: e.target.value }))}
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>

        <label>
          API Key
          <input
            type="password"
            value={settings.apiKey || ""}
            onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
            placeholder="sk-..."
          />
        </label>

        <button onClick={() => saveSettings(settings)}>Save</button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 5: Validation & Error Handling

### 5.1 Schema Validation Before Apply

```typescript
// packages/form-editor/lib/schema-validator.ts
import { parseRootFormSchema, getRegisteredCatalog } from "form-engine";
import YAML from "yaml";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSchema(yamlString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. YAML syntax check
  let parsed: any;
  try {
    parsed = YAML.parse(yamlString);
  } catch (e) {
    return { valid: false, errors: [`Invalid YAML: ${e.message}`], warnings };
  }

  // 2. Form schema validation
  try {
    parseRootFormSchema(yamlString);
  } catch (e) {
    errors.push(`Schema error: ${e.message}`);
  }

  // 3. Component type validation
  const catalog = getRegisteredCatalog();
  const unknownTypes = findUnknownTypes(parsed, catalog);
  if (unknownTypes.length > 0) {
    errors.push(`Unknown component types: ${unknownTypes.join(", ")}`);
  }

  // 4. ID uniqueness check
  const duplicateIds = findDuplicateIds(parsed);
  if (duplicateIds.length > 0) {
    warnings.push(`Duplicate IDs: ${duplicateIds.join(", ")}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 5.2 LLM Output Extraction

```typescript
// packages/form-editor/lib/yaml-extractor.ts

/**
 * Extracts YAML from LLM response, handling code blocks.
 */
export function extractYamlFromResponse(response: string): string | null {
  // Try to find ```yaml ... ``` block
  const yamlBlockMatch = response.match(/```ya?ml\n([\s\S]*?)```/);
  if (yamlBlockMatch) {
    return yamlBlockMatch[1].trim();
  }

  // Try to find ``` ... ``` block (any language)
  const codeBlockMatch = response.match(/```\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    const content = codeBlockMatch[1].trim();
    // Validate it looks like YAML
    if (content.includes(":") && !content.startsWith("{")) {
      return content;
    }
  }

  // If response looks like raw YAML, use it directly
  if (response.trim().startsWith("id:") || response.trim().startsWith("type:")) {
    return response.trim();
  }

  return null;
}
```

---

## Implementation Order

### Sprint 1: Foundation (1-2 days)
1. [ ] Create `generateCatalogPrompt()` in form-engine
2. [ ] Extract prop documentation from Zod schemas
3. [ ] Add component examples for prompt
4. [ ] Export from package

### Sprint 2: LLM Client (1 day)
1. [ ] Create LLM client abstraction
2. [ ] Implement Anthropic client with streaming
3. [ ] Create SchemaGenerator service
4. [ ] Add YAML extraction utility

### Sprint 3: UI - Chat Interface (2-3 days)
1. [ ] Add tabs to editor pane
2. [ ] Create AIChat component
3. [ ] Implement message display with streaming
4. [ ] Add example prompts / empty state
5. [ ] Wire up schema generation flow

### Sprint 4: Polish (1-2 days)
1. [ ] Add settings dialog for API key
2. [ ] Implement schema validation
3. [ ] Add diff view for proposed changes
4. [ ] Error handling and loading states
5. [ ] Keyboard shortcuts

### Sprint 5: Optional Enhancements
1. [ ] OpenAI / other provider support
2. [ ] Conversation history persistence
3. [ ] "Undo" for AI changes
4. [ ] Schema templates / presets
5. [ ] Rate limiting / token counting

---

## Alternative UI Layouts

### Option B: Three-Pane Layout

```
┌─────────────────────┬──────────────────────┐
│                     │                      │
│   YAML Editor       │    Form Preview      │
│                     │                      │
├─────────────────────┴──────────────────────┤
│                                            │
│              AI Chat                       │
│                                            │
└────────────────────────────────────────────┘
```

**Pros:** Both YAML and AI visible simultaneously
**Cons:** Less vertical space for each

### Option C: Slide-out Drawer

```
┌─────────────────────┬──────────────────────┬─────────┐
│                     │                      │   AI    │
│   YAML Editor       │    Form Preview      │  Chat   │
│                     │                      │ (drawer)│
└─────────────────────┴──────────────────────┴─────────┘
```

**Pros:** Doesn't disrupt existing layout
**Cons:** Narrower chat area

### Recommendation

Start with **Option A (Tabbed)** as it's simplest to implement and provides the best experience for each mode. Can evolve to three-pane if users want to see YAML while chatting.

---

## Security Considerations

1. **API Key Storage**
   - For local dev: localStorage is acceptable
   - For production: Use server-side proxy to avoid exposing keys
   - Consider: Environment variables, encrypted storage

2. **Content Injection**
   - Sanitize LLM output before rendering as preview
   - Validate YAML structure before applying

3. **Rate Limiting**
   - Implement client-side throttling
   - Consider token budget per session

---

## Success Metrics

1. **User can generate a working form from a text description**
   - e.g., "Create a contact form with name, email, and message fields"

2. **User can modify existing schema via chat**
   - e.g., "Add a phone number field and make email required"

3. **Generated schemas are always valid**
   - Validation catches 100% of invalid outputs

4. **Seamless switching between manual and AI editing**
   - No loss of work when switching tabs
