import { Price } from '@/models/Price';

/** Row-action handlers for a catalog charges table (addon/plan details pages). */
export interface ChargeActionHandlers {
	onEditPrice: (price: Price) => void;
	onEditDetails: (price: Price) => void;
	onTerminatePrice: (price: Price) => void;
	canWritePrice: boolean;
}
