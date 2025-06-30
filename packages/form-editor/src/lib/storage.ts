const FORM_STORAGE_PREFIX = "form-editor-";

const getFormKey = (name: string): string => `${FORM_STORAGE_PREFIX}${name}`;

export function getSavedForms(): string[]
{
	if (typeof window === "undefined") {
		return [];
	}

	const savedForms: string[] = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);

		if (key?.startsWith(FORM_STORAGE_PREFIX)) {
			savedForms.push(key.replace(FORM_STORAGE_PREFIX, ""));
		}
	}

	return savedForms;
}

export function getFormContent(name: string)
{
	if (typeof window === "undefined") {
		return null;
	}

	return localStorage.getItem(getFormKey(name));
}

export function saveFormContent(
	name: string,
	yaml: string)
{
	if (typeof window === "undefined") {
		return;
	}

	localStorage.setItem(getFormKey(name), yaml);
}

export function deleteFormContent(name: string) {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.removeItem(getFormKey(name));
}
