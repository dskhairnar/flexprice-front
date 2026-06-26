import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { brandTranslationOptions } from '@/config/branding';
import { integrationCatalogSpecs, type Integration, type IntegrationCatalogSpec } from './integrationsData';

const CATALOG = 'insightsTools.integrations.catalog';

type SectionBlock = { title: string; paragraphs: string[] };

function localizeBrandText(text: string, brandName: string): string {
	return text.replace(/\{\{brandName\}\}/g, brandName);
}

function mapSpecToIntegration(
	t: (key: string, options?: { returnObjects?: boolean; brandName?: string }) => unknown,
	spec: IntegrationCatalogSpec,
	brandName: string,
): Integration {
	const base = `${CATALOG}.${spec.id}`;
	const brandOpts = { brandName };
	const name = String(t(`${base}.name`, brandOpts));
	const description = localizeBrandText(String(t(`${base}.description`, brandOpts)), brandName);

	const tags = spec.tagKeys.map((k) => String(t(`${CATALOG}.tags.${k}`, brandOpts)));

	let info: Integration['info'];
	if (spec.sectionKeys?.length) {
		info = spec.sectionKeys.map((sectionKey) => {
			const sectionPath = `${base}.sections.${sectionKey}`;
			const block = t(sectionPath, { returnObjects: true, ...brandOpts }) as SectionBlock;
			return {
				title: localizeBrandText(String(block?.title ?? ''), brandName),
				description: Array.isArray(block?.paragraphs) ? block.paragraphs.map((p) => localizeBrandText(String(p), brandName)) : [],
			};
		});
	}

	return {
		id: spec.id,
		name,
		description,
		logo: spec.logo,
		tags,
		tagKeys: [...spec.tagKeys],
		websiteUrl: spec.websiteUrl,
		docsUrl: spec.docsUrl,
		premium: spec.premium,
		type: spec.type,
		accountId: spec.accountId,
		mode: spec.modeKey ? String(t(`${CATALOG}.mode.${spec.modeKey}`, brandOpts)) : undefined,
		apiKey: spec.apiKey,
		installedAt: spec.installedAt,
		info,
	};
}

export function useIntegrationsCatalog(): Integration[] {
	const { t } = useTranslation('settings');
	const { brandName } = brandTranslationOptions();
	return useMemo(() => integrationCatalogSpecs.map((spec) => mapSpecToIntegration(t, spec, brandName)), [t, brandName]);
}
