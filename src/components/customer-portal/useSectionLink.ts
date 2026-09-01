import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { usePortalConfig } from '@/context/PortalConfigContext';
import type { TabType } from '@/types/dto/PortalConfig';
import type { EmptyStateAction } from '@/components/atoms/EmptyState/EmptyState';

/** Query parameter naming the open section — must match CustomerPortal's SECTION_PARAM. */
const SECTION_PARAM = 'section';

/**
 * An empty state's "what to do next", pointing at the section that holds `tabType`.
 *
 * Returns undefined — and so renders no action at all — when that tab is not
 * configured, or when it lives in the section the reader is already looking at.
 * An empty state is supposed to tell someone where to go; a link back to the page
 * they are on, or one that goes nowhere, is worse than no link.
 */
const useSectionLink = (tabType: TabType, label: string): EmptyStateAction | undefined => {
	const { config } = usePortalConfig();
	const [searchParams, setSearchParams] = useSearchParams();

	const target = config.sections.find((section) => section.enabled && section.tabs.some((tab) => tab.enabled && tab.type === tabType));

	const go = useCallback(() => {
		if (!target) return;
		const next = new URLSearchParams(searchParams);
		next.set(SECTION_PARAM, target.id);
		setSearchParams(next, { replace: true });
	}, [target, searchParams, setSearchParams]);

	if (!target || target.id === searchParams.get(SECTION_PARAM)) return undefined;
	return { label, onClick: go };
};

export default useSectionLink;
