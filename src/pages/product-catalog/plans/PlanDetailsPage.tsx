// React imports
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router';

// Third-party libraries
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, EyeOff, EllipsisVertical, Pencil, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Internal components
import { Button, CopyIdButton, Loader, Page } from '@/components/atoms';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import type { DropdownMenuOption } from '@/components/molecules';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

// API imports
import { PlanApi, WorkflowApi } from '@/api';

// Core services and routes
import { RouteNames } from '@/core/routes/Routes';

// Models and types
import { Plan, ENTITY_STATUS } from '@/models';

// Constants and utilities
import { getPlanPriceSyncWorkflowFilters } from '@/constants/workflow';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { DataType, FilterOperator, SortDirection } from '@/types/common/QueryBuilder';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const TAB_IDS = ['', 'entitlements', 'credit-grants', 'information'] as const;
type TabId = (typeof TAB_IDS)[number];

const getActiveTab = (pathTabId: string): TabId => {
	return TAB_IDS.includes(pathTabId as TabId) ? (pathTabId as TabId) : '';
};

const getTabLabel = (tabId: TabId, t: TFunction): string => {
	const labels: Record<TabId, string> = {
		'': t('catalog:plans.tabs.overview'),
		entitlements: t('catalog:plans.tabs.entitlements'),
		'credit-grants': t('catalog:plans.tabs.creditGrants'),
		information: t('catalog:plans.tabs.information'),
	};
	return labels[tabId];
};

type Params = {
	planId: string;
};

const PlanDetailsPage = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const location = useLocation();
	const { planId } = useParams<Params>();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<TabId>(TAB_IDS[0]);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			const response = await PlanApi.getPlansByFilter({
				filters: [{ field: 'id', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: planId } }],
				limit: 1,
				offset: 0,
				sort: [],
			});
			return response.items[0] ?? null;
		},
		enabled: !!planId,
	});

	const { data: syncWorkflowsData } = useQuery({
		queryKey: ['planSyncWorkflows', planId],
		queryFn: async () =>
			WorkflowApi.search({
				filters: getPlanPriceSyncWorkflowFilters(planId!),
				sort: [{ field: 'start_time', direction: SortDirection.DESC }],
				limit: 1,
				offset: 0,
			}),
		enabled: !!planId,
		refetchInterval: (query) => {
			const data = query.state.data as { items?: { status?: string; entity_id?: string }[] } | undefined;
			const items = data?.items ?? [];
			const latest = items[0];
			return latest?.status === 'Running' ? 60000 : false;
		},
	});

	// Latest run by timestamp (first item when sorted by start_time desc); scope to this plan when entity_id is set
	const planRuns = useMemo(
		() => syncWorkflowsData?.items?.filter((w) => !w.entity_id || w.entity_id === planId) ?? [],
		[syncWorkflowsData?.items, planId],
	);
	const latestRun = planRuns[0];
	const isSyncRunning = latestRun?.status === 'Running';

	const { mutate: archivePlan } = useMutation({
		mutationFn: async () => {
			return await PlanApi.deletePlan(planId!);
		},
		onSuccess: () => {
			toast.success(t('catalog:plans.listPage.toast.archiveSuccess'));
			navigate(RouteNames.plan);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('catalog:plans.listPage.toast.archiveErrorFallback'));
		},
	});

	const { mutate: syncPlan, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(planId!),
		onSuccess: () => {
			toast.success(t('catalog:plans.sync.startedToast'));
			void queryClient.invalidateQueries({ queryKey: ['planSyncWorkflows', planId] });
		},
		onError: (error: Error) => {
			toast.error(error.message || t('catalog:plans.sync.errorToast'));
		},
	});

	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();

	const dropdownOptions: DropdownMenuOption[] = useMemo(
		() => [
			{
				label: t('catalog:plans.listPage.rowActions.edit'),
				icon: <Pencil />,
				onSelect: () => setPlanDrawerOpen(true),
			},
			{
				label: t('catalog:plans.listPage.rowActions.duplicate'),
				icon: <Copy />,
				onSelect: () => setDuplicateDialogOpen(true),
			},
			{
				label: t('catalog:plans.listPage.rowActions.archive'),
				icon: <EyeOff />,
				onSelect: () => archivePlan(),
				disabled: planData?.status !== ENTITY_STATUS.PUBLISHED,
			},
		],
		[archivePlan, planData?.status, t],
	);

	// Handle tab changes based on URL
	useEffect(() => {
		const currentPath = location.pathname.split('/');
		// Path structure: /product-catalog/plan/:planId/:tabId
		// So index 4 would be the tabId (or empty for overview)
		const pathTabId = currentPath[4] || '';
		const newActiveTab = getActiveTab(pathTabId);
		setActiveTab(newActiveTab);
	}, [location.pathname]);

	// Update breadcrumbs based on active tab
	useEffect(() => {
		if (activeTab !== '') {
			setSegmentLoading(3, true);
		}

		const activeTabData = activeTab;
		setSegmentLoading(2, true);

		if (activeTab !== '') {
			updateBreadcrumb(3, getTabLabel(activeTabData, t));
		}
		if (planData?.name) {
			updateBreadcrumb(2, planData.name);
		}
	}, [activeTab, updateBreadcrumb, setSegmentLoading, planData, t]);

	const onTabChange = (tabId: TabId) => {
		if (tabId === '') {
			navigate(`${RouteNames.plan}/${planId}`);
		} else {
			navigate(`${RouteNames.plan}/${planId}/${tabId}`);
		}
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('catalog:plans.sync.loadError'));
		return null;
	}

	if (!planData) {
		toast.error(t('catalog:plans.sync.noDataError'));
		return null;
	}

	return (
		<Page
			documentTitle={planData.name}
			heading={
				<div className='flex items-center gap-2'>
					<span>{planData.name}</span>
					{planData.id && <CopyIdButton id={planData.id} entityType='Plan' />}
				</div>
			}
			headingCTA={
				<div className='flex items-center gap-2'>
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className='inline-block'>
									<Button
										onClick={() => syncPlan()}
										disabled={isSyncing || isSyncRunning}
										isLoading={isSyncing}
										variant='outline'
										className='flex gap-2'>
										<RefreshCw />
										{t('catalog:plans.sync.usageCharges')}
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{isSyncing ? (
									<span className='text-sm'>{t('catalog:plans.sync.syncing')}</span>
								) : isSyncRunning ? (
									<span className='text-sm'>
										{t('catalog:plans.sync.inProgressPrefix')}{' '}
										<button
											onClick={() => navigate(`${RouteNames.workflows}?entity_id=${planId}`)}
											className='text-blue-600 hover:text-blue-800 underline'>
											{t('catalog:plans.sync.workflows')}
										</button>
										.
									</span>
								) : latestRun?.status === 'Completed' ? (
									<span className='text-sm'>{t('catalog:plans.sync.completed')}</span>
								) : latestRun?.status === 'Failed' ? (
									<span className='text-sm'>{t('catalog:plans.sync.failed')}</span>
								) : (
									<span className='text-sm'>{t('catalog:plans.sync.tooltip')}</span>
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<DropdownMenu options={dropdownOptions} trigger={<Button variant='outline' prefixIcon={<EllipsisVertical />} size='icon' />} />
				</div>
			}>
			<PlanDrawer data={planData as Plan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlan']} />
			<DuplicatePlanDialog
				planId={planId!}
				plan={planData}
				open={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				refetchQueryKeys={['fetchPlan', 'planEntitlements']}
			/>

			<ApiDocsContent tags={API_DOCS_TAGS.Plans} />

			<div className='border-b border-border mt-4 mb-6'>
				<nav className='flex space-x-4' aria-label={t('common:labels.tabs')}>
					{TAB_IDS.map((tabId, index) => {
						return (
							<button
								key={tabId}
								onClick={() => onTabChange(tabId)}
								className={cn(
									'px-4 py-2 text-sm font-normal transition-colors focus-visible:outline-none',
									index === 0 && 'px-0',
									activeTab === tabId ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
								)}
								role='tab'
								aria-selected={activeTab === tabId}>
								{getTabLabel(tabId, t)}
							</button>
						);
					})}
				</nav>
			</div>
			<Outlet />
		</Page>
	);
};

export default PlanDetailsPage;
