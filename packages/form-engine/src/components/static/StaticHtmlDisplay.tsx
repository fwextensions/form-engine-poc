import React, { JSX } from "react";
import { z } from "zod";
import { baseComponentConfigSchema } from "../baseSchemas"; 
import { createComponent } from "../../core/componentFactory"; 

export const StaticHtmlConfigSchema = baseComponentConfigSchema.extend({
	type: z.literal("html"),
	content: z.string(),
	tag: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type StaticHtmlConfig = z.infer<typeof StaticHtmlConfigSchema>;

export interface StaticHtmlProps extends Omit<StaticHtmlConfig, 'type' | 'condition'> {
	// id is inherited from baseComponentConfigSchema via StaticHtmlConfig
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

const StaticHtmlDisplayComponent: React.FC<StaticHtmlProps> = ({
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

createComponent<StaticHtmlConfig, StaticHtmlProps>({
	type: "html",
	schema: StaticHtmlConfigSchema,
	component: StaticHtmlDisplayComponent,
});

export default StaticHtmlDisplayComponent;
