# @flexprice/flexprice-ui

Drop-in **React** components for pricing pages, extracted from the Flexprice dashboard so your
app renders the exact same pricing UI. **Bring your own data** — the components are purely
presentational (no fetching, no auth, no routing).

## Install

```bash
npm install @flexprice/flexprice-ui
```

`react` and `react-dom` (v18) are peer dependencies.

## Usage

Import the stylesheet once (ships the theme tokens + only the utilities the widget uses):

```tsx
import '@flexprice/flexprice-ui/style.css';
import { PricingTable, PricingCard, type Plan } from '@flexprice/flexprice-ui';
```

### `PricingTable` — the full grid

```tsx
const plans: Plan[] = /* fetch + map your Flexprice plans (see adapters below) */;

<PricingTable
  plans={plans}
  billingPeriod={period}
  onBillingPeriodChange={setPeriod}
  billingPeriodOptions={[{ label: 'Monthly', value: 'MONTHLY' }]}
  currency={currency}
  onCurrencyChange={setCurrency}
  currencyOptions={[{ label: 'USD', value: 'USD' }]}
  onSelectPlan={(planId) => router.push(`/checkout/${planId}`)}
/>
```

### `PricingCard` — a single plan, use standalone

```tsx
<PricingCard {...plan} useModernChrome onSelectPlan={handleSelect} />
```

Both are individual components — compose your own layout with `PricingCard`, or use
`PricingTable` for the standard responsive grid.

## Bring your own data

The `plans` prop is the presentational `Plan` shape (decoupled from the Flexprice API). If you
fetch raw Flexprice plans/prices/entitlements, map them with the exported adapters:

```ts
import { adaptPlanToCard, filterAndSortPlans } from '@flexprice/flexprice-ui';

const cards = filterAndSortPlans(plansWithData, 'USD', 'MONTHLY').map((p) => adaptPlanToCard(p, grants));
```

Or build the `Plan` objects yourself — see the exported `Plan` / `Feature` types.

## Theming

Override the CSS variables on a wrapping element. Add `class="dark"` for dark mode.

```css
.my-pricing { --brand: 243 75% 59%; --radius: 12px; }
```

## Dark mode

The stylesheet includes a `.dark` variant. Toggle it by adding the `dark` class to any ancestor.
