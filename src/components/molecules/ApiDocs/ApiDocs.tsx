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
import { useDocumentationConfig } from '@/hooks/useDocumentationConfig';

const ApiDocs: FC = () => {
	const { t } = useTranslation('common');
	const { apiReferenceEnabled } = useDocumentationConfig();
	const [isDocsOpen, setIsDocsOpen] = useState(false);
	const { snippets } = useApiDocsStore();

	if (!apiReferenceEnabled) {
		return null;
	}

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

interface ApiDocsContentProps {
	tags?: string[];
	snippets?: ApiDocsSnippet[];
}

export const fetchApidocsJson = async (): Promise<any> => {
	const { data } = await axios.get('https://raw.githubusercontent.com/flexprice/flexprice-docs/main/api-reference/openapi.json');
	return data;
};

export const ApiDocsContent = ({ tags, snippets: snippetsProp }: ApiDocsContentProps) => {
	const { apiReferenceEnabled } = useDocumentationConfig();
	const { setPageDocs, clearPageDocs } = useDocs();
	const [snippets, setSnippets] = useState<ApiDocsSnippet[]>(snippetsProp || []);

	const { data: docs } = useQuery({
		queryKey: ['openapi-json'],
		queryFn: fetchApidocsJson,
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		enabled: apiReferenceEnabled && !snippetsProp && !!tags,
	});

	useEffect(() => {
		if (!apiReferenceEnabled) return;

		const fetchSnippets = async (tags: string[]) => {
			if (!snippetsProp && tags && docs) {
				const fetchedSnippets = await fetchAndExtractSnippetsByTags(tags, docs);
				setSnippets(fetchedSnippets);
			}
		};

		if (tags && !snippetsProp) {
			fetchSnippets(tags);
		}
	}, [apiReferenceEnabled, tags, docs, snippetsProp]);

	useEffect(() => {
		if (!apiReferenceEnabled) return;

		setPageDocs(snippets);
		return () => clearPageDocs();
	}, [apiReferenceEnabled, snippets, setPageDocs, clearPageDocs]);

	return null;
};

export default ApiDocs;
