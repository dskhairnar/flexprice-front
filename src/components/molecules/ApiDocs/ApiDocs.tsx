import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocsDrawer from '../DocsDrawer/DocsDrawer';
import { useApiDocsStore, ApiDocsSnippet } from '@/store/useApiDocsStore';
import { useDocs } from '@/context/DocsContext';
import { Button } from '@/components/atoms';
import { Code2 } from 'lucide-react';
import { fetchAndExtractSnippetsByTags } from './fetch_api_docs';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { config } from '@/config/config';

const ApiDocsDrawer: FC = () => {
	const { t } = useTranslation('common');
	const [isDocsOpen, setIsDocsOpen] = useState(false);
	const { snippets } = useApiDocsStore();

	return (
		<DocsDrawer
			isOpen={isDocsOpen}
			onOpenChange={setIsDocsOpen}
			snippets={snippets}
			trigger={
				<Button variant='outline' className='outline-none text-sm flex items-center gap-2' size='sm'>
					<Code2 className='w-4 h-4' />
					{t('labels.apiDocs')}
				</Button>
			}
		/>
	);
};

const ApiDocs: FC = () => {
	if (!config.platform.api_reference.enabled) {
		return null;
	}

	return <ApiDocsDrawer />;
};

interface ApiDocsContentProps {
	tags?: string[];
	snippets?: ApiDocsSnippet[];
}

export const fetchApidocsJson = async (): Promise<any> => {
	const { data } = await axios.get('https://raw.githubusercontent.com/flexprice/flexprice-docs/main/api-reference/openapi.json');
	return data;
};

const ApiDocsContentActive = ({ tags, snippets: snippetsProp }: ApiDocsContentProps) => {
	const { setPageDocs, clearPageDocs } = useDocs();
	const [snippets, setSnippets] = useState<ApiDocsSnippet[]>(snippetsProp || []);

	const { data: docs } = useQuery({
		queryKey: ['openapi-json'],
		queryFn: fetchApidocsJson,
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		enabled: !snippetsProp && !!tags,
	});

	useEffect(() => {
		const fetchSnippets = async (tagList: string[]) => {
			if (!snippetsProp && tagList && docs) {
				const fetchedSnippets = await fetchAndExtractSnippetsByTags(tagList, docs);
				setSnippets(fetchedSnippets);
			}
		};

		if (tags && !snippetsProp) {
			fetchSnippets(tags);
		}
	}, [tags, docs, snippetsProp]);

	useEffect(() => {
		setPageDocs(snippets);
		return () => clearPageDocs();
	}, [snippets, setPageDocs, clearPageDocs]);

	return null;
};

/** Registers page API snippets for the breadcrumb drawer; no-op when api reference is disabled in config. */
export const ApiDocsContent = ({ tags, snippets: snippetsProp }: ApiDocsContentProps) => {
	if (!config.platform.api_reference.enabled) {
		return null;
	}

	return <ApiDocsContentActive tags={tags} snippets={snippetsProp} />;
};

export default ApiDocs;
