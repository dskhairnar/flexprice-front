/**
 * Static analysis of a React component file, using the TypeScript compiler API.
 *
 * Given a `.tsx` path this resolves the exported component and the *real* type of every prop it
 * accepts — including JSDoc, optionality, destructured defaults and string-literal unions. That is
 * what lets the generator emit a story with a working Controls table instead of a wall of `unknown`.
 *
 * Deliberately uses the type checker rather than regexes: props routinely come from an imported
 * interface, an intersection, or `Omit<X, 'y'>`, none of which survive a textual parse.
 */
import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs';

const TSCONFIG = path.resolve(process.cwd(), 'tsconfig.json');

let cachedOptions = null;

function compilerOptions() {
	if (cachedOptions) return cachedOptions;

	const raw = ts.readConfigFile(TSCONFIG, ts.sys.readFile);
	const parsed = ts.parseJsonConfigFileContent(raw.config ?? {}, ts.sys, process.cwd());

	cachedOptions = {
		...parsed.options,
		noEmit: true,
		// Analysis only ever asks about one file's own types; skipping lib checks keeps a single-file
		// program under a second instead of several.
		skipLibCheck: true,
		skipDefaultLibCheck: true,
	};
	return cachedOptions;
}

/** `React.FC<Props>` / `FC<Props>` / `ForwardRefExoticComponent<Props>` — the wrappers that carry props as a type argument. */
const COMPONENT_WRAPPERS = new Set([
	'FC',
	'FunctionComponent',
	'VFC',
	'VoidFunctionComponent',
	'ForwardRefExoticComponent',
	'MemoExoticComponent',
]);

function unwrapWrapperTypeNode(typeNode) {
	if (!typeNode || !ts.isTypeReferenceNode(typeNode) || !typeNode.typeArguments?.length) return null;

	const name = ts.isQualifiedName(typeNode.typeName) ? typeNode.typeName.right.text : typeNode.typeName.text;
	return COMPONENT_WRAPPERS.has(name) ? typeNode.typeArguments[0] : null;
}

/** Reads `({ maxSorts = 10, disabled = false }: Props) => …` so generated args match runtime defaults. */
function destructuredDefaults(paramDeclaration) {
	const defaults = {};
	if (!paramDeclaration || !paramDeclaration.name || !ts.isObjectBindingPattern(paramDeclaration.name)) return defaults;

	for (const element of paramDeclaration.name.elements) {
		if (!element.initializer || !ts.isIdentifier(element.name)) continue;
		defaults[element.name.text] = element.initializer.getText();
	}
	return defaults;
}

/** Walks to the function-ish node behind a component declaration, whatever it is wrapped in. */
function functionLikeOf(node) {
	if (!node) return null;
	if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;

	// forwardRef(...) / memo(...) — the component is the first call argument.
	if (ts.isCallExpression(node)) {
		for (const arg of node.arguments) {
			const found = functionLikeOf(arg);
			if (found) return found;
		}
	}
	if (ts.isVariableDeclaration(node) && node.initializer) return functionLikeOf(node.initializer);
	if (ts.isParenthesizedExpression(node)) return functionLikeOf(node.expression);
	return null;
}

/** A name is component-shaped if it is PascalCase. */
const isComponentName = (name) => /^[A-Z]/.test(name);

function collectExports(sourceFile, checker) {
	const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
	if (!moduleSymbol) return [];

	return checker.getExportsOfModule(moduleSymbol).map((symbol) => {
		const isDefault = symbol.getName() === 'default';
		const aliased = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
		const declaration = aliased.valueDeclaration ?? aliased.declarations?.[0];
		return { symbol: aliased, exportName: symbol.getName(), isDefault, declaration };
	});
}

/**
 * Resolve the props type for one exported symbol.
 * Returns `{ type, paramDeclaration }` or null when the export isn't a component.
 */
function resolvePropsType(entry, checker) {
	const { declaration } = entry;
	if (!declaration) return null;

	// 1. Explicit annotation: `const X: React.FC<Props> = …`
	const annotated = ts.isVariableDeclaration(declaration) ? declaration.type : null;
	const wrapped = unwrapWrapperTypeNode(annotated);
	if (wrapped) {
		return { type: checker.getTypeFromTypeNode(wrapped), paramDeclaration: functionLikeOf(declaration)?.parameters?.[0] ?? null };
	}

	// 2. First parameter of the function behind the export.
	const fn = functionLikeOf(declaration);
	const param = fn?.parameters?.[0];
	if (param) {
		const type = param.type ? checker.getTypeFromTypeNode(param.type) : checker.getTypeAtLocation(param);
		return { type, paramDeclaration: param };
	}

	// A prop-less component (`const Loader = () => <Spinner />`) is still worth a story — `type: null`
	// means "component, no props", as distinct from "not a component".
	if (fn) return { type: null, paramDeclaration: null };

	// 3. Fall back to the call signature of whatever the symbol's type turned out to be.
	const symbolType = checker.getTypeOfSymbolAtLocation(entry.symbol, declaration);
	const [signature] = symbolType.getCallSignatures();
	if (signature?.parameters?.length) {
		const propsSymbol = signature.parameters[0];
		return { type: checker.getTypeOfSymbolAtLocation(propsSymbol, declaration), paramDeclaration: null };
	}

	return null;
}

/** String-literal union -> its members. `'sm' | 'md'` -> ['sm','md']. Returns null for anything else. */
function literalUnionMembers(type) {
	if (!type.isUnion()) return null;

	const members = [];
	for (const member of type.types) {
		if (member.isStringLiteral()) members.push(member.value);
		else if (member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) continue;
		else return null;
	}
	return members.length ? members : null;
}

function describeProp(symbol, propsTypeNode, checker) {
	const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? propsTypeNode;
	const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);

	// An optional prop's type is `T | undefined`, which hides T's call signatures and turns a literal
	// union into a mixed one. Everything downstream wants T itself.
	const bare = checker.getNonNullableType(type);

	// Prefer the *authored* annotation over the checker's expansion: `ReactNode` reads better than
	// the 9-member union it expands to, and it is what the developer will recognise.
	const annotated = declaration && ts.isPropertySignature(declaration) && declaration.type ? declaration.type.getText() : null;
	const computed = checker.typeToString(bare, declaration, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias);

	return {
		name: symbol.getName(),
		typeText: annotated ?? computed,
		optional: Boolean(symbol.flags & ts.SymbolFlags.Optional),
		doc: ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim(),
		unionMembers: literalUnionMembers(bare),
		isFunction: bare.getCallSignatures().length > 0,
	};
}

/**
 * Build one TypeScript program covering every file you intend to analyze, and return an analyzer
 * bound to it.
 *
 * Batching matters: a program for this codebase takes a few seconds to construct, so doing it
 * per-file turns `--dir src/components` into minutes of redundant work.
 *
 * @param {string[]} filePaths
 * @returns {(filePath: string) => object | null}
 */
export function createAnalyzer(filePaths) {
	const roots = filePaths.map((file) => path.resolve(file));
	for (const root of roots) {
		if (!fs.existsSync(root)) throw new Error(`No such file: ${root}`);
	}

	const program = ts.createProgram(roots, compilerOptions());
	const checker = program.getTypeChecker();

	return (filePath) => analyzeWith(program, checker, path.resolve(filePath));
}

/**
 * @param {string} filePath absolute or cwd-relative path to a `.tsx` component
 * @returns {{ filePath: string, componentName: string, isDefaultExport: boolean, props: Array<object>, defaults: Record<string,string> } | null}
 */
export function analyzeComponent(filePath) {
	return createAnalyzer([filePath])(filePath);
}

function analyzeWith(program, checker, absolute) {
	const sourceFile = program.getSourceFile(absolute);
	if (!sourceFile) throw new Error(`TypeScript could not load ${absolute}`);

	const fileBase = path.basename(absolute, path.extname(absolute));
	const exportEntries = collectExports(sourceFile, checker);

	// Prefer the export whose name matches the filename (Button.tsx -> Button), then the default
	// export, then any PascalCase export. This mirrors how the codebase actually names things.
	const candidates = exportEntries.filter((entry) => entry.isDefault || isComponentName(entry.exportName));
	const chosen =
		candidates.find((entry) => entry.exportName === fileBase) ??
		candidates.find((entry) => entry.isDefault) ??
		candidates.find((entry) => isComponentName(entry.exportName));

	if (!chosen) return null;

	const resolved = resolvePropsType(chosen, checker);
	if (!resolved) return null;

	const localName = chosen.isDefault ? (chosen.symbol.getName() === 'default' ? fileBase : chosen.symbol.getName()) : chosen.exportName;

	const props = (resolved.type ? checker.getPropertiesOfType(resolved.type) : [])
		.filter((symbol) => {
			// Drop props inherited from React/Radix typings — they bury the component's own API.
			const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
			return !declaration || !declaration.getSourceFile().fileName.includes('node_modules');
		})
		.map((symbol) => describeProp(symbol, resolved.type?.symbol?.declarations?.[0] ?? sourceFile, checker));

	return {
		filePath: absolute,
		componentName: isComponentName(localName) ? localName : fileBase,
		isDefaultExport: chosen.isDefault,
		exportName: chosen.exportName,
		props,
		defaults: destructuredDefaults(resolved.paramDeclaration),
	};
}
