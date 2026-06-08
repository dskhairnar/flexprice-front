import toast from 'react-hot-toast';
import { Button } from '../Button';

export type ToastVariant = 'error' | 'success';

export interface ToastNotificationProps {
	message: string;
	variant?: ToastVariant;
	triggerLabel?: string;
}

export const showToast = (message: string, variant: ToastVariant = 'error') => {
	if (variant === 'success') {
		toast.success(message);
	} else {
		toast.error(message);
	}
};

const ToastNotification = ({ message, variant = 'error', triggerLabel = 'Show toast' }: ToastNotificationProps) => (
	<Button variant={variant === 'error' ? 'destructive' : 'default'} onClick={() => showToast(message, variant)}>
		{triggerLabel}
	</Button>
);

export default ToastNotification;
