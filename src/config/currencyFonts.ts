import { SAUDI_RIYAL_FONT_URL, withSaudiRiyalFontFamily } from '@/constants/currencyDefaults';

const PRELOAD_ID = 'saudi-riyal-font-preload';

function preloadSaudiRiyalFont(): void {
	if (typeof document === 'undefined' || document.getElementById(PRELOAD_ID)) return;

	const link = document.createElement('link');
	link.id = PRELOAD_ID;
	link.rel = 'preload';
	link.as = 'font';
	link.type = 'font/woff2';
	link.crossOrigin = 'anonymous';
	link.href = SAUDI_RIYAL_FONT_URL;
	document.head.appendChild(link);
}

async function loadSaudiRiyalFontFace(): Promise<void> {
	if (typeof document === 'undefined' || !('fonts' in document)) return;

	try {
		const font = new FontFace('Saudi Riyal Sign', `url(${SAUDI_RIYAL_FONT_URL})`, {
			unicodeRange: 'U+20C1',
			display: 'swap',
		});
		await font.load();
		document.fonts.add(font);
	} catch {
		// CSS @font-face remains as fallback when the Font Loading API fails
	}
}

function applySaudiRiyalFontStack(): void {
	if (typeof document === 'undefined') return;

	const current = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
	document.documentElement.style.setProperty('--font-sans', withSaudiRiyalFontFamily(current));
}

/**
 * Ensures the Saudi Riyal font is loaded and in `--font-sans` at runtime (does not edit index.css defaults).
 * Call after `initTypography()` so branded font stacks also get the SAR glyph fallback.
 */
export async function initCurrencyFonts(): Promise<void> {
	if (typeof document === 'undefined') return;

	preloadSaudiRiyalFont();
	applySaudiRiyalFontStack();
	await loadSaudiRiyalFontFace();
}
