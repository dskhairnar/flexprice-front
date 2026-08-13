/**
 * Turns the output of `analyze-component.mjs` into `.stories.tsx` source text.
 *
 * The goal is a story that is *useful on arrival* — real `args`, a populated Controls table, spies on
 * every callback — and that a human then edits rather than rewrites. Anything the analyzer wasn't
 * sure about is emitted as a `TODO` comment instead of a plausible-looking guess.
 */
import path from 'node:path';

/** src/components/atoms/Button/Button.tsx -> 'Atoms/Button' */
export function storyTitle(filePath) {
	const relative = path.relative(path.resolve('src/components'), path.resolve(filePath));
	const segments = relative.split(path.sep);
	const fileBase = path.basename(segments.pop(), '.tsx');

	// A component in its own eponymous folder (Button/Button.tsx) shouldn't produce 'Atoms/Button/Button'.
	if (segments.length && segments[segments.length - 1] === fileBase) segments.pop();

	const layer = segments.length ? segments.shift() : 'Misc';
	const capitalised = layer.charAt(0).toUpperCase() + layer.slice(1);

	return [capitalised, ...segments, fileBase].join('/');
}

/**
 * Domain-flavoured sample copy, keyed by prop name. Billing nouns rather than "Lorem ipsum" — a
 * story that says "Metered usage" tells you at a glance whether the layout survives real labels.
 */
const SAMPLE_STRINGS = {
	title: 'Metered usage',
	heading: 'Metered usage',
	label: 'Monthly minutes',
	name: 'Starter plan',
	description: 'Charged per 1,000 API calls, billed monthly in arrears.',
	placeholder: 'Search…',
	error: 'This field is required',
	helperText: 'Applied at the end of the billing period.',
	value: 'sub_01JQ8Z3K4N7P2R9T',
	id: 'plan_01JQ8Z3K4N7P2R9T',
	children: 'Sample content',
	text: 'Sample content',
	content: 'Sample content',
};

const bareType = (prop) => prop.typeText.replace(/\s*\|\s*(undefined|null)/g, '').trim();

const isReactNode = (type) => /\bReact(Node|Element|Child)\b|\bJSX\.Element\b/.test(type);

/**
 * Is this default-value expression safe to paste into a *different* file?
 *
 * `({ size = 'md' })` is; `({ theme = themes.dark })` is not — `themes` is a module-scope import the
 * story never made, so copying it verbatim produces a story that doesn't compile. Anything that
 * isn't a self-contained literal falls back to type-based inference.
 */
const isPortableLiteral = (text) => /^(true|false|null|-?\d+(\.\d+)?|'[^'\\]*'|"[^"\\]*"|`[^`$\\]*`|\[\]|\{\})$/.test(text.trim());

/** Best-effort literal for a prop, as TSX source text. `null` means "leave it out". */
function sampleValue(prop, defaults) {
	// A destructured default is ground truth — prefer it whenever it can travel.
	const declared = defaults[prop.name];
	if (declared !== undefined && isPortableLiteral(declared)) return declared;

	if (prop.isFunction) return 'fn()';
	if (prop.unionMembers?.length) return JSON.stringify(prop.unionMembers[0]);

	const type = bareType(prop);

	if (/^boolean$/.test(type)) return 'false';
	if (/^number$/.test(type)) return '0';

	if (/^string$/.test(type) || isReactNode(type)) {
		const known = SAMPLE_STRINGS[prop.name];
		if (known !== undefined) return JSON.stringify(known);
		// A required prop still needs *something* for the story to render; an optional one is better
		// left out than filled with its own name as placeholder text.
		return prop.optional ? null : JSON.stringify('Sample content');
	}

	if (/\[\]$|^Array<|^readonly /.test(type)) return '[]';
	if (/^Record<|^\{/.test(type)) return '{}';

	return null;
}

function controlFor(prop) {
	if (prop.isFunction) return null;
	if (prop.unionMembers?.length) return `control: 'select', options: ${JSON.stringify(prop.unionMembers)}`;

	const type = bareType(prop);
	if (/^boolean$/.test(type)) return `control: 'boolean'`;
	if (/^number$/.test(type)) return `control: 'number'`;
	if (/^string$/.test(type)) return `control: 'text'`;
	if (isReactNode(type)) return `control: 'text'`;
	if (/\[\]$|^Array<|^Record<|^\{/.test(type)) return `control: 'object'`;
	return null;
}

/** Emit `label:` rather than `"label":` when the name is a plain identifier. */
const key = (name) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name));

const escapeDoc = (text) => text.replace(/\*\//g, '*\\/').replace(/\n+/g, ' ').trim();

function renderArgTypes(props) {
	const lines = [];

	for (const prop of props) {
		if (prop.name === 'key' || prop.name === 'ref') continue;

		const parts = [];
		if (prop.isFunction) parts.push(`action: '${prop.name}'`);

		const control = controlFor(prop);
		if (control) parts.push(control);

		if (prop.doc) parts.push(`description: ${JSON.stringify(escapeDoc(prop.doc))}`);

		if (!parts.length) continue;
		lines.push(`\t\t${key(prop.name)}: { ${parts.join(', ')} },`);
	}

	return lines;
}

function renderArgs(props, defaults) {
	const lines = [];
	const skipped = [];

	for (const prop of props) {
		if (prop.name === 'className' || prop.name === 'key' || prop.name === 'ref') continue;

		const value = sampleValue(prop, defaults);
		if (value === null) {
			// Required and un-inferable — the human has to supply it, so say so loudly.
			if (!prop.optional) skipped.push(prop);
			continue;
		}
		lines.push(`\t\t${key(prop.name)}: ${value},`);
	}

	return { lines, skipped };
}

export function renderStory(analysis) {
	const { componentName, isDefaultExport, exportName, props, defaults, filePath } = analysis;
	const title = storyTitle(filePath);
	const importSpecifier = `./${path.basename(filePath, '.tsx')}`;
	const importClause = isDefaultExport ? componentName : `{ ${exportName} as ${componentName} }`;

	const hasCallbacks = props.some((prop) => prop.isFunction);
	const argTypeLines = renderArgTypes(props);
	const { lines: argLines, skipped } = renderArgs(props, defaults);

	const imports = [`import type { Meta, StoryObj } from '@storybook/react-vite';`];
	if (hasCallbacks) imports.push(`import { fn } from 'storybook/test';`);
	imports.push(`import ${importClause} from '${importSpecifier}';`);

	const todos = skipped.map(
		(prop) => `\t\t// TODO: ${prop.name} is required (${prop.typeText.replace(/\n\s*/g, ' ')}) — supply a realistic fixture.`,
	);

	const body = [
		...imports,
		'',
		'/**',
		` * Scaffolded by \`npm run storybook:gen\`. Edit freely — this file is never regenerated in place`,
		` * unless you pass \`--force\`.`,
		' *',
		` * Before you call it done: cover the states that actually break — loading, empty, error, long`,
		` * text, disabled — and check the story in dark mode and in Arabic (toolbar).`,
		' */',
		`const meta: Meta<typeof ${componentName}> = {`,
		`\ttitle: '${title}',`,
		`\tcomponent: ${componentName},`,
		...(argLines.length || todos.length ? ['\targs: {', ...todos, ...argLines, '\t},'] : []),
		...(argTypeLines.length ? ['\targTypes: {', ...argTypeLines, '\t},'] : []),
		'};',
		'',
		'export default meta;',
		`type Story = StoryObj<typeof ${componentName}>;`,
		'',
		'export const Default: Story = {};',
		'',
	];

	// A disabled state is cheap to scaffold and is the single most commonly forgotten story.
	if (props.some((prop) => prop.name === 'disabled')) {
		body.push('export const Disabled: Story = {', '\targs: { disabled: true },', '};', '');
	}

	return body.join('\n');
}
