import i18n from 'i18next';

/** Maps app language codes to BCP 47 tags for Intl date/number formatting. */
const INTL_LOCALE_BY_LANG: Record<string, string> = {
	en: 'en-US',
	ar: 'ar',
	he: 'he-IL',
	fa: 'fa-IR',
	ur: 'ur-PK',
};

/** Active UI locale for Intl (follows i18n.language / locale store). */
export function getIntlLocale(language: string = i18n.language ?? 'en'): string {
	const normalized = language.trim().toLowerCase();
	if (INTL_LOCALE_BY_LANG[normalized]) return INTL_LOCALE_BY_LANG[normalized];
	const base = normalized.split('-')[0];
	return INTL_LOCALE_BY_LANG[base] ?? 'en-US';
}
