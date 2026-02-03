# Product Overview

Form Engine is a schema-driven dynamic form rendering system that parses YAML form definitions and renders interactive, multi-step web forms with conditional logic and validation.

## Core Capabilities

- **Schema-Driven Forms**: Declarative YAML configuration for form structure, validation, and behavior
- **Dynamic Rendering**: Component factory pattern with runtime registration and prop merging
- **Conditional Logic**: Rules engine that dynamically updates component properties based on form state
- **Multi-Step Navigation**: Page-based forms with validation and state preservation
- **Type Safety**: Zod-based validation with full TypeScript integration

## Key Components

- **form-engine**: Core rendering library with component factory and rules engine
- **form-editor**: Monaco-based schema editor with live preview
- **form-preview**: Standalone Vite application for testing schemas
- **schema-viewer**: Demo application showcasing form capabilities

## Target Use Cases

- Complex multi-page application forms
- Dynamic forms with conditional field visibility and validation
- Forms requiring centralized schema management
- Applications needing runtime form generation from configuration
