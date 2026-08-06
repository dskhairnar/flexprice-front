import { FC, ReactNode, useRef, useEffect, useCallback } from 'react';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hasRegisteredOpenModals, hasOpenOverlayInDom, registerModalOpen } from '@/lib/modal-scroll-lock';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

const PORTALED_OVERLAY_SELECTOR = [
	'[data-radix-popper-content-wrapper]',
	'[data-radix-select-content]',
	'[data-radix-menu-content]',
	'[data-radix-dropdown-menu-content]',
	'[data-radix-popover-content]',
].join(', ');

const isPortaledOverlayTarget = (target: EventTarget | null) =>
	target instanceof Element && !!target.closest(PORTALED_OVERLAY_SELECTOR);

const hasOpenPortaledOverlay = () => !!document.querySelector(PORTALED_OVERLAY_SELECTOR);

/** @deprecated Prefer useSheetOutsideDismissGuards — kept for drawers that still import this helper. */
export const isPortaledSelectTarget = (target: EventTarget | null) => isPortaledOverlayTarget(target);

/**
 * Side sheets use `modal={false}` so portaled selects stay clickable.
 * Outside click still closes the sheet, except while a portaled dropdown is open
 * (or the click landed on one) — then only the dropdown dismisses.
 */
export function useSheetOutsideDismissGuards(enabled = true) {
	const suppressDismissRef = useRef(false);

	useEffect(() => {
		if (!enabled) {
			suppressDismissRef.current = false;
			return;
		}

		// Capture before nested dismissable layers unmount open dropdowns.
		const onPointerDownCapture = () => {
			if (!hasOpenPortaledOverlay()) return;
			suppressDismissRef.current = true;
			// Backup clear if this gesture never hits the sheet outside handlers (e.g. click inside sheet).
			window.setTimeout(() => {
				suppressDismissRef.current = false;
			}, 100);
		};

		document.addEventListener('pointerdown', onPointerDownCapture, true);
		return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
	}, [enabled]);

	const preventOutsideDismiss = useCallback((event: Event) => {
		if (isPortaledOverlayTarget(event.target) || suppressDismissRef.current || hasOpenPortaledOverlay()) {
			event.preventDefault();
			suppressDismissRef.current = false;
		}
	}, []);

	const preventFocusOutsideDismiss = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	return {
		onPointerDownOutside: preventOutsideDismiss,
		onInteractOutside: preventOutsideDismiss,
		onFocusOutside: preventFocusOutsideDismiss,
	};
}

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
	const outsideDismissGuards = useSheetOutsideDismissGuards(!!isOpen);

	useEffect(() => {
		if (!isOpen) return;
		return registerModalOpen();
	}, [isOpen]);

	// Clear stuck body scroll/pointer locks after close when nested overlays race Radix cleanup.
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
				{...outsideDismissGuards}
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
