/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { getComponentDefinition, getRegisteredCatalog, type ConfigIssue } from "./componentFactory";
import { resolveAllowedChildren } from "../catalog/catalog";

/** One problem found anywhere in a schema tree. */
export interface SchemaIssue {
	/** Dotted path from the root, e.g. `children[1].children[0].labell`. */
	path: string;
	/** `id` of the component the issue belongs to, when it has one. */
	componentId?: string;
	componentType?: string;
	message: string;
	severity: "error" | "warning";
	code: string;
}

export interface ParseRootFormSchemaResult {
	/** The validated root config (children left as authored), or null when the root itself is unusable. */
	config: any;
	/** Present when any error-severity issue exists. Built from `issues` for callers that expect a ZodError. */
	errors?: z.ZodError;
	/** Every error and warning found in the whole tree, root first. */
	issues: SchemaIssue[];
}

function joinPath(prefix: string, segments: (string | number)[]): string {
	let out = prefix;
	for (const seg of segments) {
		out += typeof seg === "number" ? `[${seg}]` : out ? `.${seg}` : seg;
	}
	return out;
}

function toSchemaIssues(prefix: string, node: Record<string, any>, issues: ConfigIssue[]): SchemaIssue[] {
	return issues.map((issue) => ({
		path: joinPath(prefix, issue.path),
		componentId: typeof node.id === "string" ? node.id : undefined,
		componentType: typeof node.type === "string" ? node.type : undefined,
		message: issue.message,
		severity: issue.severity,
		code: issue.code,
	}));
}

/**
 * Walks a raw schema tree and checks every node against the registry:
 * unknown types, invalid or unknown properties, disallowed nesting and
 * duplicate field ids. Never throws.
 */
export function validateSchemaTree(rawSchema: unknown): SchemaIssue[] {
	const issues: SchemaIssue[] = [];
	const catalog = getRegisteredCatalog();
	const seenIds = new Map<string, string>();

	function visit(raw: unknown, prefix: string, parentType: string | undefined) {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
			issues.push({ path: prefix, message: "Expected a component object", severity: "error", code: "invalid_type" });
			return;
		}
		const node = raw as Record<string, any>;
		if (typeof node.type !== "string") {
			issues.push({ path: joinPath(prefix, ["type"]), componentId: node.id, message: "Component is missing a `type`", severity: "error", code: "invalid_type" });
			return;
		}
		if (typeof node.id === "string" && node.id.length > 0) {
			const previous = seenIds.get(node.id);
			if (previous !== undefined) {
				issues.push({
					path: joinPath(prefix, ["id"]),
					componentId: node.id,
					componentType: node.type,
					message: `Duplicate id "${node.id}" (also used at ${previous || "the root"})`,
					severity: "warning",
					code: "duplicate_id",
				});
			} else {
				seenIds.set(node.id, prefix);
			}
		}

		const definition = getComponentDefinition(node.type);
		if (!definition) {
			issues.push({
				path: joinPath(prefix, ["type"]),
				componentId: typeof node.id === "string" ? node.id : undefined,
				componentType: node.type,
				message: `Unknown component type "${node.type}". Available types: ${Object.keys(catalog.components).sort().join(", ")}`,
				severity: "error",
				code: "unknown_type",
			});
			return;
		}

		if (parentType) {
			const parentDef = getComponentDefinition(parentType);
			const allowed = parentDef ? resolveAllowedChildren(catalog, parentDef) : [];
			if (parentDef && !allowed.includes(node.type)) {
				issues.push({
					path: joinPath(prefix, ["type"]),
					componentId: typeof node.id === "string" ? node.id : undefined,
					componentType: node.type,
					message: parentDef.children
						? `A "${parentType}" cannot contain a "${node.type}"`
						: `A "${parentType}" cannot contain children`,
					severity: "error",
					code: "disallowed_child",
				});
			}
		}

		issues.push(...toSchemaIssues(prefix, node, definition.checkConfig(node).issues));

		if (Array.isArray(node.children)) {
			node.children.forEach((child: unknown, index: number) => visit(child, joinPath(prefix, ["children", index]), node.type));
		} else if (node.children !== undefined) {
			issues.push({ path: joinPath(prefix, ["children"]), componentId: node.id, componentType: node.type, message: "`children` must be an array", severity: "error", code: "invalid_type" });
		}
	}

	visit(rawSchema, "", undefined);

	// A review page summarises the pages before it, so it belongs last and alone.
	const rootChildren = (rawSchema as { children?: unknown })?.children;
	if (Array.isArray(rootChildren)) {
		const reviewIndices = rootChildren.flatMap((child, index) => (child && typeof child === "object" && (child as { type?: unknown }).type === "reviewPage" ? [index] : []));
		for (const index of reviewIndices.slice(0, -1)) {
			issues.push({ path: joinPath("", ["children", index]), componentId: (rootChildren[index] as { id?: string }).id, componentType: "reviewPage", message: "Only one reviewPage is needed; this one is not the last", severity: "warning", code: "review_page_position" });
		}
		const last = reviewIndices[reviewIndices.length - 1];
		if (last !== undefined && last !== rootChildren.length - 1) {
			issues.push({ path: joinPath("", ["children", last]), componentId: (rootChildren[last] as { id?: string }).id, componentType: "reviewPage", message: "A reviewPage should be the last page of the form; later pages are not included in its summary", severity: "warning", code: "review_page_position" });
		}
	}
	return issues;
}

/**
 * Parses and validates the root form schema configuration using the component registry.
 * The rawSchema is expected to be the configuration for a root component (e.g., type: "form").
 *
 * The returned `config` is the validated root (its children are left as
 * authored and validated lazily by the renderer); `issues` covers the whole
 * tree so editors can show every problem at once.
 */
export function parseRootFormSchema(rawSchema: unknown): ParseRootFormSchemaResult
{
	const issues = validateSchemaTree(rawSchema);
	const errors = issues.filter((issue) => issue.severity === "error");

	let config: any = null;
	if (rawSchema && typeof rawSchema === "object" && typeof (rawSchema as any).type === "string") {
		const definition = getComponentDefinition((rawSchema as any).type);
		config = definition?.checkConfig(rawSchema).config ?? null;
	}

	if (errors.length === 0) {
		return { config, issues };
	}

	return {
		config,
		issues,
		errors: new z.ZodError(errors.map((issue) => ({
			code: "custom" as const,
			path: issue.path ? issue.path.split(/\.|\[|\]/).filter(Boolean).map((p) => (/^\d+$/.test(p) ? Number(p) : p)) : [],
			message: issue.message,
			input: undefined,
		}))),
	};
}
