import { Button, Tooltip } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

interface SettingsFormActionsProps {
	onReset: () => void;
	onSave: () => void;
	isSaving?: boolean;
	disabled?: boolean;
	/** Tooltip shown on hover/focus when `disabled` is true — e.g. explaining a missing RBAC/Super Admin requirement. */
	disabledReason?: string;
}

const SettingsFormActions = ({ onReset, onSave, isSaving, disabled, disabledReason }: SettingsFormActionsProps) => {
	const { t } = useTranslation(['settings', 'common']);

	const saveButton = (
		<Button onClick={onSave} isLoading={isSaving} disabled={disabled}>
			{t('common:actions.save')}
		</Button>
	);

	return (
		<div className='mt-8 flex justify-end gap-2'>
			<Button variant='outline' onClick={onReset} disabled={disabled || isSaving}>
				{t('billing.actions.resetToDefaults')}
			</Button>
			{disabled && disabledReason ? (
				<Tooltip content={disabledReason}>
					<span tabIndex={0} className='inline-block'>
						{saveButton}
					</span>
				</Tooltip>
			) : (
				saveButton
			)}
		</div>
	);
};

export default SettingsFormActions;
