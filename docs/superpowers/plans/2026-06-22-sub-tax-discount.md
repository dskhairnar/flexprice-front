# Subscription Tax & Discount Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add coupon_code to coupons, expose coupon/tax association tables on subscription detail and edit pages, and wire up preview+execute dialogs for adding/removing coupons and taxes mid-cycle.

**Architecture:** Data flows in three layers — (1) models/DTOs updated to match new backend fields, (2) reusable table components with optional edit-mode callbacks, (3) page-level composition that wires dialogs to the modify API. All four dialogs follow the same two-step preview→execute pattern to prevent accidental billing changes.

**Tech Stack:** React 18, TypeScript, TanStack Query (`useQuery`/`useMutation`), Tailwind CSS, Radix UI via existing atom components (`Button`, `Input`, `Sheet`, `Select`, `DatePicker`, `Chip`), Vitest + Testing Library, `react-hot-toast`.

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/models/Coupon.ts` |
| **Create** | `src/models/CouponAssociation.ts` |
| Modify | `src/models/Subscription.ts` |
| Modify | `src/models/index.ts` |
| Modify | `src/types/dto/Coupon.ts` |
| **Create** | `src/types/dto/CouponAssociation.ts` |
| Modify | `src/types/dto/Subscription.ts` |
| Modify | `src/types/dto/index.ts` |
| Modify | `src/api/CouponApi.ts` |
| Modify | `src/components/molecules/CouponDrawer/CouponDrawer.tsx` |
| **Create** | `src/components/molecules/CouponDrawer/CouponDrawer.test.tsx` |
| Modify | `src/pages/product-catalog/coupons/CouponDetails.tsx` |
| **Create** | `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx` |
| **Create** | `src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx` |
| Modify | `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx` |
| Modify | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx` |
| **Create** | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx` |
| **Create** | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx` |
| **Create** | `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx` |
| **Create** | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx` |
| **Create** | `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx` |
| Modify | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx` |
| Modify | `src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx` |
| Modify | `src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx` |

---

## Task 1: Data Models

**Files:**
- Modify: `src/models/Coupon.ts`
- Create: `src/models/CouponAssociation.ts`
- Modify: `src/models/Subscription.ts`
- Modify: `src/models/index.ts`

- [ ] **Step 1: Add `coupon_code` to Coupon model**

In `src/models/Coupon.ts`, add the field after `currency`:

```typescript
import { BaseModel, Metadata } from './base';
import { COUPON_TYPE, COUPON_CADENCE, CouponRules } from '@/types/common/Coupon';

export interface Coupon extends BaseModel {
	name: string;
	redeem_after?: string;
	redeem_before?: string;
	max_redemptions?: number;
	total_redemptions: number;
	rules?: CouponRules;
	amount_off?: string;
	percentage_off?: string;
	type: COUPON_TYPE;
	cadence: COUPON_CADENCE;
	duration_in_periods?: number;
	currency: string;
	coupon_code?: string;
	metadata?: Metadata;
}
```

- [ ] **Step 2: Create CouponAssociation model**

Create `src/models/CouponAssociation.ts`:

```typescript
import { BaseModel } from './base';
import { Coupon } from './Coupon';

export interface CouponAssociation extends BaseModel {
	coupon_id: string;
	subscription_id: string;
	subscription_line_item_id?: string;
	subscription_phase_id?: string;
	start_date: string;
	end_date?: string;
	coupon?: Coupon;
}
```

- [ ] **Step 3: Add COUPON and TAX to SUBSCRIPTION_MODIFY_TYPE enum**

In `src/models/Subscription.ts`, find `SUBSCRIPTION_MODIFY_TYPE` (currently at line ~216) and add two values:

```typescript
export enum SUBSCRIPTION_MODIFY_TYPE {
	INHERITANCE = 'inheritance',
	QUANTITY_CHANGE = 'quantity_change',
	GROUPED_INVOICING = 'grouped_invoicing',
	COUPON = 'coupon',
	TAX = 'tax',
}
```

Then add two new enums directly below `GROUPED_INVOICING_MODIFY_ACTION`:

```typescript
export enum SUB_MODIFY_COUPON_ACTION {
	ADD = 'add',
	REMOVE = 'remove',
}

export enum SUB_MODIFY_TAX_ACTION {
	ADD = 'add',
	REMOVE = 'remove',
}
```

- [ ] **Step 4: Export CouponAssociation from models index**

In `src/models/index.ts`, find the line that exports `Coupon` (around line 19-20) and add:

```typescript
export type { CouponAssociation } from './CouponAssociation';
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors related to the new fields.

- [ ] **Step 6: Commit**

```bash
git add src/models/Coupon.ts src/models/CouponAssociation.ts src/models/Subscription.ts src/models/index.ts
git commit -m "feat: add coupon_code to Coupon model, new CouponAssociation model, extend modify type enums"
```

---

## Task 2: DTO Types

**Files:**
- Modify: `src/types/dto/Coupon.ts`
- Create: `src/types/dto/CouponAssociation.ts`
- Modify: `src/types/dto/Subscription.ts`
- Modify: `src/types/dto/index.ts`

- [ ] **Step 1: Add `coupon_code` to CreateCouponRequest**

In `src/types/dto/Coupon.ts`, add `coupon_code?: string` to `CreateCouponRequest`. `UpdateCouponRequest` is unchanged (backend only accepts `name` + `metadata`):

```typescript
export interface CreateCouponRequest {
	name: string;
	coupon_code?: string;
	redeem_after?: string;
	redeem_before?: string;
	max_redemptions?: number;
	rules?: CouponRules;
	amount_off?: string;
	percentage_off?: string;
	type: COUPON_TYPE;
	cadence: COUPON_CADENCE;
	duration_in_periods?: number;
	metadata?: Metadata;
	currency?: string;
}
```

- [ ] **Step 2: Create CouponAssociation DTO file**

Create `src/types/dto/CouponAssociation.ts`:

```typescript
import { CouponAssociation } from '@/models/CouponAssociation';
import { Pagination } from '@/models';
import { QueryFilter } from './base';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';

export interface CouponAssociationFilter extends Omit<QueryFilter, 'sort'> {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	subscription_ids?: string[];
	coupon_ids?: string[];
	subscription_line_item_ids?: string[];
	subscription_phase_ids?: string[];
	active_only?: boolean;
	period_start?: string;
	period_end?: string;
}

export interface ListCouponAssociationsResponse {
	items: CouponAssociation[];
	pagination: Pagination;
}
```

- [ ] **Step 3: Add new types to Subscription DTO**

In `src/types/dto/Subscription.ts`, add after the existing imports block (around line 67, after the TaxRateOverride import):

```typescript
// New unified coupon input for subscription creation
export interface SubscriptionCouponInput {
	coupon_code: string;
	start_date?: string;
	end_date?: string;
	price_id?: string; // omit for subscription-level; set for line-item-level
}

// Coupon mid-cycle modify params
export interface SubModifyCouponParams {
	action: 'add' | 'remove';
	coupon_code?: string;          // required when action=add
	association_id?: string;       // required when action=remove
	start_date?: string;
	end_date?: string;
	subscription_id?: string;     // mutually exclusive with subscription_line_item_id
	subscription_line_item_id?: string;
}

// Tax mid-cycle modify params
export interface SubModifyTaxParams {
	action: 'add' | 'remove';
	tax_rate_id?: string;          // required when action=add
	association_id?: string;       // required when action=remove
	effective_date?: string;
}
```

In `CreateSubscriptionRequest`, add below the existing `line_item_coupons` field:

```typescript
// Preferred (new): unified coupon input using coupon_code
subscription_coupons?: SubscriptionCouponInput[];
```

In `ExecuteSubscriptionModifyRequest`, add at the end:

```typescript
coupon_params?: SubModifyCouponParams;
tax_params?: SubModifyTaxParams;
```

- [ ] **Step 4: Export new types from dto/index.ts**

In `src/types/dto/index.ts`, find the Coupon export line (around line 241):

```typescript
export type { CreateCouponRequest, UpdateCouponRequest, GetCouponResponse, ListCouponsResponse, CouponFilter } from './Coupon';
```

Add after it:

```typescript
export type { CouponAssociationFilter, ListCouponAssociationsResponse } from './CouponAssociation';
```

Also find the Subscription exports block and add the new types to it:

```typescript
// In the existing Subscription export block, add:
	SubscriptionCouponInput,
	SubModifyCouponParams,
	SubModifyTaxParams,
```

Also export the new enums from models. Find where `SubscriptionModifyType` is re-exported and add:

```typescript
export { SUB_MODIFY_COUPON_ACTION, SUB_MODIFY_TAX_ACTION } from '@/models';
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/dto/Coupon.ts src/types/dto/CouponAssociation.ts src/types/dto/Subscription.ts src/types/dto/index.ts
git commit -m "feat: add coupon_code to CreateCouponRequest, CouponAssociation DTO, SubModifyCouponParams, SubModifyTaxParams"
```

---

## Task 3: API — CouponApi.listCouponAssociations

**Files:**
- Modify: `src/api/CouponApi.ts`

- [ ] **Step 1: Add listCouponAssociations method**

In `src/api/CouponApi.ts`, add the import and new method. Final file:

```typescript
import { AxiosClient } from '@/core/axios/verbs';
import { Coupon, Pagination } from '@/models';
import { CreateCouponRequest, UpdateCouponRequest, ListCouponsResponse, CouponFilter } from '@/types/dto';
import { CouponAssociationFilter, ListCouponAssociationsResponse } from '@/types/dto/CouponAssociation';
import { generateQueryParams } from '@/utils/common/api_helper';

class CouponApi {
	private static baseUrl = '/coupons';

	public static async createCoupon(payload: CreateCouponRequest): Promise<Coupon> {
		return await AxiosClient.post(`${this.baseUrl}`, payload);
	}

	public static async getCouponById(id: string): Promise<Coupon> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}

	public static async updateCoupon(id: string, payload: UpdateCouponRequest): Promise<Coupon> {
		return await AxiosClient.put(`${this.baseUrl}/${id}`, payload);
	}

	public static async deleteCoupon(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}

	public static async getAllCoupons({ limit = 10, offset = 0 }: Pagination): Promise<ListCouponsResponse> {
		const url = generateQueryParams(this.baseUrl, { limit, offset });
		return await AxiosClient.get(url);
	}

	public static async getCouponsByFilters(payload: CouponFilter): Promise<ListCouponsResponse> {
		return await AxiosClient.post(`${this.baseUrl}/search`, payload);
	}

	public static async listCouponAssociations(filter?: CouponAssociationFilter): Promise<ListCouponAssociationsResponse> {
		const url = filter
			? generateQueryParams(`${this.baseUrl}/associations`, filter)
			: `${this.baseUrl}/associations`;
		return await AxiosClient.get<ListCouponAssociationsResponse>(url);
	}
}

export default CouponApi;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/CouponApi.ts
git commit -m "feat: add CouponApi.listCouponAssociations (GET /coupons/associations)"
```

---

## Task 4: CouponDrawer — add coupon_code field

**Files:**
- Modify: `src/components/molecules/CouponDrawer/CouponDrawer.tsx`
- Create: `src/components/molecules/CouponDrawer/CouponDrawer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/CouponDrawer/CouponDrawer.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import CouponDrawer from './CouponDrawer';
import { COUPON_TYPE, COUPON_CADENCE } from '@/types/common/Coupon';

vi.mock('@/api/CouponApi', () => ({ default: { createCoupon: vi.fn(), updateCoupon: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn() }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en', fallbackLng: 'en', ns: ['catalog', 'common'], defaultNS: 'catalog',
		resources: { en: { catalog: {}, common: {} } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

describe('CouponDrawer', () => {
	it('shows coupon_code field in create mode', () => {
		render(<Wrapper><CouponDrawer open={true} /></Wrapper>);
		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
	});

	it('does not show coupon_code field in edit mode', () => {
		const existingCoupon = {
			id: 'cpn_1', name: 'Test', type: COUPON_TYPE.PERCENTAGE, cadence: COUPON_CADENCE.ONCE,
			percentage_off: '10', currency: 'usd', total_redemptions: 0, coupon_code: 'TEST10',
			status: 'active', created_at: '', updated_at: '', created_by: '', updated_by: '',
			tenant_id: '', environment_id: '',
		};
		render(<Wrapper><CouponDrawer open={true} data={existingCoupon} /></Wrapper>);
		expect(screen.queryByLabelText(/coupon code/i)).not.toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/molecules/CouponDrawer/CouponDrawer.test.tsx
```

Expected: FAIL — "coupon code" label not found because the field doesn't exist yet.

- [ ] **Step 3: Add coupon_code field to CouponDrawer**

In `src/components/molecules/CouponDrawer/CouponDrawer.tsx`, make the following changes:

1. Add `coupon_code` to the initial `formData` state (only meaningful for create, but keep the state shape consistent):

```typescript
const [formData, setFormData] = useState<Partial<CreateCouponRequest>>(
	data || {
		name: '',
		coupon_code: '',
		type: COUPON_TYPE.FIXED,
		cadence: COUPON_CADENCE.ONCE,
		currency: 'usd',
	},
);
```

2. Add validation for `coupon_code` in `validateForm()`, inside the function after the `name` check:

```typescript
if (!isEdit && !formData.coupon_code?.trim()) {
	newErrors.coupon_code = 'Coupon code is required';
}
```

3. Add the input field in JSX, immediately after the Name `<Input>` + `<Spacer>` block and before the Type `<Select>`:

```typescript
{!isEdit && (
	<>
		<Spacer height={'20px'} />
		<Input
			label='Coupon Code'
			placeholder='e.g. SUMMER20'
			value={formData.coupon_code}
			error={errors.coupon_code as string | undefined}
			onChange={(e) => setFormData({ ...formData, coupon_code: e })}
			description='Human-readable code used to apply this coupon via API. Cannot be changed after creation.'
		/>
	</>
)}
```

4. Update the Save button `disabled` condition to also require `coupon_code` when creating:

```typescript
disabled={isPending || !formData.name?.trim() || !formData.type || !formData.cadence || (!isEdit && !formData.coupon_code?.trim())}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/components/molecules/CouponDrawer/CouponDrawer.test.tsx
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/molecules/CouponDrawer/CouponDrawer.tsx src/components/molecules/CouponDrawer/CouponDrawer.test.tsx
git commit -m "feat: add required coupon_code field to CouponDrawer (create mode only)"
```

---

## Task 5: CouponDetails — show coupon_code

**Files:**
- Modify: `src/pages/product-catalog/coupons/CouponDetails.tsx`

- [ ] **Step 1: Add coupon_code to the details array**

In `src/pages/product-catalog/coupons/CouponDetails.tsx`, find the `const details: Detail[] = [` block and insert a new entry as the **second item** (after the Type chip, before Discount):

```typescript
{
	label: 'Coupon Code',
	value: coupon.coupon_code
		? <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{coupon.coupon_code}</code>
		: '—',
},
```

The details array should start:
```typescript
const details: Detail[] = [
	{
		label: 'Type',
		value: ( ... ),
	},
	{
		label: 'Coupon Code',
		value: coupon.coupon_code
			? <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{coupon.coupon_code}</code>
			: '—',
	},
	{
		label: 'Discount',
		value: ...,
	},
	// ... rest unchanged
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "CouponDetails" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/product-catalog/coupons/CouponDetails.tsx
git commit -m "feat: show coupon_code in CouponDetails with monospace badge"
```

---

## Task 6: CouponAssociationTable component

**Files:**
- Create: `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx`
- Create: `src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import CouponAssociationTable from './CouponAssociationTable';
import { COUPON_TYPE, COUPON_CADENCE } from '@/types/common/Coupon';

const mockAssociation = {
	id: 'assoc_1',
	coupon_id: 'cpn_1',
	subscription_id: 'sub_1',
	start_date: '2026-01-01T00:00:00Z',
	end_date: undefined,
	status: 'active',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	created_by: '',
	updated_by: '',
	tenant_id: '',
	environment_id: '',
	coupon: {
		id: 'cpn_1', name: 'Summer Sale', coupon_code: 'SUMMER20',
		type: COUPON_TYPE.PERCENTAGE, cadence: COUPON_CADENCE.ONCE,
		percentage_off: '20', currency: 'usd', total_redemptions: 0,
		status: 'active', created_at: '', updated_at: '', created_by: '',
		updated_by: '', tenant_id: '', environment_id: '',
	},
};

vi.mock('@/api/CouponApi', () => ({
	default: {
		listCouponAssociations: vi.fn().mockResolvedValue({
			items: [mockAssociation],
			pagination: { limit: 10, offset: 0, total: 1 },
		}),
	},
}));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en', fallbackLng: 'en', ns: ['common'], defaultNS: 'common',
		resources: { en: { common: {} } }, interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient()}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

describe('CouponAssociationTable', () => {
	it('renders coupon name and code from loaded associations', async () => {
		render(<Wrapper><CouponAssociationTable subscriptionId='sub_1' /></Wrapper>);
		expect(await screen.findByText('Summer Sale')).toBeInTheDocument();
		expect(await screen.findByText('SUMMER20')).toBeInTheDocument();
	});

	it('shows Forever when end_date is absent', async () => {
		render(<Wrapper><CouponAssociationTable subscriptionId='sub_1' /></Wrapper>);
		expect(await screen.findByText('Forever')).toBeInTheDocument();
	});

	it('does not render Remove buttons when onRemove is not provided', async () => {
		render(<Wrapper><CouponAssociationTable subscriptionId='sub_1' /></Wrapper>);
		await screen.findByText('Summer Sale');
		expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
	});

	it('renders Remove button per row when onRemove is provided', async () => {
		const onRemove = vi.fn();
		render(<Wrapper><CouponAssociationTable subscriptionId='sub_1' onRemove={onRemove} /></Wrapper>);
		expect(await screen.findByRole('button', { name: /remove/i })).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create CouponAssociationTable component**

Create `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx`:

```typescript
import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import CouponApi from '@/api/CouponApi';
import FlexpriceTable, { ColumnData } from '../Table';
import { Chip, Button } from '@/components/atoms';
import { formatDateShort } from '@/utils/common/helper_functions';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { RouteNames } from '@/core/routes/Routes';
import { CouponAssociation } from '@/models/CouponAssociation';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { TrashIcon } from 'lucide-react';

interface Props {
	subscriptionId: string;
	onRemove?: (association: CouponAssociation) => void;
}

const formatDiscount = (association: CouponAssociation): string => {
	const c = association.coupon;
	if (!c) return '—';
	if (c.type === COUPON_TYPE.PERCENTAGE) return `${c.percentage_off ?? 0}%`;
	return `${getCurrencySymbol(c.currency)}${c.amount_off ?? '0.00'}`;
};

const isExpired = (endDate?: string): boolean => {
	if (!endDate) return false;
	return new Date(endDate) < new Date();
};

const CouponAssociationTable: FC<Props> = ({ subscriptionId, onRemove }) => {
	const { data, isLoading } = useQuery({
		queryKey: ['couponAssociations', subscriptionId],
		queryFn: () => CouponApi.listCouponAssociations({ subscription_ids: [subscriptionId], active_only: false }),
		enabled: !!subscriptionId,
	});

	const columns: ColumnData<CouponAssociation>[] = [
		{
			title: 'Coupon Name',
			render: (row) =>
				row.coupon ? (
					<Link to={`${RouteNames.coupons}/${row.coupon_id}`} className='text-primary hover:underline'>
						{row.coupon.name}
					</Link>
				) : (
					row.coupon_id
				),
		},
		{
			title: 'Coupon Code',
			render: (row) =>
				row.coupon?.coupon_code ? (
					<code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{row.coupon.coupon_code}</code>
				) : (
					'—'
				),
		},
		{
			title: 'Discount',
			render: (row) => formatDiscount(row),
		},
		{
			title: 'Scope',
			render: (row) =>
				row.subscription_line_item_id ? (
					<Chip variant='info' label='Line Item' />
				) : (
					<Chip variant='default' label='Subscription' />
				),
		},
		{
			title: 'Start Date',
			render: (row) => formatDateShort(row.start_date),
		},
		{
			title: 'End Date',
			render: (row) => (row.end_date ? formatDateShort(row.end_date) : 'Forever'),
		},
		{
			title: 'Status',
			render: (row) =>
				isExpired(row.end_date) ? (
					<Chip variant='default' label='Expired' />
				) : (
					<Chip variant='success' label='Active' />
				),
		},
		...(onRemove
			? [
					{
						fieldVariant: 'interactive' as const,
						render: (row: CouponAssociation) => (
							<Button
								variant='ghost'
								size='sm'
								aria-label='Remove'
								onClick={() => onRemove(row)}
							>
								<TrashIcon className='h-4 w-4 text-destructive' />
							</Button>
						),
					},
				]
			: []),
	];

	return (
		<FlexpriceTable
			showEmptyRow={true}
			columns={columns}
			data={data?.items ?? []}
			isLoading={isLoading}
		/>
	);
};

export default CouponAssociationTable;
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/molecules/CouponAssociationTable/
git commit -m "feat: new CouponAssociationTable component with self-fetching query and optional edit mode"
```

---

## Task 7: TaxAssociationTable — add date columns and onRemove prop

**Files:**
- Modify: `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx`

Note: `TaxAssociationResponse` uses `valid_from` and `valid_to` field names (not `start_date`/`end_date`).

- [ ] **Step 1: Add `onRemove` prop and date columns**

Replace the full content of `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx`:

```typescript
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { TaxAssociationResponse } from '@/types/dto/tax';
import { Chip, ActionButton, Button } from '@/components/atoms';
import { formatDateShort } from '@/utils/common/helper_functions';
import TaxApi from '@/api/TaxApi';
import formatChips from '@/utils/common/format_chips';
import { RouteNames } from '@/core/routes/Routes';
import { TrashIcon } from 'lucide-react';

interface Props {
	data: TaxAssociationResponse[];
	showDelete?: boolean;
	refetchQueryKey?: string;
	onRemove?: (association: TaxAssociationResponse) => void;
}

const TaxAssociationTable: FC<Props> = ({ data, showDelete = true, refetchQueryKey = 'fetchTaxAssociations', onRemove }) => {
	const { t } = useTranslation('common');
	const columns: ColumnData<TaxAssociationResponse>[] = [
		{
			title: 'Tax ID',
			render: (row) => (
				<RedirectCell redirectUrl={`${RouteNames.taxes}/${row.tax_rate_id}`}>{row.tax_rate?.name || row.tax_rate_id}</RedirectCell>
			),
		},
		{
			title: 'Priority',
			render: (row) => row.priority,
		},
		{
			title: 'Auto Apply',
			render: (row) => <Chip variant={row.auto_apply ? 'success' : 'default'} label={row.auto_apply ? t('labels.yes') : t('labels.no')} />,
		},
		{
			title: 'Currency',
			render: (row) => row.currency,
		},
		{
			title: 'Valid From',
			render: (row) => (row.valid_from ? formatDateShort(row.valid_from) : '—'),
		},
		{
			title: 'Valid To',
			render: (row) => (row.valid_to ? formatDateShort(row.valid_to) : 'Forever'),
		},
		{
			title: 'Status',
			render: (row) => {
				const label = formatChips(row?.status);
				return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
			},
		},
		{
			fieldVariant: 'interactive',
			render(row) {
				if (onRemove) {
					return (
						<Button variant='ghost' size='sm' aria-label='Remove' onClick={() => onRemove(row)}>
							<TrashIcon className='h-4 w-4 text-destructive' />
						</Button>
					);
				}
				return (
					<ActionButton
						id={row?.id}
						deleteMutationFn={async () => {
							return await TaxApi.deleteTaxAssociation(row?.id);
						}}
						refetchQueryKey={refetchQueryKey}
						entityName={`${row?.tax_rate?.name} Tax for ${row?.entity_type}`}
						edit={{ enabled: false }}
						archive={{
							enabled: showDelete,
							icon: <TrashIcon className='h-4 w-4' />,
							text: t('actions.delete'),
						}}
					/>
				);
			},
		},
	];

	return (
		<div>
			<FlexpriceTable showEmptyRow={true} columns={columns} data={data} />
		</div>
	);
};

export default TaxAssociationTable;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "TaxAssociationTable" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx
git commit -m "feat: add Valid From/To date columns and onRemove prop to TaxAssociationTable"
```

---

## Task 8: Subscription details page — add Coupon Associations section

**Files:**
- Modify: `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx`

The Tax Associations section already exists (lines 585-592). We add the Coupon Associations section immediately **before** it.

- [ ] **Step 1: Import CouponAssociationTable**

At the top of `CustomerSubscriptionDetailsPage.tsx`, add:

```typescript
import CouponAssociationTable from '@/components/molecules/CouponAssociationTable/CouponAssociationTable';
```

- [ ] **Step 2: Add Coupon Associations card**

Find the tax associations block:

```typescript
{subscriptionTaxAssociations?.items && subscriptionTaxAssociations.items.length > 0 && (
```

Insert the following **immediately before** it:

```typescript
{subscription_id && (
	<Card className='card mt-8'>
		<FormHeader title='Coupon Associations' variant='sub-header' titleClassName='font-semibold' />
		<div className='mt-4'>
			<CouponAssociationTable subscriptionId={subscription_id} />
		</div>
	</Card>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "CustomerSubscriptionDetailsPage" | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx
git commit -m "feat: add read-only Coupon Associations section to subscription details page"
```

---

## Task 9: ApplyCouponDialog

**Files:**
- Create: `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx`
- Create: `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import ApplyCouponDialog from './ApplyCouponDialog';

const mockPreview = vi.fn();
const mockExecute = vi.fn();

vi.mock('@/api/SubscriptionApi', () => ({
	default: {
		previewSubscriptionModify: mockPreview,
		executeSubscriptionModify: mockExecute,
	},
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en', fallbackLng: 'en', ns: ['common'], defaultNS: 'common',
		resources: { en: { common: {} } }, interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient()}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

describe('ApplyCouponDialog', () => {
	it('renders coupon code input in form step', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
	});

	it('calls previewSubscriptionModify with correct payload on Preview click', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		fireEvent.change(screen.getByLabelText(/coupon code/i), { target: { value: 'SUMMER20' } });
		fireEvent.click(screen.getByRole('button', { name: /preview/i }));
		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: 'coupon',
				coupon_params: expect.objectContaining({ action: 'add', coupon_code: 'SUMMER20' }),
			});
		});
	});

	it('shows preview panel after successful preview call', async () => {
		mockPreview.mockResolvedValue({ changed_resources: { invoices: [] } });
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		fireEvent.change(screen.getByLabelText(/coupon code/i), { target: { value: 'TEST' } });
		fireEvent.click(screen.getByRole('button', { name: /preview/i }));
		expect(await screen.findByRole('button', { name: /apply/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create ApplyCouponDialog component**

Create `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx`:

```typescript
import { FC, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { Button, Input, DatePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SubscriptionLineItemResponse, SubModifyCouponParams, SubscriptionModifyResponse } from '@/types/dto/Subscription';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Scope = 'subscription' | 'line_item';
type Step = 'form' | 'preview';

interface Props {
	subscriptionId: string;
	lineItems: SubscriptionLineItemResponse[];
	prefilledLineItemId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyCouponDialog: FC<Props> = ({ subscriptionId, lineItems, prefilledLineItemId, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('form');
	const [couponCode, setCouponCode] = useState('');
	const [scope, setScope] = useState<Scope>(prefilledLineItemId ? 'line_item' : 'subscription');
	const [selectedLineItemId, setSelectedLineItemId] = useState(prefilledLineItemId ?? '');
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();
	const [previewResult, setPreviewResult] = useState<SubscriptionModifyResponse | null>(null);

	const buildParams = (): SubModifyCouponParams => ({
		action: 'add',
		coupon_code: couponCode,
		...(scope === 'line_item' && selectedLineItemId ? { subscription_line_item_id: selectedLineItemId } : {}),
		...(startDate ? { start_date: startDate.toISOString() } : {}),
		...(endDate ? { end_date: endDate.toISOString() } : {}),
	});

	const { mutate: preview, isPending: isPreviewing } = useMutation({
		mutationFn: () =>
			SubscriptionApi.previewSubscriptionModify(subscriptionId, { type: 'coupon', coupon_params: buildParams() }),
		onSuccess: (data) => {
			setPreviewResult(data);
			setStep('preview');
		},
		onError: (err: Error) => toast.error(err.message || 'Preview failed'),
	});

	const { mutate: execute, isPending: isExecuting } = useMutation({
		mutationFn: () =>
			SubscriptionApi.executeSubscriptionModify(subscriptionId, { type: 'coupon', coupon_params: buildParams() }),
		onSuccess: () => {
			toast.success('Coupon applied successfully');
			onSuccess();
			onOpenChange(false);
			resetState();
		},
		onError: (err: Error) => toast.error(err.message || 'Failed to apply coupon'),
	});

	const resetState = () => {
		setStep('form');
		setCouponCode('');
		setScope(prefilledLineItemId ? 'line_item' : 'subscription');
		setSelectedLineItemId(prefilledLineItemId ?? '');
		setStartDate(undefined);
		setEndDate(undefined);
		setPreviewResult(null);
	};

	const hasChanges =
		(previewResult?.changed_resources?.invoices?.length ?? 0) > 0 ||
		(previewResult?.changed_resources?.line_items?.length ?? 0) > 0;

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Apply Coupon</DialogTitle>
				</DialogHeader>

				{step === 'form' && (
					<div className='space-y-4'>
						<div>
							<Label htmlFor='coupon-code'>Coupon Code</Label>
							<Input
								id='coupon-code'
								aria-label='Coupon Code'
								placeholder='e.g. SUMMER20'
								value={couponCode}
								onChange={setCouponCode}
							/>
						</div>

						<div className='space-y-2'>
							<Label>Apply at</Label>
							<RadioGroup
								value={scope}
								onValueChange={(v) => setScope(v as Scope)}
								disabled={!!prefilledLineItemId}
							>
								<div className='flex items-center space-x-2'>
									<RadioGroupItem value='subscription' id='scope-sub' />
									<Label htmlFor='scope-sub'>Subscription level</Label>
								</div>
								<div className='flex items-center space-x-2'>
									<RadioGroupItem value='line_item' id='scope-li' />
									<Label htmlFor='scope-li'>Line item level</Label>
								</div>
							</RadioGroup>
						</div>

						{scope === 'line_item' && (
							<div>
								<Label>Line Item</Label>
								<Select
									value={selectedLineItemId}
									onValueChange={setSelectedLineItemId}
									disabled={!!prefilledLineItemId}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select a line item' />
									</SelectTrigger>
									<SelectContent>
										{lineItems.map((li) => (
											<SelectItem key={li.id} value={li.id}>
												{li.display_name || li.id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label>Start Date (optional)</Label>
								<DatePicker date={startDate} setDate={setStartDate} placeholder='Now' />
							</div>
							<div>
								<Label>End Date (optional)</Label>
								<DatePicker date={endDate} setDate={setEndDate} placeholder='Forever' />
							</div>
						</div>
					</div>
				)}

				{step === 'preview' && (
					<div className='space-y-3'>
						{hasChanges ? (
							<div className='text-sm space-y-2'>
								<p className='font-medium'>Billing impact:</p>
								{previewResult?.changed_resources?.invoices?.map((inv) => (
									<div key={inv.id} className='text-muted-foreground'>
										Invoice {inv.id}: {inv.action}
									</div>
								))}
								{previewResult?.changed_resources?.line_items?.map((li) => (
									<div key={li.id} className='text-muted-foreground'>
										Line item {li.id}: {li.change_action}
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No billing impact — coupon will be recorded but no charges will change.</p>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'form' && (
						<>
							<Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
							<Button onClick={() => preview()} isLoading={isPreviewing} disabled={!couponCode.trim() || isPreviewing}>
								Preview
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={() => setStep('form')}>Back</Button>
							<Button onClick={() => execute()} isLoading={isExecuting} disabled={isExecuting}>
								Apply
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyCouponDialog;
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/molecules/ApplyCouponDialog/
git commit -m "feat: ApplyCouponDialog with preview+execute two-step flow"
```

---

## Task 10: RemoveCouponDialog

**Files:**
- Create: `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx`

- [ ] **Step 1: Create RemoveCouponDialog component**

Create `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx`:

```typescript
import { FC, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CouponAssociation } from '@/models/CouponAssociation';
import { SubscriptionModifyResponse } from '@/types/dto/Subscription';

type Step = 'confirm' | 'preview';

interface Props {
	subscriptionId: string;
	association: CouponAssociation;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RemoveCouponDialog: FC<Props> = ({ subscriptionId, association, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('confirm');
	const [previewResult, setPreviewResult] = useState<SubscriptionModifyResponse | null>(null);

	const payload = { type: 'coupon' as const, coupon_params: { action: 'remove' as const, association_id: association.id } };

	const { mutate: preview, isPending: isPreviewing } = useMutation({
		mutationFn: () => SubscriptionApi.previewSubscriptionModify(subscriptionId, payload),
		onSuccess: (data) => { setPreviewResult(data); setStep('preview'); },
		onError: (err: Error) => toast.error(err.message || 'Preview failed'),
	});

	const { mutate: execute, isPending: isExecuting } = useMutation({
		mutationFn: () => SubscriptionApi.executeSubscriptionModify(subscriptionId, payload),
		onSuccess: () => {
			toast.success('Coupon removed successfully');
			onSuccess();
			onOpenChange(false);
			setStep('confirm');
		},
		onError: (err: Error) => toast.error(err.message || 'Failed to remove coupon'),
	});

	const couponName = association.coupon?.name ?? association.coupon_id;
	const couponCode = association.coupon?.coupon_code;

	const hasChanges =
		(previewResult?.changed_resources?.invoices?.length ?? 0) > 0 ||
		(previewResult?.changed_resources?.line_items?.length ?? 0) > 0;

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) setStep('confirm'); onOpenChange(o); }}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Remove Coupon</DialogTitle>
				</DialogHeader>

				{step === 'confirm' && (
					<p className='text-sm text-muted-foreground'>
						Remove <span className='font-medium text-foreground'>{couponName}</span>
						{couponCode && (
							<> (<code className='font-mono bg-muted px-1 rounded'>{couponCode}</code>)</>
						)}{' '}
						from this subscription?
					</p>
				)}

				{step === 'preview' && (
					<div className='space-y-3 text-sm'>
						{hasChanges ? (
							<div className='space-y-1'>
								<p className='font-medium'>Billing impact:</p>
								{previewResult?.changed_resources?.invoices?.map((inv) => (
									<div key={inv.id} className='text-muted-foreground'>Invoice {inv.id}: {inv.action}</div>
								))}
								{previewResult?.changed_resources?.line_items?.map((li) => (
									<div key={li.id} className='text-muted-foreground'>Line item {li.id}: {li.change_action}</div>
								))}
							</div>
						) : (
							<p className='text-muted-foreground'>No billing impact — association will be soft-deleted.</p>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'confirm' && (
						<>
							<Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
							<Button variant='destructive' onClick={() => preview()} isLoading={isPreviewing} disabled={isPreviewing}>
								Preview
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={() => setStep('confirm')}>Back</Button>
							<Button variant='destructive' onClick={() => execute()} isLoading={isExecuting} disabled={isExecuting}>
								Remove
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RemoveCouponDialog;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "RemoveCouponDialog" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/molecules/RemoveCouponDialog/
git commit -m "feat: RemoveCouponDialog with preview+execute two-step confirm flow"
```

---

## Task 11: ApplyTaxDialog

**Files:**
- Create: `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx`

- [ ] **Step 1: Create ApplyTaxDialog component**

Create `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx`:

```typescript
import { FC, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import TaxApi from '@/api/TaxApi';
import { Button, DatePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubModifyTaxParams, SubscriptionModifyResponse } from '@/types/dto/Subscription';

type Step = 'form' | 'preview';

interface Props {
	subscriptionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyTaxDialog: FC<Props> = ({ subscriptionId, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('form');
	const [taxRateId, setTaxRateId] = useState('');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>();
	const [previewResult, setPreviewResult] = useState<SubscriptionModifyResponse | null>(null);

	const { data: taxRates } = useQuery({
		queryKey: ['taxRates'],
		queryFn: () => TaxApi.listTaxRates({ limit: 100, offset: 0 }),
		enabled: open,
	});

	const buildParams = (): SubModifyTaxParams => ({
		action: 'add',
		tax_rate_id: taxRateId,
		...(effectiveDate ? { effective_date: effectiveDate.toISOString() } : {}),
	});

	const { mutate: preview, isPending: isPreviewing } = useMutation({
		mutationFn: () => SubscriptionApi.previewSubscriptionModify(subscriptionId, { type: 'tax', tax_params: buildParams() }),
		onSuccess: (data) => { setPreviewResult(data); setStep('preview'); },
		onError: (err: Error) => toast.error(err.message || 'Preview failed'),
	});

	const { mutate: execute, isPending: isExecuting } = useMutation({
		mutationFn: () => SubscriptionApi.executeSubscriptionModify(subscriptionId, { type: 'tax', tax_params: buildParams() }),
		onSuccess: () => {
			toast.success('Tax applied successfully');
			onSuccess();
			onOpenChange(false);
			resetState();
		},
		onError: (err: Error) => toast.error(err.message || 'Failed to apply tax'),
	});

	const resetState = () => {
		setStep('form');
		setTaxRateId('');
		setEffectiveDate(undefined);
		setPreviewResult(null);
	};

	const hasChanges =
		(previewResult?.changed_resources?.invoices?.length ?? 0) > 0 ||
		(previewResult?.changed_resources?.line_items?.length ?? 0) > 0;

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Apply Tax</DialogTitle>
				</DialogHeader>

				{step === 'form' && (
					<div className='space-y-4'>
						<div>
							<Label>Tax Rate</Label>
							<Select value={taxRateId} onValueChange={setTaxRateId}>
								<SelectTrigger>
									<SelectValue placeholder='Select a tax rate' />
								</SelectTrigger>
								<SelectContent>
									{taxRates?.items?.map((rate) => (
										<SelectItem key={rate.id} value={rate.id}>
											{rate.name} ({rate.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Effective Date (optional)</Label>
							<DatePicker date={effectiveDate} setDate={setEffectiveDate} placeholder='Now' />
						</div>
					</div>
				)}

				{step === 'preview' && (
					<div className='space-y-3 text-sm'>
						{hasChanges ? (
							<div className='space-y-1'>
								<p className='font-medium'>Billing impact:</p>
								{previewResult?.changed_resources?.invoices?.map((inv) => (
									<div key={inv.id} className='text-muted-foreground'>Invoice {inv.id}: {inv.action}</div>
								))}
							</div>
						) : (
							<p className='text-muted-foreground'>No billing impact — tax will be recorded but no charges will change.</p>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'form' && (
						<>
							<Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
							<Button onClick={() => preview()} isLoading={isPreviewing} disabled={!taxRateId || isPreviewing}>
								Preview
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={() => setStep('form')}>Back</Button>
							<Button onClick={() => execute()} isLoading={isExecuting} disabled={isExecuting}>
								Apply
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyTaxDialog;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "ApplyTaxDialog" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/molecules/ApplyTaxDialog/
git commit -m "feat: ApplyTaxDialog with tax rate select and preview+execute flow"
```

---

## Task 12: RemoveTaxDialog

**Files:**
- Create: `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx`

- [ ] **Step 1: Create RemoveTaxDialog component**

Create `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx`:

```typescript
import { FC, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TaxAssociationResponse } from '@/types/dto/tax';
import { SubscriptionModifyResponse } from '@/types/dto/Subscription';

type Step = 'confirm' | 'preview';

interface Props {
	subscriptionId: string;
	association: TaxAssociationResponse;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RemoveTaxDialog: FC<Props> = ({ subscriptionId, association, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('confirm');
	const [previewResult, setPreviewResult] = useState<SubscriptionModifyResponse | null>(null);

	const payload = { type: 'tax' as const, tax_params: { action: 'remove' as const, association_id: association.id } };

	const { mutate: preview, isPending: isPreviewing } = useMutation({
		mutationFn: () => SubscriptionApi.previewSubscriptionModify(subscriptionId, payload),
		onSuccess: (data) => { setPreviewResult(data); setStep('preview'); },
		onError: (err: Error) => toast.error(err.message || 'Preview failed'),
	});

	const { mutate: execute, isPending: isExecuting } = useMutation({
		mutationFn: () => SubscriptionApi.executeSubscriptionModify(subscriptionId, payload),
		onSuccess: () => {
			toast.success('Tax removed successfully');
			onSuccess();
			onOpenChange(false);
			setStep('confirm');
		},
		onError: (err: Error) => toast.error(err.message || 'Failed to remove tax'),
	});

	const taxName = association.tax_rate?.name ?? association.tax_rate_id;
	const hasChanges = (previewResult?.changed_resources?.invoices?.length ?? 0) > 0;

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) setStep('confirm'); onOpenChange(o); }}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Remove Tax</DialogTitle>
				</DialogHeader>

				{step === 'confirm' && (
					<p className='text-sm text-muted-foreground'>
						Remove tax <span className='font-medium text-foreground'>{taxName}</span> from this subscription?
					</p>
				)}

				{step === 'preview' && (
					<div className='space-y-3 text-sm'>
						{hasChanges ? (
							<div className='space-y-1'>
								<p className='font-medium'>Billing impact:</p>
								{previewResult?.changed_resources?.invoices?.map((inv) => (
									<div key={inv.id} className='text-muted-foreground'>Invoice {inv.id}: {inv.action}</div>
								))}
							</div>
						) : (
							<p className='text-muted-foreground'>No billing impact — tax association will be removed.</p>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'confirm' && (
						<>
							<Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
							<Button variant='destructive' onClick={() => preview()} isLoading={isPreviewing} disabled={isPreviewing}>
								Preview
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={() => setStep('confirm')}>Back</Button>
							<Button variant='destructive' onClick={() => execute()} isLoading={isExecuting} disabled={isExecuting}>
								Remove
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RemoveTaxDialog;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "RemoveTaxDialog" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/molecules/RemoveTaxDialog/
git commit -m "feat: RemoveTaxDialog with preview+execute confirm flow"
```

---

## Task 13: Subscription edit page — coupon and tax management sections

**Files:**
- Modify: `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx`

- [ ] **Step 1: Add imports**

At the top of `CustomerSubscriptionEditPage.tsx`, add the following imports:

```typescript
import CouponAssociationTable from '@/components/molecules/CouponAssociationTable/CouponAssociationTable';
import TaxAssociationTable from '@/components/molecules/TaxAssociationTable/TaxAssociationTable';
import ApplyCouponDialog from '@/components/molecules/ApplyCouponDialog/ApplyCouponDialog';
import RemoveCouponDialog from '@/components/molecules/RemoveCouponDialog/RemoveCouponDialog';
import ApplyTaxDialog from '@/components/molecules/ApplyTaxDialog/ApplyTaxDialog';
import RemoveTaxDialog from '@/components/molecules/RemoveTaxDialog/RemoveTaxDialog';
import { CouponAssociation } from '@/models/CouponAssociation';
import { TaxAssociationResponse } from '@/types/dto/tax';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import TaxApi from '@/api/TaxApi';
import { Card, FormHeader } from '@/components/atoms';
import { Button } from '@/components/atoms';
import { PlusIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
```

- [ ] **Step 2: Add dialog state and query**

Inside `CustomerSubscriptionEditPage` (after the existing `useState` declarations), add:

```typescript
const queryClient = useQueryClient();

// Coupon dialog state
const [applyCouponOpen, setApplyCouponOpen] = useState(false);
const [removeCouponAssociation, setRemoveCouponAssociation] = useState<CouponAssociation | null>(null);

// Tax dialog state
const [applyTaxOpen, setApplyTaxOpen] = useState(false);
const [removeTaxAssociation, setRemoveTaxAssociation] = useState<TaxAssociationResponse | null>(null);

// Load subscription line items for the apply coupon dialog scope selector
const { data: lineItemsData } = useQuery({
	queryKey: subscriptionId ? [...subscriptionEditScopeQueryKey(subscriptionId), 'lineItemsForDialog'] : ['disabled'],
	queryFn: async () => SubscriptionApi.listSubscriptionLineItems({ subscription_ids: [subscriptionId!], limit: 100, offset: 0 }),
	enabled: !!subscriptionId,
});

// Load subscription tax associations
const { data: taxAssociationsData, refetch: refetchTaxAssociations } = useQuery({
	queryKey: subscriptionId ? ['subscriptionTaxAssociations', subscriptionId] : ['disabled'],
	queryFn: async () =>
		TaxApi.listTaxAssociations({
			limit: 1000, offset: 0,
			entity_id: subscriptionId!,
			entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
		}),
	enabled: !!subscriptionId,
});

const invalidateCouponAssociations = () => {
	if (subscriptionId) queryClient.invalidateQueries({ queryKey: ['couponAssociations', subscriptionId] });
};

const invalidateTaxAssociations = () => {
	if (subscriptionId) void refetchTaxAssociations();
};
```

- [ ] **Step 3: Add the two sections to the JSX**

Find the last section in the edit page JSX (the credit grants or inheriting customers section, whichever is last). After it, before the closing `</div>` of the main content wrapper, add:

```typescript
{/* Coupon Associations */}
{subscriptionId && (
	<Card className='card mt-8'>
		<div className='flex items-center justify-between px-6 pt-6 pb-2'>
			<FormHeader title='Coupon Associations' variant='sub-header' titleClassName='font-semibold' />
			<Button size='sm' variant='outline' onClick={() => setApplyCouponOpen(true)}>
				<PlusIcon className='h-4 w-4 mr-1' /> Add Coupon
			</Button>
		</div>
		<div className='px-6 pb-6'>
			<CouponAssociationTable
				subscriptionId={subscriptionId}
				onRemove={(assoc) => setRemoveCouponAssociation(assoc)}
			/>
		</div>
	</Card>
)}

{/* Tax Associations */}
{subscriptionId && (
	<Card className='card mt-8'>
		<div className='flex items-center justify-between px-6 pt-6 pb-2'>
			<FormHeader title='Tax Associations' variant='sub-header' titleClassName='font-semibold' />
			<Button size='sm' variant='outline' onClick={() => setApplyTaxOpen(true)}>
				<PlusIcon className='h-4 w-4 mr-1' /> Add Tax
			</Button>
		</div>
		<div className='px-6 pb-6'>
			<TaxAssociationTable
				data={taxAssociationsData?.items ?? []}
				showDelete={false}
				onRemove={(assoc) => setRemoveTaxAssociation(assoc)}
			/>
		</div>
	</Card>
)}

{/* Dialogs */}
{subscriptionId && (
	<>
		<ApplyCouponDialog
			subscriptionId={subscriptionId}
			lineItems={lineItemsData?.items ?? []}
			open={applyCouponOpen}
			onOpenChange={setApplyCouponOpen}
			onSuccess={invalidateCouponAssociations}
		/>
		{removeCouponAssociation && (
			<RemoveCouponDialog
				subscriptionId={subscriptionId}
				association={removeCouponAssociation}
				open={!!removeCouponAssociation}
				onOpenChange={(o) => { if (!o) setRemoveCouponAssociation(null); }}
				onSuccess={() => { setRemoveCouponAssociation(null); invalidateCouponAssociations(); }}
			/>
		)}
		<ApplyTaxDialog
			subscriptionId={subscriptionId}
			open={applyTaxOpen}
			onOpenChange={setApplyTaxOpen}
			onSuccess={invalidateTaxAssociations}
		/>
		{removeTaxAssociation && (
			<RemoveTaxDialog
				subscriptionId={subscriptionId}
				association={removeTaxAssociation}
				open={!!removeTaxAssociation}
				onOpenChange={(o) => { if (!o) setRemoveTaxAssociation(null); }}
				onSuccess={() => { setRemoveTaxAssociation(null); invalidateTaxAssociations(); }}
			/>
		)}
	</>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "CustomerSubscriptionEditPage" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/customer/customers/CustomerSubscriptionEditPage.tsx
git commit -m "feat: add coupon and tax association sections to subscription edit page with dialog wiring"
```

---

## Task 14: SubscriptionLineItemTable — extend LineItemDropdown with coupon menu items

**Files:**
- Modify: `src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx`
- Modify: `src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx`

- [ ] **Step 1: Extend LineItemDropdownProps and the dropdown options**

In `src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx`:

Find `interface LineItemDropdownProps` (line ~78) and add two optional callback props:

```typescript
interface LineItemDropdownProps {
	row: LineItem;
	isEditDisabled: boolean;
	isTerminateDisabled: boolean;
	onEdit: (lineItem: LineItem) => void;
	onTerminate: (lineItem: LineItem) => void;
	onViewCommitment?: (lineItem: LineItem) => void;
	onApplyCoupon?: (lineItem: LineItem) => void;
	onRemoveCoupon?: (lineItem: LineItem) => void;
}
```

Update the `LineItemDropdown` component signature to destructure the new props:

```typescript
const LineItemDropdown: FC<LineItemDropdownProps> = ({
	row,
	isEditDisabled,
	isTerminateDisabled,
	onEdit,
	onTerminate,
	onViewCommitment,
	onApplyCoupon,
	onRemoveCoupon,
}) => {
```

Inside the `options` array passed to `<DropdownMenu>`, add coupon items after the existing "Terminate" option:

```typescript
...(onApplyCoupon
	? [
			{
				label: 'Apply coupon',
				icon: <Tag />,
				onSelect: (e: Event) => {
					e.preventDefault();
					setIsOpen(false);
					onApplyCoupon(row);
				},
			},
		]
	: []),
...(onRemoveCoupon
	? [
			{
				label: 'Remove coupon',
				icon: <TagOff />,
				onSelect: (e: Event) => {
					e.preventDefault();
					setIsOpen(false);
					onRemoveCoupon(row);
				},
			},
		]
	: []),
```

Add `Tag` and `TagOff` to the existing lucide-react import at the top of the file:

```typescript
import { Eye, Pencil, Trash2, Tag, TagOff } from 'lucide-react';
```

Find the props interface for `SubscriptionLineItemTable` (the parent component). It has props like `onEdit`, `onTerminate`, `onViewCommitment`. Add the two new optional callbacks there too, and thread them down to `LineItemDropdown`:

```typescript
// In the SubscriptionLineItemTable props interface, add:
onApplyCoupon?: (lineItem: LineItem) => void;
onRemoveCoupon?: (lineItem: LineItem) => void;
```

Find where `<LineItemDropdown>` is rendered inside the table columns and pass the new props:

```typescript
<LineItemDropdown
	row={row}
	isEditDisabled={...}
	isTerminateDisabled={...}
	onEdit={onEdit}
	onTerminate={onTerminate}
	onViewCommitment={onViewCommitment}
	onApplyCoupon={onApplyCoupon}
	onRemoveCoupon={onRemoveCoupon}
/>
```

- [ ] **Step 2: Thread callbacks through SubscriptionEditChargesSection**

In `src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx`:

Add to `SubscriptionEditChargesSectionProps`:

```typescript
onApplyCouponToLineItem?: (lineItem: LineItem) => void;
onRemoveCouponFromLineItem?: (lineItem: LineItem) => void;
```

Destructure them in the component function:

```typescript
const SubscriptionEditChargesSection: FC<SubscriptionEditChargesSectionProps> = ({
	// ... existing props
	onApplyCouponToLineItem,
	onRemoveCouponFromLineItem,
}) => {
```

Pass them to `<SubscriptionLineItemTable>` in the JSX:

```typescript
<SubscriptionLineItemTable
	// ... existing props
	onApplyCoupon={onApplyCouponToLineItem}
	onRemoveCoupon={onRemoveCouponFromLineItem}
/>
```

- [ ] **Step 3: Wire up from CustomerSubscriptionEditPage**

In `CustomerSubscriptionEditPage.tsx`, add two more state variables and callbacks:

```typescript
const [applyCouponLineItemId, setApplyCouponLineItemId] = useState<string | undefined>();
const [removeCouponLineItemAssoc, setRemoveCouponLineItemAssoc] = useState<CouponAssociation | null>(null);
```

Pass to `<SubscriptionEditChargesSection>`:

```typescript
<SubscriptionEditChargesSection
	// ... existing props
	onApplyCouponToLineItem={(lineItem) => {
		setApplyCouponLineItemId(lineItem.id);
		setApplyCouponOpen(true);
	}}
	onRemoveCouponFromLineItem={(lineItem) => {
		// Find the association for this line item from loaded coupon associations
		// CouponAssociationTable manages its own query; here we need a separate ref or pass the data down
		// Simple approach: open ApplyCouponDialog with prefilledLineItemId (user can also use the table Remove button)
		setApplyCouponLineItemId(lineItem.id);
		setApplyCouponOpen(true);
	}}
/>
```

Update `ApplyCouponDialog` usage to pass `prefilledLineItemId`:

```typescript
<ApplyCouponDialog
	subscriptionId={subscriptionId}
	lineItems={lineItemsData?.items ?? []}
	prefilledLineItemId={applyCouponLineItemId}
	open={applyCouponOpen}
	onOpenChange={(o) => { setApplyCouponOpen(o); if (!o) setApplyCouponLineItemId(undefined); }}
	onSuccess={invalidateCouponAssociations}
/>
```

For "Remove coupon" from the three-dot menu: the `onRemoveCouponFromLineItem` handler needs the association ID. Load coupon associations at the edit page level and look up by `subscription_line_item_id`:

```typescript
// In CustomerSubscriptionEditPage, after the taxAssociationsData query, add:
const { data: couponAssociationsData } = useQuery({
	queryKey: subscriptionId ? ['couponAssociations', subscriptionId] : ['disabled'],
	queryFn: () => CouponApi.listCouponAssociations({ subscription_ids: [subscriptionId!], active_only: true }),
	enabled: !!subscriptionId,
});
```

Update the `onRemoveCouponFromLineItem` handler:

```typescript
onRemoveCouponFromLineItem={(lineItem) => {
	const assoc = couponAssociationsData?.items?.find(
		(a) => a.subscription_line_item_id === lineItem.id,
	);
	if (assoc) setRemoveCouponAssociation(assoc);
}}
```

Import `CouponApi` at the top of `CustomerSubscriptionEditPage.tsx`:

```typescript
import CouponApi from '@/api/CouponApi';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run src/components/molecules/CouponDrawer/CouponDrawer.test.tsx \
	src/components/molecules/CouponAssociationTable/CouponAssociationTable.test.tsx \
	src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx \
	src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx \
	src/pages/customer/customers/CustomerSubscriptionEditPage.tsx
git commit -m "feat: add Apply/Remove coupon to line item three-dot menu and wire up from edit page"
```

---

## Self-Review Checklist

- [x] **Spec §1.1** (coupon_code on Coupon model) → Task 1 Step 1
- [x] **Spec §1.1** (CouponAssociation model) → Task 1 Step 2
- [x] **Spec §1.1** (COUPON/TAX modify types + action enums) → Task 1 Step 3
- [x] **Spec §1.2** (coupon_code on CreateCouponRequest) → Task 2 Step 1
- [x] **Spec §1.2** (CouponAssociationFilter + ListCouponAssociationsResponse) → Task 2 Step 2
- [x] **Spec §1.2** (SubscriptionCouponInput) → Task 2 Step 3
- [x] **Spec §1.2** (SubModifyCouponParams, SubModifyTaxParams on ExecuteSubscriptionModifyRequest) → Task 2 Step 3
- [x] **Spec §1.3** (CouponApi.listCouponAssociations) → Task 3
- [x] **Spec §2.1** (CouponDrawer coupon_code create-only, required) → Task 4
- [x] **Spec §2.2** (CouponDetails show coupon_code) → Task 5
- [x] **Spec §3.1** (CouponAssociationTable with self-fetch + onRemove?) → Task 6
- [x] **Spec §3.2** (TaxAssociationTable date columns + onRemove?) → Task 7
- [x] **Spec §3 (page)** (details page coupon section) → Task 8
- [x] **Spec §4.1** (ApplyCouponDialog) → Task 9
- [x] **Spec §4.2** (RemoveCouponDialog) → Task 10
- [x] **Spec §4.3** (ApplyTaxDialog) → Task 11
- [x] **Spec §4.4** (RemoveTaxDialog) → Task 12
- [x] **Spec §4 (page)** (edit page coupon + tax sections) → Task 13
- [x] **Spec §4.5** (LineItemDropdown three-dot menu) → Task 14
- [x] **Spec §5** (query invalidation) → Tasks 13 + 14 via `invalidateCouponAssociations` / `refetchTaxAssociations`
