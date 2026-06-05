import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";

interface ToolbarIconButtonProps {
	onClick: () => void;
	disabled?: boolean;
	title: string;
	"aria-label"?: string;
	variant?: "blue" | "red";
	children: React.ReactNode;
}

const baseClasses =
	"inline-flex h-8 w-8 items-center justify-center rounded text-ink-500 transition-colors enabled:hover:bg-ink-100 enabled:active:bg-ink-200 disabled:opacity-30";

const variantClasses = {
	blue: "enabled:hover:text-primary-600 enabled:active:text-primary-700",
	red: "enabled:hover:text-danger-500 enabled:active:text-danger-700",
};

export default function ToolbarIconButton({
	onClick,
	disabled,
	title,
	"aria-label": ariaLabel,
	variant = "blue",
	children,
}: ToolbarIconButtonProps)
{
	return (
		<Toolbar.Button
			onClick={onClick}
			disabled={disabled}
			className={`${baseClasses} ${variantClasses[variant]}`}
			title={title}
			aria-label={ariaLabel ?? title}
		>
			{children}
		</Toolbar.Button>
	);
}
