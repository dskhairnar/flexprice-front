/** Mirrors eslint.config.js `i18next/no-literal-string` jsx-only targets. */
export const I18N_JSX_ATTRIBUTES = [
	'placeholder',
	'title',
	'aria-label',
	'aria-placeholder',
	'aria-roledescription',
	'aria-valuetext',
	'alt',
	'label',
	'description',
];

/** Path segments → i18n namespace (first match wins). */
export const NAMESPACE_BY_PATH = [
	['customer-portal', 'customer-portal'],
	['pages/auth', 'auth'],
	['pages/developer', 'developers'],
	['pages/product-catalog', 'catalog'],
	['pages/settings', 'settings'],
	['pages/onboarding', 'common'],
	['pages/checkout', 'billing'],
	['pages/customer', 'customers'],
	['components/customer-portal', 'customer-portal'],
];

export const DEFAULT_NAMESPACE = 'common';

/** Skip strings that ESLint excludes (technical tokens, URLs, hex colors). */
export const EXCLUDED_STRING_PATTERNS = [
	/^.$/,
	/^\s*$/,
	/^https?:\/\//,
	/^#[a-fA-F0-9]{3,8}$/,
];

/** JSX text in these tags is a candidate for extraction (user-visible copy). */
export const I18N_TEXT_PARENT_TAGS = new Set([
	'p',
	'span',
	'label',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'th',
	'td',
	'Button',
	'TableHead',
]);
