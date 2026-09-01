import { describe, it, expect, beforeEach } from 'vitest';
import { registerModalOpen, hasRegisteredOpenModals } from './modal-scroll-lock';

describe('modal-scroll-lock', () => {
	beforeEach(() => {
		// Drain any registrations left over from a previous test so counts start at 0.
		while (hasRegisteredOpenModals()) {
			registerModalOpen()();
		}
	});

	it('tracks open/close pairs correctly', () => {
		const release = registerModalOpen();
		expect(hasRegisteredOpenModals()).toBe(true);
		release();
		expect(hasRegisteredOpenModals()).toBe(false);
	});

	it("calling the same release twice does not double-decrement another modal's registration", () => {
		const releaseA = registerModalOpen();
		const releaseB = registerModalOpen();

		releaseA();
		releaseA(); // idempotent: must not release B's slot too
		expect(hasRegisteredOpenModals()).toBe(true); // B is still open

		releaseB();
		expect(hasRegisteredOpenModals()).toBe(false);
	});
});
