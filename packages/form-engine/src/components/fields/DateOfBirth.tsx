// packages/form-engine/src/components/fields/DateOfBirth.tsx
// Date of birth as month / day / year inputs. The stored value is an ISO
// date string (YYYY-MM-DD), the same as the `date` field, so rules and
// exporters treat both alike.
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { defineField } from "../../core/defineField";
import { SubField } from "./composite";

export interface DateParts {
	month: string;
	day: string;
	year: string;
}

const EMPTY_PARTS: DateParts = { month: "", day: "", year: "" };

/** Splits an ISO date into its parts; anything else becomes empty parts. */
export function partsFromIso(iso: unknown): DateParts {
	if (typeof iso !== "string") return EMPTY_PARTS;
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	return m ? { year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) } : EMPTY_PARTS;
}

/** Composes an ISO date from parts when they form a real calendar date; otherwise null. */
export function isoFromParts({ month, day, year }: DateParts): string | null {
	if (!/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day) || !/^\d{4}$/.test(year)) return null;
	const m = Number(month);
	const d = Number(day);
	const y = Number(year);
	if (m < 1 || m > 12 || d < 1 || d > 31) return null;
	const date = new Date(Date.UTC(y, m - 1, d));
	if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
	return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Whole years between `iso` and `today` (both ISO dates). */
export function ageInYears(iso: string, today: Date = new Date()): number {
	const [y, m, d] = iso.split("-").map(Number);
	let age = today.getUTCFullYear() - y;
	const beforeBirthday = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
	if (beforeBirthday) age -= 1;
	return age;
}

/** Validation message for a composed date against the field's age limits, or null when fine. */
export function dateOfBirthProblem(iso: string | null, parts: DateParts, limits: { minAge?: number; maxAge?: number }, today: Date = new Date()): string | null {
	const touched = parts.month || parts.day || parts.year;
	if (!touched) return null;
	if (!iso) return "Enter a real date as month, day and four-digit year.";
	if (iso > today.toISOString().slice(0, 10)) return "Date of birth cannot be in the future.";
	const age = ageInYears(iso, today);
	if (limits.minAge !== undefined && age < limits.minAge) return `You must be at least ${limits.minAge} years old.`;
	if (limits.maxAge !== undefined && age > limits.maxAge) return `Age cannot be more than ${limits.maxAge} years.`;
	return null;
}

function DateOfBirthInput({
	id,
	value,
	onChange,
	disabled,
	required,
	describedBy,
	minAge,
	maxAge,
}: {
	id: string;
	value: string;
	onChange: (iso: string) => void;
	disabled: boolean;
	required: boolean;
	describedBy?: string;
	minAge?: number;
	maxAge?: number;
}) {
	const [parts, setParts] = useState<DateParts>(() => partsFromIso(value));
	const [lastValue, setLastValue] = useState(value);
	const yearRef = useRef<HTMLInputElement>(null);

	// Adopt an outside change (undo, rules, initial data) without clobbering
	// in-progress typing: while the parts do not form a date the stored value
	// is "" too, and that must not reset what the user has typed so far.
	if (value !== lastValue) {
		setLastValue(value);
		const composed = isoFromParts(parts) ?? "";
		if (value !== composed && (value !== "" || composed !== "")) setParts(partsFromIso(value));
	}

	// Radix Form clears a control's custom validity on every change, so re-apply
	// the current problem after every render rather than only when it changes.
	const problem = dateOfBirthProblem(isoFromParts(parts), parts, { minAge, maxAge });
	useEffect(() => {
		yearRef.current?.setCustomValidity(problem ?? "");
	});

	const update = (part: keyof DateParts, text: string) => {
		const next = { ...parts, [part]: text.replace(/\D/g, "") };
		setParts(next);
		onChange(isoFromParts(next) ?? "");
	};

	return (
		<div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="mt-1.5 grid grid-cols-3 gap-3 max-w-xs">
			<SubField fieldId={id} part="month" label="Month" inputMode="numeric" placeholder="MM" maxLength={2} autoComplete="bday-month" required={required} disabled={disabled} value={parts.month} onChange={(e) => update("month", e.target.value)} />
			<SubField fieldId={id} part="day" label="Day" inputMode="numeric" placeholder="DD" maxLength={2} autoComplete="bday-day" required={required} disabled={disabled} value={parts.day} onChange={(e) => update("day", e.target.value)} />
			<SubField fieldId={id} part="year" label="Year" inputMode="numeric" placeholder="YYYY" maxLength={4} autoComplete="bday-year" required={required} disabled={disabled} value={parts.year} onChange={(e) => update("year", e.target.value)} inputRef={yearRef} customError={problem} />
		</div>
	);
}

export const DateOfBirthConfigSchema = defineField<
	{
		minAge: z.ZodOptional<z.ZodNumber>;
		maxAge: z.ZodOptional<z.ZodNumber>;
		defaultValue: z.ZodOptional<z.ZodString>;
	},
	string
>({
	type: "dateOfBirth",
	description: "Date of birth entered as month, day and year inputs; the value is an ISO date (YYYY-MM-DD) like the `date` field",
	example: { id: "dateOfBirth", label: "Your date of birth*", minAge: 18 },
	notes: "Use `dateOfBirth` instead of `date` for birth dates: it rejects future dates and can enforce `minAge` / `maxAge`.",
	schema: {
		minAge: z.number().int().nonnegative().optional().describe("Minimum age in whole years"),
		maxAge: z.number().int().positive().optional().describe("Maximum age in whole years"),
		defaultValue: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)").optional(),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, disabled, required, inputProps }) => (
		<DateOfBirthInput
			id={inputProps.id}
			value={typeof value === "string" ? value : ""}
			onChange={setValue}
			disabled={disabled}
			required={required}
			describedBy={inputProps["aria-describedby"]}
			minAge={config.minAge}
			maxAge={config.maxAge}
		/>
	),
}).schema;
export type DateOfBirthConfig = z.infer<typeof DateOfBirthConfigSchema>;
