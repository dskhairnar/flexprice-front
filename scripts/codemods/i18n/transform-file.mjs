import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import {
	I18N_JSX_ATTRIBUTES,
	I18N_TEXT_PARENT_TAGS,
} from './config.mjs';
import {
	attributeToKeySuffix,
	detectTranslationBinding,
	fullKey,
	inferKeyPrefixFromFile,
	inferNamespaceFromPath,
	jsxTextToKeySuffix,
	loadLocaleJson,
	saveLocaleJson,
	setNestedValue,
	shouldSkipString,
} from './utils.mjs';

function getJsxAttributeName(attr) {
	const nameNode = attr.getNameNode();
	return nameNode.getText();
}

function getStringLiteralValue(initializer) {
	if (!initializer) return null;
	if (initializer.getKind() === SyntaxKind.StringLiteral) {
		return initializer.getLiteralValue();
	}
	if (initializer.getKind() === SyntaxKind.JsxExpression) {
		const expr = initializer.getExpression();
		if (expr?.getKind() === SyntaxKind.StringLiteral) {
			return expr.getLiteralValue();
		}
	}
	return null;
}

function isInsideCodeElement(node) {
	let current = node.getParent();
	while (current) {
		if (current.getKind() === SyntaxKind.JsxElement) {
			const tag = current.getOpeningElement().getTagNameNode().getText();
			if (tag === 'code' || tag === 'Trans') return true;
		}
		current = current.getParent();
	}
	return false;
}

/**
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.localeDir
 * @param {boolean} options.write
 * @param {string} [options.keyPrefix]
 * @param {string} [options.namespace]
 */
export function transformFile({ filePath, localeDir, write, keyPrefix: keyPrefixOverride, namespace: namespaceOverride }) {
	const project = new Project({
		skipAddingFilesFromTsConfig: true,
	});
	const sourceFile = project.addSourceFileAtPath(filePath);
	const binding = detectTranslationBinding(sourceFile);

	if (!binding.hasHook) {
		return {
			filePath,
			skipped: true,
			reason: 'No useTranslation() hook — add hook manually, then re-run codemod',
			changes: [],
		};
	}

	const namespace = namespaceOverride ?? binding.namespace ?? inferNamespaceFromPath(filePath);
	const tId = binding.identifier;
	const keyPrefix = keyPrefixOverride ?? inferKeyPrefixFromFile(filePath);
	const usedKeys = new Set();
	const changes = [];
	const pendingEdits = [];

	const { filePath: localePath, data: localeData } = loadLocaleJson(localeDir, namespace);
	let localeDirty = false;

	const registerChange = (key, defaultValue, editFn) => {
		const added = setNestedValue(localeData, key, defaultValue);
		if (added) localeDirty = true;
		changes.push({ key, value: defaultValue });
		pendingEdits.push(editFn);
	};

	function getJsxAttributeContainer(node) {
		if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
			return node;
		}
		return undefined;
	}

	function getSiblingLabelText(jsxAttribute) {
		let node = jsxAttribute.getParent();
		while (node) {
			const container = getJsxAttributeContainer(node);
			if (container) {
				const labelAttr = container
					.getAttributes()
					.find((a) => a.getKind() === SyntaxKind.JsxAttribute && getJsxAttributeName(a) === 'label');
				if (!labelAttr) return null;
				return getStringLiteralValue(labelAttr.getInitializer());
			}
			node = node.getParent();
		}
		return null;
	}

	// JSX attributes: placeholder="..." → placeholder={t('...')}
	for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
		const attrName = getJsxAttributeName(attr);
		if (!I18N_JSX_ATTRIBUTES.includes(attrName)) continue;

		const initializer = attr.getInitializer();
		const value = getStringLiteralValue(initializer);
		if (value === null || shouldSkipString(value)) continue;

		const siblingLabel = getSiblingLabelText(attr);
		const suffix =
			siblingLabel && (attrName === 'placeholder' || attrName === 'description')
				? `${attributeToKeySuffix('label', siblingLabel)}${attrName === 'placeholder' ? 'Placeholder' : 'Hint'}`
				: attributeToKeySuffix(attrName, value);
		const key = fullKey(keyPrefix, suffix, usedKeys);

		registerChange(key, value, () => {
			attr.setInitializer(`{${tId}('${key}')}`);
		});
	}

	// JSX text: <p>Hello</p> → <p>{t('...')}</p> (skip mixed content / code)
	for (const jsxText of sourceFile.getDescendantsOfKind(SyntaxKind.JsxText)) {
		const text = jsxText.getText().trim();
		if (!text || shouldSkipString(text) || isInsideCodeElement(jsxText)) continue;

		const parent = jsxText.getParent();
		if (parent?.getKind() !== SyntaxKind.JsxElement) continue;
		const opening = parent.getOpeningElement();
		const tag = opening.getTagNameNode().getText();
		if (!I18N_TEXT_PARENT_TAGS.has(tag)) continue;

		// Skip if siblings include other JSX (mixed content — needs manual Trans)
		const children = parent.getJsxChildren();
		const nonWhitespace = children.filter((c) => {
			if (c.getKind() === SyntaxKind.JsxText) return c.getText().trim().length > 0;
			return true;
		});
		if (nonWhitespace.length !== 1) continue;

		const suffix = jsxTextToKeySuffix(text);
		const key = fullKey(keyPrefix, suffix, usedKeys);

		registerChange(key, text, () => {
			jsxText.replaceWithText(`{${tId}('${key}')}`);
		});
	}

	if (changes.length === 0) {
		return { filePath, skipped: false, changes: [] };
	}

	if (write) {
		for (const edit of pendingEdits) edit();
		sourceFile.saveSync();
		if (localeDirty) saveLocaleJson(localePath, localeData);
	}

	return {
		filePath,
		skipped: false,
		namespace,
		keyPrefix,
		translationId: tId,
		changes,
		localePath: localeDirty ? localePath : null,
	};
}
