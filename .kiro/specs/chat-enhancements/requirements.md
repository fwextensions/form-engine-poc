# Requirements Document

## Introduction

This feature enhances the form-editor's AI chat experience with two improvements: (1) rendering markdown in LLM responses as styled text instead of raw markdown, and (2) supporting a server-side Bedrock API key via environment variable so that administrators can pre-configure credentials without requiring end users to enter their own keys in the browser UI.

## Glossary

- **AI_Chat**: The chat interface component (`AIChat.tsx`) that allows users to interact with an LLM to generate and modify form schemas.
- **LLM_API_Route**: The Next.js API route (`/api/llm/route.ts`) that proxies requests from the client to LLM providers using the Vercel AI SDK.
- **Settings_Dialog**: The Radix UI dialog component (`SettingsDialog.tsx`) where users configure their LLM provider and credentials.
- **Settings_Manager**: The client-side settings module (`settings.ts`) that reads and writes LLM configuration to localStorage.
- **Markdown_Renderer**: A component responsible for converting markdown text into styled HTML within assistant messages.
- **Server_Credentials**: API credentials configured via server-side environment variables, as opposed to client-supplied credentials stored in localStorage.

## Requirements

### Requirement 1: Markdown Rendering in Assistant Messages

**User Story:** As a user, I want LLM responses displayed with proper markdown formatting, so that I can read structured content like headings, lists, code snippets, and emphasis without seeing raw markdown syntax.

#### Acceptance Criteria

1. WHEN the AI_Chat displays an assistant message containing markdown syntax, THE Markdown_Renderer SHALL convert the markdown into styled HTML elements.
2. WHEN the assistant message contains inline code or fenced code blocks, THE Markdown_Renderer SHALL render them with monospace styling and visual distinction from surrounding text.
3. WHEN the assistant message contains a YAML code block (```yaml or ```yml), THE AI_Chat SHALL continue to hide the YAML block and show the schema-applied indicator, preserving existing behavior.
4. WHEN the assistant message contains headings, bold, italic, lists, or links, THE Markdown_Renderer SHALL render each element with appropriate visual styling consistent with the existing chat theme.
5. WHEN a user message is displayed, THE AI_Chat SHALL render user messages as plain text without markdown processing.
6. WHEN the assistant message is still streaming, THE Markdown_Renderer SHALL render the partial markdown content progressively without layout shifts or flickering.

### Requirement 2: Server-Side Bedrock API Key Support

**User Story:** As an administrator, I want to configure a Bedrock API key on the server via environment variables, so that users can use the AI chat without needing to supply their own credentials.

#### Acceptance Criteria

1. WHEN the `BEDROCK_API_KEY` and `AWS_REGION` environment variables are set on the server, THE LLM_API_Route SHALL use those server-side credentials for Bedrock requests instead of client-supplied credentials.
2. WHEN server-side Bedrock credentials are configured, THE LLM_API_Route SHALL accept requests that omit client-side Bedrock credentials without returning an authentication error.
3. WHEN server-side Bedrock credentials are not configured, THE LLM_API_Route SHALL require client-supplied credentials and maintain existing authentication behavior.
4. WHEN both server-side and client-supplied Bedrock credentials are present, THE LLM_API_Route SHALL prefer the server-side credentials.
5. IF the server-side Bedrock credentials are invalid or the Bedrock API returns an authentication error, THEN THE LLM_API_Route SHALL return a descriptive error message to the client.

### Requirement 3: Client Awareness of Server-Side Credentials

**User Story:** As a user, I want the UI to indicate when server-side credentials are available, so that I know I can use the AI chat without configuring my own API key.

#### Acceptance Criteria

1. WHEN the client queries the server for credential availability, THE LLM_API_Route SHALL expose a GET endpoint that returns whether server-side Bedrock credentials are configured, without revealing the actual credentials.
2. WHEN server-side Bedrock credentials are available, THE Settings_Dialog SHALL indicate to the user that a server-provided key is active and that entering their own Bedrock credentials is optional.
3. WHEN server-side Bedrock credentials are available and the user has not configured any client-side credentials, THE Settings_Manager SHALL report that credentials are available (via `hasApiKey`) so that the AI_Chat enables the chat interface.
4. WHEN server-side Bedrock credentials are available, THE AI_Chat SHALL allow the user to send messages using the Bedrock provider without requiring client-side credential entry.
