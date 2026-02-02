import React, { JSX } from "react";
import { createComponent } from "../../core/componentFactory";
// Import the catalog entry - schema comes from here
import { htmlEntry, type HtmlConfig } from "../../catalog/entries/html";

// Re-export the config type for external consumers
export type { HtmlConfig } from "../../catalog/entries/html";

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

// Register the Component using catalog entry
createComponent<HtmlConfig, HtmlProps>({
	type: "html",
	catalogEntry: htmlEntry,
	component: Html,
});

export default Html;
