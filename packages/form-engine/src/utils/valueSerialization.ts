// packages/form-engine/src/utils/valueSerialization.ts
// centralized helpers for serializing arbitrary option values to string for UI controls

export const serializeForUI = (v: unknown): string => {
	try {
		return JSON.stringify(v);
	} catch {
		// fallback to string coercion if value is not serializable
		return String(v);
	}
};

export const deserializeFromUI = (s: string): unknown => {
	try {
		return JSON.parse(s);
	} catch {
		return s;
	}
};
