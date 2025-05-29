import React, { JSX } from "react";
import type { RegisteredComponentProps } from "../componentRegistry";
import type { StaticHtml } from "../../services/schemaParser";

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

export default function StaticHtmlDisplay({
	component }: RegisteredComponentProps)
{
	const { content, tag, className, style } = component as StaticHtml;
	const Wrapper: keyof JSX.IntrinsicElements = (tag && tag.trim() !== "")
		? tag.toLowerCase() as keyof JSX.IntrinsicElements
		: "div";
	let innerHTMLProps = {};

	if (typeof content === "string" && !VoidElements.includes(Wrapper)) {
		innerHTMLProps = { dangerouslySetInnerHTML: { __html: content } };
	}

	return (
		<Wrapper
			className={className}
			style={style}
			{...innerHTMLProps}
		/>
	);
}
