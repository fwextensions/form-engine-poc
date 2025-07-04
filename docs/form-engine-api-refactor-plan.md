# FormEngine API Refactoring Plan

This document outlines a plan to refactor the `FormEngine` component to provide a more robust and flexible API for parent components. The goal is to improve encapsulation, reduce redundant logic in parent components, and provide a clear, powerful interface for interaction.

## 1. Current State Analysis

Currently, `FormEngine` supports a hybrid (controlled/uncontrolled) model for page navigation. A parent component can control the page via the `currentPage` and `onPageChange` props.

However, the parent component, such as the `form-editor`, is responsible for parsing the form schema to extract metadata like page count and page titles. This creates several issues:

- **Duplicated Logic**: The parent re-implements schema parsing logic that already exists within `FormEngine`.
- **Tight Coupling**: The parent is tightly coupled to the internal structure of the form schema. Changes to the schema could break the parent component.
- **Lack of Imperative Control**: There is no direct way for a parent to command the `FormEngine` to perform actions (e.g., "go to page 3"). Control is limited to passing props.

## 2. Proposed Refactoring: A Hybrid Callback and Imperative API

We will implement a hybrid pattern that combines callbacks for metadata reporting and an imperative handle for direct control, as inspired by the provided examples.

### Phase 1: Expose Metadata via Callbacks

We will introduce new props to `FormEngine` to allow it to report metadata back to the parent.

1.  **Introduce `onMetaChange` Prop**:
    -   Add a new optional prop: `onMetaChange?: (meta: FormMeta) => void;`.
    -   Define the `FormMeta` interface:
        ```typescript
        export interface FormMeta {
          formTitle: string;
          pageCount: number;
          pageTitles: string[];
        }
        ```

2.  **Implement Metadata Extraction**:
    -   Inside `FormEngine`, create a `useEffect` hook that triggers when the `schema` prop changes.
    -   This hook will parse the schema, extract the `title`, `pages.length`, and `pages.map(p => p.title)`.
    -   It will then call `onMetaChange` with this information.

**Benefit**: This change will eliminate the need for the `form-editor` (or any other parent) to parse the schema itself. It will receive all necessary display metadata directly from the engine.

### Phase 2: Expose Imperative API via `useImperativeHandle`

We will expose a set of imperative methods to the parent component using `React.forwardRef` and `useImperativeHandle`.

1.  **Refactor `FormEngine` with `forwardRef`**:
    -   Wrap the `FormEngine` component definition in `React.forwardRef`.

2.  **Define `FormEngineHandle`**:
    -   Create an exported type for the handle's API:
        ```typescript
        export interface FormEngineHandle {
          goToPage: (pageIndex: number) => void;
          getMeta: () => FormMeta & { currentPageIndex: number; currentPageTitle: string; };
        }
        ```

3.  **Implement `useImperativeHandle`**:
    -   Inside `FormEngine`, call `useImperativeHandle`, exposing the following methods:
        -   `goToPage(pageIndex)`: An imperative function to navigate the form. It will perform bounds checking and call the internal `handleNavigate` function.
        -   `getMeta()`: A function that returns a complete snapshot of the form's current state, including static metadata and the current page index/title.

**Benefit**: The parent can now directly command the `FormEngine` (e.g., `formRef.current.goToPage(2)`), which is ideal for control from external UI elements like a toolbar.

## 3. Implementation in `form-editor`

The `form-editor` will be updated to use this new API.

1.  **Create and Pass a Ref**: A `ref` of type `FormEngineHandle` will be created with `useRef` and passed to the `<FormEngine>` component.
2.  **Remove Redundant Logic**: The manual schema parsing logic in `form-editor/src/app/page.tsx` will be removed.
3.  **Use `onMetaChange`**: The `EditorToolbar` and other UI elements will be driven by state that is populated by the `onMetaChange` callback.
4.  **Update Navigation Controls**: The `handlePrevPage` and `handleNextPage` functions in the `EditorToolbar` will be updated to call `formRef.current?.goToPage(...)`.

## 4. Challenges and Considerations

-   **State Synchronization**: The flow of control will be: `Parent UI -> Imperative Handle -> Engine -> onPageChange Callback -> Parent State`. This loop must be carefully managed to prevent inconsistencies or re-rendering loops. The existing `onPageChange` prop will be crucial for closing this loop.
-   **API Surface**: This change adds complexity to the `FormEngine` API. Clear documentation and TypeScript definitions will be essential for future use.
