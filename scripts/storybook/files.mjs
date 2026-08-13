/** Shared file discovery for the story generator and the coverage report. */
import fs from 'node:fs';
import path from 'node:path';

export const COMPONENT_ROOT = 'src/components';

/** Files that are not components, or are not worth a story of their own. */
const EXCLUDE = [/\.(test|spec|stories)\.tsx?$/, /\.i18n\.tsx?$/, /[/\\]index\.tsx?$/, /[/\\]__(tests|mocks|fixtures)__[/\\]/, /\.d\.ts$/];

export const isExcluded = (file) => EXCLUDE.some((pattern) => pattern.test(file));

export function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile() && full.endsWith('.tsx') && !isExcluded(full)) out.push(full);
	}
	return out;
}

export const storyPathFor = (componentPath) => componentPath.replace(/\.tsx$/, '.stories.tsx');

/** The `src/components/<layer>` the file belongs to — 'atoms', 'molecules', … or 'other'. */
export function layerOf(componentPath) {
	const relative = path.relative(path.resolve(COMPONENT_ROOT), path.resolve(componentPath));
	if (relative.startsWith('..')) return 'other';
	const [layer] = relative.split(path.sep);
	return layer ?? 'other';
}
