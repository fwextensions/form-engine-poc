import React, { JSX } from "react";
import { z } from "zod";
import { baseComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";

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
	let innerHTMLProps = {};

	if (typeof content === "string" && !VoidElements.includes(Wrapper)) {
		innerHTMLProps = { dangerouslySetInnerHTML: { __html: content } };
	}

	return (
		<Wrapper
			id={id}
			className={className}
			style={style}
			{...innerHTMLProps}
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
