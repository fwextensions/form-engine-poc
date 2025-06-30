# Form Preview Package Spec

## Overview
The **form-preview** package provides a standalone Vite-based application to live-preview form schemas defined in YAML. Users can edit the schema file, save changes, and immediately see the updated form—including multi-page navigation—without manual rebuilds.

## Goals
- Import and parse a YAML file (`schema.yaml`) containing a `FormConfig` schema
- Render the form using the existing `FormEngine` component in [`form-engine`](../packages/form-engine)
- Enable Vite's HMR so edits to `schema.yaml` auto-refresh the preview
- Provide a toolbar with Prev/Next buttons to switch pages (mirroring form-editor navigation)

## Project Structure

```
packages/form-preview/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── schema.yaml           # sample form schema
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── index.html        # root HTML
    ├── index.css
    ├── main.tsx          # React entrypoint
    └── components/
        └── Toolbar.tsx   # page navigation toolbar
```

## Dependencies (`package.json`)
```json
{
  "name": "form-preview",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "form-engine": "*"
  },
  "devDependencies": {
    "vite": "^6",
    "@vitejs/plugin-react": "^4.6.0",
    "@rollup/plugin-yaml": "^4.1.2",
    "typescript": "^5",
    "tailwindcss": "^4",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

## TypeScript Config (`tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": "./",
    "paths": {
      "form-engine": ["../form-engine/src"]
    }
  },
  "include": ["src", "schema.yaml"]
}
```

## Vite Config (`vite.config.ts`)
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  plugins: [react(), yaml()],
  resolve: {
    alias: {
      "form-engine": "/packages/form-engine/src",
    },
  },
});
```

## Sample Schema (`schema.yaml`)
```yaml
# sample multipage form
type: form
display: multipage
children:
  - type: page
    id: "page1"
    title: "Personal Info"
    children:
      - type: text
        id: "firstName"
        label: "First Name"
  - type: page
    id: "page2"
    title: "Contact"
    children:
      - type: email
        id: "email"
        label: "Email"
```

## Tailwind CSS Integration
To style the preview with Tailwind CSS, add the following under `packages/form-preview`:

1. Install dev dependencies:
```bash
pnpm add -D tailwindcss@4 postcss autoprefixer
```

2. Create `tailwind.config.js`:
```js
// packages/form-preview/tailwind.config.js
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: { extend: {} },
	plugins: [],
};
```

3. Create `postcss.config.js`:
```js
// packages/form-preview/postcss.config.js
module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
};
```

4. Create `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

5. Import the CSS in `src/main.tsx`:
```tsx
import "./index.css";
```

## React Entrypoint (`src/main.tsx`)
```tsx
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import schema from "../schema.yaml";
import { FormEngine } from "form-engine";
import Toolbar from "./components/Toolbar";
import "./index.css";

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Array.isArray(schema.children)
    ? schema.children.filter((c) => c.type === "page").length
    : 1;

  return (
    <>
      <Toolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <FormEngine
        schema={schema}
        displayMode="multipage"
        currentPage={currentPage}
      />
    </>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
```

## Toolbar Component (`src/components/Toolbar.tsx`)
```tsx
import React from "react";

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentPage, totalPages, onPageChange }) => (
  <div style={{ margin: "1rem 0" }}>
    <span style={{ margin: "0 1rem" }}>
      Page {currentPage + 1} of {totalPages}
    </span>
    <button
      disabled={currentPage <= 0}
      onClick={() => onPageChange(currentPage - 1)}
    >
      &#9664;
    </button>
    <button
      disabled={currentPage >= totalPages - 1}
      onClick={() => onPageChange(currentPage + 1)}
    >
      &#9654;
    </button>
  </div>
);

export default Toolbar;
```

## Hot Module Replacement (HMR)
Vite will automatically reload modules when `schema.yaml` changes. Edits to the YAML file trigger a full React re-render, showing the updated form instantly.

## Usage
1. `pnpm install`
2. `pnpm --filter form-preview dev`
3. Edit `schema.yaml`, save, and watch the live preview at `http://localhost:3000/`
