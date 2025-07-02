import React, { JSX } from "react";
import { z } from "zod";
import { baseComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";

export const HtmlConfigSchema = baseComponentConfigSchema.extend({
	type: z.literal("html"),
	content: z.string(),
	tag: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type HtmlConfig = z.infer<typeof HtmlConfigSchema>;

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

createComponent<HtmlConfig, HtmlProps>({
	type: "html",
	schema: HtmlConfigSchema,
	component: Html,
});

export default Html;
