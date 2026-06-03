#!/usr/bin/env node
/**
 * i18n codemod — extracts JSX string literals targeted by eslint-plugin-i18next (jsx-only)
 * into t('...') calls and merges new keys into src/i18n/locales/en/{namespace}.json
 *
 * Usage:
 *   node scripts/codemods/i18n/run.mjs --dry-run
 *   node scripts/codemods/i18n/run.mjs --write
 *   node scripts/codemods/i18n/run.mjs --write src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx
 *   node scripts/codemods/i18n/run.mjs --write --key-prefix connection.whop --namespace settings <files>
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformFile } from './transform-file.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const LOCALE_DIR = path.join(ROOT, 'src/i18n/locales/en');

function parseArgs(argv) {
	const opts = { dryRun: true, files: [], keyPrefix: undefined, namespace: undefined };
	for (let i = 2; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--write') opts.dryRun = false;
		else if (arg === '--dry-run') opts.dryRun = true;
		else if (arg === '--key-prefix') {
			opts.keyPrefix = argv[i + 1];
			i += 1;
		} else if (arg === '--namespace') {
			opts.namespace = argv[i + 1];
			i += 1;
		} else if (!arg.startsWith('--')) {
			opts.files.push(path.resolve(ROOT, arg));
		}
	}
	return opts;
}

function parseEslintJsonOutput(output) {
	const start = output.indexOf('[');
	if (start < 0) return [];
	const reports = JSON.parse(output.slice(start));
	const files = new Set();
	for (const report of reports) {
		const hasI18n = report.messages?.some((m) => m.ruleId === 'i18next/no-literal-string');
		if (hasI18n) files.add(path.resolve(ROOT, report.filePath));
	}
	return [...files];
}

function discoverFilesFromEslint() {
	try {
		const out = execSync('npx eslint src -f json', {
			cwd: ROOT,
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return parseEslintJsonOutput(out);
	} catch (err) {
		const combined = `${err.stdout ?? ''}${err.stderr ?? ''}`;
		try {
			return parseEslintJsonOutput(combined);
		} catch {
			return [];
		}
	}
}

function main() {
	const opts = parseArgs(process.argv);
	let files = opts.files;

	if (files.length === 0) {
		files = discoverFilesFromEslint();
		console.log(`Discovered ${files.length} file(s) with i18next/no-literal-string violations.`);
	}

	if (files.length === 0) {
		console.log('No files to transform. Pass paths or fix eslint violations first.');
		process.exit(0);
	}

	const write = !opts.dryRun;
	let totalChanges = 0;
	let filesChanged = 0;

	for (const filePath of files) {
		if (!fs.existsSync(filePath)) {
			console.warn(`Skip (not found): ${filePath}`);
			continue;
		}

		const result = transformFile({
			filePath,
			localeDir: LOCALE_DIR,
			write,
			keyPrefix: opts.keyPrefix,
			namespace: opts.namespace,
		});

		if (result.skipped) {
			console.log(`\n${path.relative(ROOT, filePath)} — skipped: ${result.reason}`);
			continue;
		}

		if (result.changes.length === 0) {
			console.log(`\n${path.relative(ROOT, filePath)} — no transformable literals`);
			continue;
		}

		filesChanged += 1;
		totalChanges += result.changes.length;
		const mode = write ? 'APPLIED' : 'DRY-RUN';
		console.log(`\n${path.relative(ROOT, filePath)} [${mode}] ns=${result.namespace} prefix=${result.keyPrefix ?? '(none)'}`);
		for (const c of result.changes) {
			console.log(`  + ${c.key} = "${c.value}"`);
		}
		if (result.localePath) {
			console.log(`  → locale: ${path.relative(ROOT, result.localePath)}`);
		}
	}

	console.log(`\nDone: ${totalChanges} string(s) in ${filesChanged} file(s).${write ? '' : ' Re-run with --write to apply.'}`);
}

main();
