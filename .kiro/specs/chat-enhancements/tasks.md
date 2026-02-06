# Implementation Plan: Chat Enhancements

## Overview

Implement markdown rendering for LLM assistant messages and server-side Bedrock API key support in the form-editor package. Uses `@assistant-ui/react-markdown` for markdown and environment variables for server credentials.

## Tasks

- [x] 1. Add markdown rendering to assistant messages
  - [x] 1.1 Install `@assistant-ui/react-markdown` dependency in `packages/form-editor`
    - Run `npm install @assistant-ui/react-markdown --workspace=form-editor`
    - _Requirements: 1.1_

  - [x] 1.2 Create the MarkdownText component at `packages/form-editor/src/components/assistant-ui/markdown-text.tsx`
    - Use `MarkdownTextPrimitive` from `@assistant-ui/react-markdown`
    - Add custom component overrides for `p`, `ul`, `ol`, `li`, `h1`, `h2`, `h3`, `code`, `a`, `blockquote` with Tailwind classes matching the existing chat theme (slate color palette)
    - Wrap in `memo` for performance
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.3 Integrate MarkdownText into AIChat's CustomMessage component
    - For assistant messages: use `MessagePrimitive.Parts` with `components={{ Text: MarkdownText }}` instead of the raw `<div className="whitespace-pre-wrap">{displayContent}</div>`
    - For user messages: keep the existing plain text rendering (`whitespace-pre-wrap`)
    - Preserve the existing YAML code block hiding logic (the `displayContent` computation that strips YAML blocks and shows the streaming indicator)
    - Preserve the schema-applied checkmark indicator
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [ ]* 1.4 Write unit tests for markdown rendering
    - Test that assistant messages with markdown syntax render styled HTML elements (headings, bold, lists, code blocks, links)
    - Test that user messages display raw text without markdown processing
    - Test that YAML code blocks are still hidden from display content
    - _Requirements: 1.1, 1.3, 1.5_

- [x] 2. Implement server-side Bedrock credential support
  - [x] 2.1 Create the GET `/api/llm/credentials` endpoint at `packages/form-editor/src/app/api/llm/credentials/route.ts`
    - Read `BEDROCK_API_KEY` and `AWS_REGION` from `process.env`
    - Return `{ bedrockConfigured: boolean }` — true only when both env vars are non-empty
    - Ensure the response never contains actual credential values
    - _Requirements: 3.1_

  - [x] 2.2 Modify `createProvider` in `packages/form-editor/src/app/api/llm/route.ts` to use server-side Bedrock credentials
    - In the `bedrock` case, check `process.env.BEDROCK_API_KEY` and `process.env.AWS_REGION` first
    - If both are set, use them to create the Bedrock provider (server credentials take precedence)
    - If not set, fall back to existing client-supplied credential logic unchanged
    - Adjust validation so that missing client credentials don't cause an error when server credentials are available
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.3 Write property test for credential resolution (Property 4)
    - **Property 4: Credential resolution selects correct source**
    - Generate random combinations of server env vars (present/absent) and client credentials (present/absent/partial)
    - Assert: server credentials used when both env vars set; client credentials used when server absent; error thrown when neither available
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 2.4 Write property test for credential status endpoint (Property 5)
    - **Property 5: Credential status endpoint is correct and safe**
    - Generate random env var states (undefined, empty string, non-empty string) for `BEDROCK_API_KEY` and `AWS_REGION`
    - Assert: `bedrockConfigured` is true iff both are non-empty; response body never contains actual credential values
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 3.1**

- [x] 3. Checkpoint - Ensure server-side credential logic works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add client awareness of server-side credentials
  - [x] 4.1 Add server credential status functions to `packages/form-editor/src/lib/settings.ts`
    - Add `fetchServerCredentialStatus()` — async function that calls GET `/api/llm/credentials` and caches the result
    - Add `setServerCredentialStatus()` and `getServerCredentialStatus()` for cache management
    - Modify `hasApiKey()` to return `true` for the `bedrock` provider when cached server status shows `bedrockConfigured: true`, even without client-side credentials
    - _Requirements: 3.3_

  - [ ]* 4.2 Write property test for hasApiKey with server credentials (Property 6)
    - **Property 6: hasApiKey reflects server credential availability**
    - Generate random `LLMSettings` with `provider: "bedrock"` and varying client credential states
    - With server status cached as `bedrockConfigured: true`, assert `hasApiKey()` returns `true`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 3.3**

  - [x] 4.3 Update AIChat component to check server credential status on mount
    - Call `fetchServerCredentialStatus()` in a `useEffect` on mount
    - If `bedrockConfigured` is true and no client-side credentials exist, auto-select `bedrock` provider and enable the chat interface
    - Update the transport body builder to skip sending client Bedrock credentials when server has them configured
    - _Requirements: 3.4, 2.2_

  - [x] 4.4 Update SettingsDialog to show server credential indicator
    - When `bedrockConfigured` is true, show an informational banner in the Bedrock section: "Server-provided Bedrock credentials are active. Entering your own is optional."
    - Keep credential input fields visible but not required
    - _Requirements: 3.2_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `@assistant-ui/react-markdown` handles streaming markdown natively, so no special streaming logic is needed
- `fast-check` is already in devDependencies
- The existing YAML extraction and schema-application logic in `CustomMessage` is preserved
