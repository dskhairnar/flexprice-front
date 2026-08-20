import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@/core/services/supbase/config', () => ({
	default: { auth: { onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args) } },
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	queryClient: { invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args) },
}));

// Imported after the mocks above so the module picks them up.
import { useSupabaseAuthSync } from './useSupabaseAuthSync';

describe('useSupabaseAuthSync', () => {
	beforeEach(() => {
		mockOnAuthStateChange.mockReset();
		mockUnsubscribe.mockReset();
		mockInvalidateQueries.mockReset();
		mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } });
	});

	it('subscribes to auth state changes on mount', () => {
		renderHook(() => useSupabaseAuthSync());
		expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
	});

	it('invalidates the user and rbac-roles query caches on every auth event', () => {
		renderHook(() => useSupabaseAuthSync());
		const handler = mockOnAuthStateChange.mock.calls[0][0];

		handler('SIGNED_IN', {});

		expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['user'], exact: false });
		expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['rbac-roles'], exact: false });
	});

	it('unsubscribes on unmount', () => {
		const { unmount } = renderHook(() => useSupabaseAuthSync());
		unmount();
		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
	});

	it('does not throw when the mock supabase client returns no subscription (self-hosted)', () => {
		mockOnAuthStateChange.mockReturnValue({ data: null, error: null });
		const { unmount } = renderHook(() => useSupabaseAuthSync());
		expect(() => unmount()).not.toThrow();
	});
});
