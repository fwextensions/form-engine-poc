import React, { useEffect, useRef, useState } from "react";

/**
 * Minimal stand-in for @monaco-editor/react that mirrors how EditorPane
 * drives the real editor: `defaultValue` seeds the model, `onMount` hands
 * back an editor whose model can be read and written, and `onChange`
 * reports user edits.
 */
export function MockMonacoEditor({
	defaultValue,
	value,
	onChange,
	onMount,
}: {
	defaultValue?: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
	onMount?: (editor: unknown) => void;
}) {
	const [text, setText] = useState(defaultValue ?? value ?? "");
	const textRef = useRef(text);
	useEffect(() => {
		textRef.current = text;
	}, [text]);

	useEffect(() => {
		onMount?.({
			getModel: () => ({
				getValue: () => textRef.current,
				setValue: (next: string) => {
					textRef.current = next;
					setText(next);
				},
			}),
			getSelection: () => null,
			setSelection: () => {},
			setPosition: () => {},
			revealLineInCenter: () => {},
			focus: () => {},
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<textarea
			data-testid="monaco-editor"
			value={text}
			onChange={(e) => {
				setText(e.target.value);
				onChange?.(e.target.value);
			}}
		/>
	);
}
