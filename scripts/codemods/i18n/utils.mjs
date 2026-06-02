import fs from 'fs';
import path from 'path';
import { DEFAULT_NAMESPACE, EXCLUDED_STRING_PATTERNS, NAMESPACE_BY_PATH } from './config.mjs';

export function shouldSkipString(value) {
	if (!value || typeof value !== 'string') return true;
	const trimmed = value.trim();
	if (!trimmed) return true;
	return EXCLUDED_STRING_PATTERNS.some((re) => re.test(trimmed));
}

export function inferNamespaceFromPath(filePath) {
	const normalized = filePath.replace(/\\/g, '/');
	for (const [segment, ns] of NAMESPACE_BY_PATH) {
		if (normalized.includes(segment)) return ns;
	}
	if (/ConnectionDrawer|Environment|Integration|settings/i.test(normalized)) {
		return 'settings';
	}
	return DEFAULT_NAMESPACE;
}

/**
 * WhopConnectionDrawer → connection.whop
 * ChargebeeConnectionDrawer → connection.chargebee
 */
export function inferKeyPrefixFromFile(filePath) {
	const base = path.basename(filePath, path.extname(filePath));
	const provider = base.replace(/ConnectionDrawer$/i, '').replace(/Drawer$/i, '');
	if (!provider || provider === base) return null;
	const slug = provider.charAt(0).toLowerCase() + provider.slice(1);
	return `connection.${slug}`;
}

export function attributeToKeySuffix(attrName, text) {
	const words = text
		.replace(/[^\w\s-]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	const base =
		words.length > 0
			? words[0].toLowerCase() +
				words
					.slice(1)
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
					.join('')
			: 'text';

	switch (attrName) {
		case 'placeholder':
			return `${base}Placeholder`;
		case 'description':
			return `${base}Hint`;
		case 'label':
			return base;
		case 'title':
			return `${base}Title`;
		default:
			return `${base}${attrName.charAt(0).toUpperCase()}${attrName.slice(1)}`;
	}
}

export function jsxTextToKeySuffix(text) {
	const words = text
		.replace(/[^\w\s]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 6);
	if (words.length === 0) return 'copy';
	const camel =
		words[0].toLowerCase() +
		words
			.slice(1)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join('');
	return camel.length > 48 ? `${camel.slice(0, 48)}Copy` : camel;
}

export function fullKey(prefix, suffix, usedKeys) {
	let key = prefix ? `${prefix}.${suffix}` : suffix;
	let attempt = 0;
	while (usedKeys.has(key)) {
		attempt += 1;
		key = prefix ? `${prefix}.${suffix}${attempt}` : `${suffix}${attempt}`;
	}
	usedKeys.add(key);
	return key;
}

export function setNestedValue(obj, keyPath, value) {
	const parts = keyPath.split('.');
	let current = obj;
	for (let i = 0; i < parts.length - 1; i += 1) {
		const part = parts[i];
		if (!(part in current) || typeof current[part] !== 'object') {
			current[part] = {};
		}
		current = current[part];
	}
	const leaf = parts[parts.length - 1];
	if (current[leaf] === undefined) {
		current[leaf] = value;
		return true;
	}
	if (current[leaf] === value) return false;
	return false;
}

export function loadLocaleJson(localeDir, namespace) {
	const filePath = path.join(localeDir, `${namespace}.json`);
	if (!fs.existsSync(filePath)) return { filePath, data: {} };
	return { filePath, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
}

export function saveLocaleJson(filePath, data) {
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
}

export function detectTranslationBinding(sourceFile) {
	const content = sourceFile.getFullText();
	const nsMatch = content.match(/useTranslation\(\s*['"`]([^'"`]+)['"`]\s*\)/);
	const aliasMatch = content.match(/const\s*\{\s*t(?::\s*(\w+))?\s*\}\s*=\s*useTranslation/);
	return {
		namespace: nsMatch?.[1] ?? null,
		identifier: aliasMatch?.[1] ?? 't',
		hasHook: /useTranslation/.test(content),
		hasImport: /from\s+['"]react-i18next['"]/.test(content),
	};
}
