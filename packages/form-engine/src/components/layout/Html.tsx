import React, { JSX } from "react";
import { z } from "zod";
import { baseComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";

/**
 * Rewrite every rule in a CSS string so its selector is prefixed with
 * `scopeSelector`, keeping styles from bleeding outside the element.
 * Handles @-rules (e.g. @media) by recursing into their bodies.
 * Leaves `html`, `body`, and `:root` selectors unscoped.
 */
function scopeCSS(css: string, scopeSelector: string): string {
	let result = "";
	let i = 0;

	while (i < css.length) {
		// Pass whitespace through unchanged.
		if (/\s/.test(css[i])) { result += css[i++]; continue; }

		// Pass /* comments */ through unchanged.
		if (css.startsWith("/*", i)) {
			const end = css.indexOf("*/", i + 2);
			const stop = end === -1 ? css.length : end + 2;
			result += css.slice(i, stop);
			i = stop;
			continue;
		}

		if (css[i] === "@") {
			// @-rule: keep the header verbatim, recurse into the body.
			const headerStart = i;
			while (i < css.length && css[i] !== "{" && css[i] !== ";") i++;
			if (i >= css.length || css[i] === ";") {
				result += css.slice(headerStart, css[i] === ";" ? i + 1 : i);
				if (css[i] === ";") i++;
				continue;
			}
			result += css.slice(headerStart, i + 1); // include opening {
			i++;
			let depth = 1;
			const bodyStart = i;
			while (i < css.length && depth > 0) {
				if (css[i] === "{") depth++;
				else if (css[i] === "}") depth--;
				i++;
			}
			result += scopeCSS(css.slice(bodyStart, i - 1), scopeSelector) + "}";
		} else {
			// Regular rule: read selector up to {, then body up to matching }.
			const selectorStart = i;
			while (i < css.length && css[i] !== "{") i++;
			if (i >= css.length) { result += css.slice(selectorStart); break; }

			const rawSelector = css.slice(selectorStart, i);
			i++; // skip {

			let depth = 1;
			const bodyStart = i;
			while (i < css.length && depth > 0) {
				if (css[i] === "{") depth++;
				else if (css[i] === "}") depth--;
				i++;
			}
			const body = css.slice(bodyStart, i - 1);

			const scoped = rawSelector.trim().split(",").map(s => {
				const t = s.trim();
				if (!t || /^(?:html|body|:root)\b/i.test(t)) return t;
				return `${scopeSelector} ${t}`;
			}).join(", ");

			result += `${scoped} { ${body} }`;
		}
	}
	return result;
}

function scopeStyleTags(html: string, scopeSelector: string): string {
	return html.replace(
		/<style([^>]*)>([\s\S]*?)<\/style>/gi,
		(_, attrs, css) => `<style${attrs}>${scopeCSS(css, scopeSelector)}</style>`,
	);
}

// 1. Define Configuration Schema (colocated with component)
export const HtmlConfigSchema = baseComponentConfigSchema.extend({
	type: z.literal("html"),
	content: z.string(),
	tag: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type HtmlConfig = z.infer<typeof HtmlConfigSchema>;

// 2. Define Props for the React Component
export interface HtmlProps extends Omit<HtmlConfig, 'type' | 'condition'> {
	// id is inherited from baseComponentConfigSchema via HtmlConfig
}

const VoidElements = [
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr"
];

const FORM_SCOPE_SELECTOR = "#form-engine-root";

// 3. Create the React Component
const Html: React.FC<HtmlProps> = ({
	content,
	tag,
	className,
	style,
	id
}) => {
	const Wrapper: keyof JSX.IntrinsicElements = (tag && tag.trim() !== "")
		? tag.toLowerCase() as keyof JSX.IntrinsicElements
		: "div";

	if (typeof content !== "string" || VoidElements.includes(Wrapper)) {
		return <Wrapper id={id} className={className} style={style} />;
	}

	const hasStyle = /<style[\s>]/i.test(content);
	const processedContent = hasStyle ? scopeStyleTags(content, FORM_SCOPE_SELECTOR) : content;

	return (
		<Wrapper
			id={id}
			className={className}
			style={style}
			dangerouslySetInnerHTML={{ __html: processedContent }}
		/>
	);
};

// 4. Register the Component (schema is colocated, auto-registered to catalog)
createComponent<HtmlConfig, HtmlProps>({
	type: "html",
	schema: HtmlConfigSchema,
	component: Html,
	description: "Static HTML content block for rendering custom markup",
});

export default Html;
