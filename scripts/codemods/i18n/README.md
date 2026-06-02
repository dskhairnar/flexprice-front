# i18n codemod

Automates migration of user-visible JSX string literals to `react-i18next` `t()` calls. Targets the same surfaces as `eslint-plugin-i18next` (`jsx-only` mode in `eslint.config.js`).

## Commands

```bash
# Preview changes (default) — discovers files from ESLint violations
npm run codemod:i18n

# Apply transforms + update en locale JSON
npm run codemod:i18n:write

# Single file with explicit key prefix (connection drawers)
npm run codemod:i18n:write -- src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx --key-prefix connection.whop --namespace settings
```

## Requirements

- The component must already call `useTranslation()` and expose a `t` binding (or alias). The codemod does not inject hooks yet — add those first for new files.
- Keys are written under `src/i18n/locales/en/{namespace}.json`. Arabic (`ar/`) and other locales must be translated separately.
- Mixed JSX (text + elements) and `<code>` content are skipped — migrate those manually, often with `Trans` and rich-text keys.

## Key naming

| Source | Example key |
|--------|-------------|
| `WhopConnectionDrawer.tsx` | `connection.whop.*` (auto prefix) |
| `placeholder="Name your Whop connection"` | `connection.whop.nameYourWhopConnectionPlaceholder` |
| `description="A friendly name..."` | `connection.whop.aFriendlyNameHint` |
| `<p>Push Flexprice invoices...</p>` | `connection.whop.pushFlexpriceInvoices...` |

Override prefix/namespace with `--key-prefix` and `--namespace` when auto-detection is wrong.

## Workflow

1. Run `npm run lint` and note `i18next/no-literal-string` errors.
2. Ensure `useTranslation('<namespace>')` exists in the file.
3. `npm run codemod:i18n` — review proposed keys.
4. `npm run codemod:i18n:write` — apply.
5. Rename keys in JSON if you prefer existing naming (e.g. align with `connection.chargebee.*`).
6. Add matching entries under `src/i18n/locales/ar/`.
7. `npm run lint` to confirm violations are gone.
