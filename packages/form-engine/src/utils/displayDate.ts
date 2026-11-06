// packages/form-engine/src/utils/displayDate.ts
// Renders an ISO date (YYYY-MM-DD) as "March 4, 1990" for summaries; anything else is returned as-is.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function displayIsoDate(value: unknown): string | null {
	if (typeof value !== "string" || value === "") return null;
	const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return value;
	const month = MONTHS[Number(m[2]) - 1];
	return month ? `${month} ${Number(m[3])}, ${m[1]}` : value;
}
