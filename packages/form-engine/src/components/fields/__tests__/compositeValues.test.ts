import { describe, it, expect } from "vitest";
import { partsFromIso, isoFromParts, ageInYears, dateOfBirthProblem } from "../DateOfBirth";
import { toggleSelection } from "../CheckboxGroup";

describe("dateOfBirth helpers", () => {
	it("round-trips ISO dates through parts", () => {
		expect(partsFromIso("1990-04-07")).toEqual({ year: "1990", month: "4", day: "7" });
		expect(isoFromParts({ month: "4", day: "7", year: "1990" })).toBe("1990-04-07");
		expect(partsFromIso(undefined)).toEqual({ month: "", day: "", year: "" });
	});

	it("rejects impossible dates and short years", () => {
		expect(isoFromParts({ month: "2", day: "30", year: "1990" })).toBeNull();
		expect(isoFromParts({ month: "13", day: "1", year: "1990" })).toBeNull();
		expect(isoFromParts({ month: "1", day: "1", year: "90" })).toBeNull();
		expect(isoFromParts({ month: "", day: "", year: "" })).toBeNull();
	});

	it("computes whole years of age", () => {
		const today = new Date(Date.UTC(2026, 10, 5));
		expect(ageInYears("2008-11-05", today)).toBe(18);
		expect(ageInYears("2008-11-06", today)).toBe(17);
	});

	it("explains problems only once the user has typed something", () => {
		const today = new Date(Date.UTC(2026, 10, 5));
		expect(dateOfBirthProblem(null, { month: "", day: "", year: "" }, {}, today)).toBeNull();
		expect(dateOfBirthProblem(null, { month: "2", day: "30", year: "1990" }, {}, today)).toMatch(/real date/);
		expect(dateOfBirthProblem("2030-01-01", { month: "1", day: "1", year: "2030" }, {}, today)).toMatch(/future/);
		expect(dateOfBirthProblem("2010-01-01", { month: "1", day: "1", year: "2010" }, { minAge: 18 }, today)).toMatch(/at least 18/);
		expect(dateOfBirthProblem("1990-01-01", { month: "1", day: "1", year: "1990" }, { minAge: 18 }, today)).toBeNull();
	});
});

describe("checkboxgroup toggleSelection", () => {
	const order = ["a", "b", "c"];
	it("adds and removes values and keeps option order", () => {
		expect(toggleSelection([], "b", order)).toEqual(["b"]);
		expect(toggleSelection(["b"], "a", order)).toEqual(["a", "b"]);
		expect(toggleSelection(["a", "b"], "a", order)).toEqual(["b"]);
	});
	it("compares non-string values by serialized form", () => {
		expect(toggleSelection([1], 1, [1, 2])).toEqual([]);
		expect(toggleSelection([true], false, [true, false])).toEqual([true, false]);
	});
});
