# Migration Plan: @chatscope to assistant-ui

## Overview
Replace @chatscope/chat-ui-kit-react with @assistant-ui/react for the AI chat interface in form-editor while preserving all existing functionality.

## Files to Modify

| File | Action |
|------|--------|
| `packages/form-editor/package.json` | Update dependencies |
| `packages/form-editor/src/components/AIChat.tsx` | Refactor to use assistant-ui |
| `packages/form-editor/src/components/__tests__/AIChat.test.tsx` | Update mocks |
| `packages/form-editor/src/components/__tests__/AIChat-useChat-integration.test.tsx` | Update mocks |

## Step 1: Update Dependencies

**Remove:**
```json
"@chatscope/chat-ui-kit-react": "^2.1.1",
"@chatscope/chat-ui-kit-styles": "^1.4.0"
```

**Add:**
```json
"@assistant-ui/react": "^0.12.5",
"@assistant-ui/react-ai-sdk": "^1.3.4"
```

## Step 2: Component Mapping

| @chatscope | assistant-ui | Notes |
|------------|--------------|-------|
| `MainContainer` + `ChatContainer` | `Thread` | Single component replaces both |
| `MessageList` | `ThreadPrimitive.Messages` | Use primitives for custom rendering |
| `Message` | Custom component | Build with `MessagePrimitive` |
| `MessageInput` | `ComposerPrimitive.Input` + `ComposerPrimitive.Send` | Separate input and button |
| `TypingIndicator` | Built-in | Automatic in assistant-ui Thread |

## Step 3: Refactor AIChat.tsx

### 3.1 Update Imports
```typescript
// Remove
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

// Add
import { AssistantRuntimeProvider, Thread, ThreadPrimitive, ComposerPrimitive, MessagePrimitive } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
```

### 3.2 Runtime Configuration
Replace the `useChat` hook with `useChatRuntime`:
```typescript
const runtime = useChatRuntime({
  api: '/api/llm',
  body: () => {
    // Preserve existing body function logic (lines 57-85)
  },
  onFinish: (options) => {
    // Preserve existing validation logic (lines 108-140)
  }
});
```

### 3.3 Component Structure
Wrap with `AssistantRuntimeProvider` and use `Thread`:

```tsx
<AssistantRuntimeProvider runtime={runtime}>
  <div className="flex flex-col h-full bg-white">
    {/* Header - keep existing */}

    {/* Chat area */}
    <div className="flex-1 overflow-hidden">
      <Thread.Root>
        <Thread.Viewport>
          <ThreadPrimitive.Empty>
            {/* Empty state content - preserve existing (lines 204-290) */}
          </ThreadPrimitive.Empty>
          <ThreadPrimitive.Messages components={{ Message: CustomMessage }} />
        </Thread.Viewport>
        <Thread.ScrollToBottom />
      </Thread.Root>
    </div>

    {/* Input area */}
    <div className="border-t border-slate-200 p-4">
      <ComposerPrimitive.Root>
        <ComposerPrimitive.Input placeholder="Describe your form..." />
        <ComposerPrimitive.Send />
      </ComposerPrimitive.Root>
    </div>
  </div>
</AssistantRuntimeProvider>
```

### 3.4 Custom Message Component
Create a custom message renderer to preserve validation feedback:

```tsx
function CustomMessage() {
  const message = useMessage();
  const validation = getValidationForMessage(message.id);

  return (
    <>
      <MessagePrimitive.Root>
        <MessagePrimitive.Content />
      </MessagePrimitive.Root>

      {/* Validation errors - preserve existing (lines 365-378) */}
      {/* Validation warnings - preserve existing (lines 380-393) */}
      {/* Success indicator - preserve existing (lines 395-405) */}
    </>
  );
}
```

## Step 4: Handle Custom Features

### 4.1 Empty State with Example Prompts
Use `ThreadPrimitive.Empty` to render the existing empty state UI (API key check, example prompts, schema context indicator).

### 4.2 Validation State
Keep the existing `validationResults` Map state. Access it in the custom message component via closure or React Context.

### 4.3 Schema Context Indicator
Preserve the existing header that shows "I can see and modify your current schema" (line 319-323).

### 4.4 Message Transformation
The `onFinish` callback pattern works the same - extract YAML, validate, and call `onSchemaGenerated`.

## Step 5: Update Tests

### 5.1 Remove old mocks
```typescript
// Remove
vi.mock("@chatscope/chat-ui-kit-styles/dist/default/styles.min.css", () => ({}));
```

### 5.2 Add new mocks
```typescript
vi.mock("@assistant-ui/react", () => ({
  AssistantRuntimeProvider: ({ children }) => children,
  Thread: { Root: ({ children }) => children, Viewport: ({ children }) => children },
  ThreadPrimitive: { Empty: ({ children }) => children, Messages: () => null },
  ComposerPrimitive: { Root: ({ children }) => children, Input: () => null, Send: () => null },
  MessagePrimitive: { Root: ({ children }) => children, Content: () => null },
  useMessage: vi.fn(),
}));

vi.mock("@assistant-ui/react-ai-sdk", () => ({
  useChatRuntime: vi.fn(() => ({})),
}));
```

## Implementation Order

1. **Package changes** - Add assistant-ui, remove chatscope
2. **Create custom message component** - Extract validation display logic
3. **Refactor AIChat.tsx** - Replace imports and component structure
4. **Preserve empty state** - Move into ThreadPrimitive.Empty
5. **Wire up runtime** - Convert useChat to useChatRuntime
6. **Update tests** - Fix mocks and assertions
7. **Manual testing** - Verify all functionality

## Verification

### Run dev server
```bash
npm run dev --workspace=form-editor
```

### Test checklist
- [ ] Empty state displays with example prompts
- [ ] API key requirement check works
- [ ] Schema context indicator appears when schema exists
- [ ] Messages stream in real-time
- [ ] Loading/typing indicator shows during generation
- [ ] Validation errors display below AI messages
- [ ] Validation warnings display below AI messages
- [ ] Success indicator shows when schema is valid
- [ ] Schema updates in editor on success
- [ ] All providers work (Anthropic, OpenAI, Google, Bedrock)

### Run tests
```bash
npm run test --workspace=form-editor
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Runtime API differences | Keep using `DefaultChatTransport` from `ai` package if `useChatRuntime` doesn't support all features |
| Message format changes | Test message.parts structure carefully, may need adapter |
| Styling differences | Use Tailwind classes directly on primitives, no external CSS needed |
