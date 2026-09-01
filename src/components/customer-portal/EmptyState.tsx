/**
 * The portal's empty state is the shared one — re-exported rather than
 * reimplemented so Usage, Invoices, Payments and Overview cannot drift apart.
 *
 * Imported from the file, not the atoms barrel: that barrel also re-exports
 * ErrorBoundary, which drags the dashboard router into anything importing it.
 */
export { default, type EmptyStateAction } from '@/components/atoms/EmptyState/EmptyState';
