// The generated system prompt is a product surface: every change to it should
// be visible in review. Update with `npx vitest run -u` when a change is intended.

import { describe, it, expect } from "vitest";
import "../../components";
import { getRegisteredCatalog } from "../../core/componentFactory";
import { generateCatalogPrompt } from "../prompt";

describe("catalog prompt snapshot", () => {
	it("matches the committed prompt", async () => {
		const prompt = generateCatalogPrompt(getRegisteredCatalog(), { includeExamples: true });
		await expect(prompt).toMatchFileSnapshot("./__snapshots__/catalog-prompt.md");
	});
});
