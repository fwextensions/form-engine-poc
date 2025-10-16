// packages/form-engine/src/utils/deepMerge.ts
// minimally opinionated deep merge for plain objects

const isObject = (v: unknown): v is Record<string, any> =>
	v !== null && typeof v === "object" && !Array.isArray(v);

export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U {
	const out: Record<string, any> = { ...target };
	for (const key of Object.keys(source)) {
		const sv = (source as any)[key];
		const tv = (target as any)[key];
		if (isObject(tv) && isObject(sv)) {
			out[key] = deepMerge(tv, sv);
		} else {
			out[key] = sv;
		}
	}
	return out as T & U;
}
