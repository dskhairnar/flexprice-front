#!/usr/bin/env node
/**
 * Scaffold Storybook stories from real component types.
 *
 *   npm run storybook:gen -- src/components/atoms/Button/Button.tsx
 *   npm run storybook:gen -- --dir src/components/atoms
 *   npm run storybook:gen -- --missing --dir src/components/atoms --dry-run
 *   npm run storybook:gen -- src/components/atoms/Button/Button.tsx --force
 *
 * Flags:
 *   --dir <path>   Generate for every component under <path> (recursive).
 *   --missing      With --dir: skip components that already have a story. Implied unless --force.
 *   --force        Overwrite existing story files.
 *   --dry-run      Print what would be written; touch nothing.
 *   --quiet        Only print the summary.
 *
 * The generated file is a starting point, not a finished story: it wires up args/argTypes from the
 * component's actual props so Controls work on arrival, and leaves TODOs for props it could not
 * infer a fixture for.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createAnalyzer } from './storybook/analyze-component.mjs';
import { renderStory } from './storybook/render-story.mjs';
import { walk, storyPathFor } from './storybook/files.mjs';

function parseArgs(argv) {
	const options = { files: [], dir: null, missing: false, force: false, dryRun: false, quiet: false };

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--dir') options.dir = argv[++i];
		else if (arg === '--missing') options.missing = true;
		else if (arg === '--force') options.force = true;
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--quiet') options.quiet = true;
		else if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
		else options.files.push(arg);
	}

	if (!options.files.length && !options.dir) {
		throw new Error(
			'Nothing to do. Pass one or more component paths, or --dir <path>.\nSee the header of scripts/generate-story.mjs for usage.',
		);
	}
	return options;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const log = (...args) => !options.quiet && console.log(...args);

	let targets = options.files.map((file) => path.resolve(file));
	if (options.dir) targets = targets.concat(walk(path.resolve(options.dir)));

	// Batch runs default to "only what's missing" — regenerating a whole directory over hand-edited
	// stories is almost never what someone means.
	const skipExisting = options.force ? false : options.missing || Boolean(options.dir);

	const written = [];
	const skipped = [];
	const failed = [];

	// Resolve the skip list before building the program — no point type-checking files we won't emit.
	const pending = targets.filter((target) => {
		if (fs.existsSync(storyPathFor(target)) && skipExisting) {
			skipped.push({ relative: path.relative(process.cwd(), target), reason: 'story already exists' });
			return false;
		}
		return true;
	});

	if (!pending.length) {
		console.log(`\nnothing to do · skipped ${skipped.length} (pass --force to overwrite)`);
		return;
	}

	log(`Type-checking ${pending.length} component${pending.length === 1 ? '' : 's'}…`);
	const analyze = createAnalyzer(pending);

	for (const target of pending) {
		const storyPath = storyPathFor(target);
		const relative = path.relative(process.cwd(), target);

		let analysis;
		try {
			analysis = analyze(target);
		} catch (error) {
			failed.push({ relative, reason: error.message });
			continue;
		}

		if (!analysis) {
			skipped.push({ relative, reason: 'no React component export found' });
			continue;
		}

		const source = renderStory(analysis);

		if (options.dryRun) {
			log(`\n--- ${path.relative(process.cwd(), storyPath)} ---\n${source}`);
		} else {
			fs.writeFileSync(storyPath, source, 'utf8');
			log(`  wrote  ${path.relative(process.cwd(), storyPath)}  (${analysis.props.length} props)`);
		}
		written.push(relative);
	}

	const verb = options.dryRun ? 'would write' : 'wrote';
	console.log(`\n${verb} ${written.length} · skipped ${skipped.length} · failed ${failed.length}`);

	if (failed.length) {
		console.log('\nFailed:');
		for (const { relative, reason } of failed) console.log(`  ${relative}\n    ${reason}`);
	}
	if (skipped.length && !options.quiet && !options.dir) {
		console.log('\nSkipped:');
		for (const { relative, reason } of skipped) console.log(`  ${relative} — ${reason}`);
	}
	if (written.length && !options.dryRun) {
		console.log('\nNext: run `npx prettier --write` on the new files, then flesh out the states that matter.');
	}
}

try {
	main();
} catch (error) {
	console.error(`\n${error.message}\n`);
	process.exit(1);
}
