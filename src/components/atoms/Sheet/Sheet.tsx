import { FC, ReactNode, useRef, useEffect, useCallback } from 'react';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hasRegisteredOpenModals, hasOpenOverlayInDom, registerModalOpen } from '@/lib/modal-scroll-lock';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

/**
 * Modal sheets set body `pointer-events: none`, and Radix Popover-based comboboxes
 * (SearchableSelect, AsyncSearchableSelect, and anything built on them, e.g. SelectGroup,
 * SelectFeature) portal their option list outside the sheet's DOM subtree, so their options
 * become unclickable — clicks fall through to the overlay instead of the option. Rendering
 * the sheet as non-modal and ignoring "outside" interactions that originate inside a
 * portaled popper avoids this for every consumer of this atom.
 */
export const isPortaledSelectTarget = (target: EventTarget | null) =>
	target instanceof Element && !!target.closest('[data-radix-popper-content-wrapper]');

interface Props {
	trigger?: ReactNode;
	children?: ReactNode;
	title?: string | ReactNode;
	description?: string | ReactNode;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

const Sheet: FC<Props> = ({ children, trigger, description, title, isOpen, onOpenChange, className, size = 'sm' }) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const direction = useLocaleStore((s) => s.direction);
	const side = direction === Direction.RTL ? 'left' : 'right';

	const preventPortaledSelectDismiss = useCallback((event: Event) => {
		if (isPortaledSelectTarget(event.target)) {
			event.preventDefault();
		}
	}, []);

	// Non-modal dialogs get no default protection against focus-outside dismissal (Radix only
	// applies that to modal dialogs). Without it, a sheet opened from a menu item/action button
	// closes itself the instant that trigger reclaims focus after its own menu finishes closing.
	// Focus moving elsewhere should never by itself close the sheet — only an explicit outside
	// click or the close button should.
	const preventFocusOutsideDismiss = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	// Register while open so the safety net below (and every other Dialog/Sheet instance) knows
	// not to clear the shared body lock while this one is still legitimately open.
	useEffect(() => {
		if (!isOpen) return;
		return registerModalOpen();
	}, [isOpen]);

	// Radix's scroll lock (react-remove-scroll) is expected to release document.body's
	// overflow/pointer-events once this sheet's close transition finishes. When this Sheet closes
	// while nested inside/alongside another modal (a Dialog, Select, or Popover opened from within
	// it), that release can race and get skipped — the lock stays stuck even though nothing is
	// visibly open, leaving the rest of the page unscrollable. As a safety net, once we transition
	// to closed, verify nothing else is still holding a lock and clear it.
	useEffect(() => {
		if (isOpen) return;
		const timer = window.setTimeout(() => {
			if (hasRegisteredOpenModals()) return;
			if (hasOpenOverlayInDom()) return;
			if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = '';
			if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
		}, 350);
		return () => window.clearTimeout(timer);
	}, [isOpen]);

	return (
		<ShadcnSheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
			{trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
			<SheetContent
				ref={contentRef}
				side={side}
				onPointerDownOutside={preventPortaledSelectDismiss}
				onInteractOutside={preventPortaledSelectDismiss}
				onFocusOutside={preventFocusOutsideDismiss}
				className={cn('h-screen overflow-y-auto rounded-[10px]', className, {
					'sm:max-w-sm': size === 'sm',
					'sm:max-w-md': size === 'md',
					'sm:max-w-lg': size === 'lg',
					'sm:max-w-xl': size === 'xl',
					'sm:max-w-2xl': size === '2xl',
					'sm:max-w-3xl': size === '3xl',
					'sm:max-w-full': size === 'full',
				})}>
				{(title || description) && (
					<SheetHeader>
						{title && <SheetTitle>{title}</SheetTitle>}
						{description && <SheetDescription>{description}</SheetDescription>}
					</SheetHeader>
				)}
				{children}
			</SheetContent>
		</ShadcnSheet>
	);
};

export default Sheet;
