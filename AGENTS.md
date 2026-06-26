---
layer: constitution
repo: flexprice-front (React frontend)
synced_sha: 397b61a6919e73b140180c3c25088fee6114fe5c
synced_at: 2026-06-09T00:00:00Z
---

# Flexprice Frontend — Constitution

> Invariants that MUST hold in every PR.
> Per-directory `AGENTS.md` files (in `src/api/`, `src/components/`, `src/pages/`, `src/hooks/`) carry layer-specific patterns — load them lazily.
> Improvement notes → `.context/findings/` (never in this file).

## Stack
React 18 + TypeScript · Vite · Tailwind CSS · Radix UI · Zustand · TanStack Query · Vitest

## Directory map
| Layer | Path | One-line rule |
|---|---|---|
| API client | `src/api/` | All server calls; Axios + TanStack Query wrappers |
| Components | `src/components/` | Reusable UI; no page-level state or route logic |
| Pages | `src/pages/` | Route targets; compose components + hooks |
| Hooks | `src/hooks/` | Custom React hooks; data fetching + business state |
| Models | `src/models/` + `src/types/` | TypeScript types + Zod schemas |
| Store | `src/store/` | Zustand; client-side global state only |

## Hard invariants

### Data fetching
- All server interactions via TanStack Query (`useQuery` / `useMutation`). No raw `fetch`/`axios` in components or pages.
- API service functions live in `src/api/`; never inline API calls in components.

### Typing
- No `any`. Use Zod schemas for runtime validation of API responses.
- Shared types in `src/models/` or `src/types/` — never define types inline in page files.

### Styling
- Tailwind utility classes only; no inline `style={}` props except for dynamic values that Tailwind cannot express.
- Use `cn()` from `src/lib/utils.ts` (tailwind-merge) for conditional classes.
- Follow existing Radix UI + Tailwind patterns in `src/components/`.

### State
- Server state → TanStack Query. Client UI state → Zustand or local `useState`.
- Never put server-fetched data into Zustand (avoids double-source-of-truth).

### Components
- UI components in `src/components/` must be reusable with no route coupling.
- Page components (`src/pages/`) are route targets only; keep them thin.
- `localStorage` / `sessionStorage` use must be intentional and documented.

### Testing
- Tests co-located: `*.test.tsx` or `*.spec.tsx` alongside the source file.
- Use `@testing-library/react`; no enzyme, no shallow render.
- Test setup in `src/tests/setup.ts`.

### Build
- `npm run build` must pass (TypeScript check + Vite) before merge.
- `npx eslint src/` must pass (zero errors).
