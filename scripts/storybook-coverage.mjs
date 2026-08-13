#!/usr/bin/env node
/**
 * Story coverage report — how much of `src/components` is documented in Storybook.
 *
 *   npm run storybook:coverage
 *   npm run storybook:coverage -- --list          # name every uncovered component
 *   npm run storybook:coverage -- --min 25        # exit 1 below 25% (for CI ratcheting)
 *   npm run storybook:coverage -- --json
 *
 * Intended to be ratcheted: set `--min` to just under today's number in CI, and it can only go up.
 */
import fs from 'node:fs';
import path from 'node:path';
import { walk, storyPathFor, layerOf, COMPONENT_ROOT } from './storybook/files.mjs';

const argv = process.argv.slice(2);
const wantsList = argv.includes('--list');
const wantsJson = argv.includes('--json');
const minIndex = argv.indexOf('--min');
const minimum = minIndex === -1 ? null : Number(argv[minIndex + 1]);

const components = walk(path.resolve(COMPONENT_ROOT));

const byLayer = new Map();
const uncovered = [];

for (const component of components) {
	const layer = layerOf(component);
	const covered = fs.existsSync(storyPathFor(component));

	const bucket = byLayer.get(layer) ?? { total: 0, covered: 0 };
	bucket.total += 1;
	if (covered) bucket.covered += 1;
	else uncovered.push(path.relative(process.cwd(), component));
	byLayer.set(layer, bucket);
}

const total = components.length;
const covered = total - uncovered.length;
const percent = total === 0 ? 100 : (covered / total) * 100;

if (wantsJson) {
	console.log(
		JSON.stringify(
			{
				total,
				covered,
				percent: Number(percent.toFixed(2)),
				layers: Object.fromEntries([...byLayer].map(([layer, value]) => [layer, value])),
				uncovered,
			},
			null,
			2,
		),
	);
} else {
	const pad = (text, width) => String(text).padEnd(width);
	console.log('\nStorybook coverage — src/components\n');
	console.log(`  ${pad('layer', 18)}${pad('stories', 10)}${pad('components', 12)}coverage`);
	console.log(`  ${'-'.repeat(50)}`);

	for (const [layer, value] of [...byLayer].sort((a, b) => b[1].total - a[1].total)) {
		const layerPercent = ((value.covered / value.total) * 100).toFixed(1);
		console.log(`  ${pad(layer, 18)}${pad(value.covered, 10)}${pad(value.total, 12)}${layerPercent}%`);
	}

	console.log(`  ${'-'.repeat(50)}`);
	console.log(`  ${pad('total', 18)}${pad(covered, 10)}${pad(total, 12)}${percent.toFixed(1)}%\n`);

	if (wantsList && uncovered.length) {
		console.log('Uncovered:');
		for (const file of uncovered) console.log(`  ${file}`);
		console.log('');
	} else if (uncovered.length) {
		console.log(`Run with --list to name the ${uncovered.length} uncovered components.`);
		console.log(`Scaffold a batch:  npm run storybook:gen -- --dir ${COMPONENT_ROOT}/atoms\n`);
	}
}

if (minimum !== null && percent < minimum) {
	console.error(`Coverage ${percent.toFixed(1)}% is below the required ${minimum}%.`);
	process.exit(1);
}
