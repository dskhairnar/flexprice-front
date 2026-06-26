import { Button, DecimalUsageInput, Input, Label, Select, SelectOption } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { CREDIT_GRANT_CADENCE, CREDIT_GRANT_EXPIRATION_TYPE, CREDIT_GRANT_PERIOD, CREDIT_GRANT_SCOPE } from '@/models/CreditGrant';
import { InternalCreditGrantRequest } from '@/types/dto/CreditGrant';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { getLocalizedCreditGrantPeriodOptions } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: InternalCreditGrantRequest;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (data: InternalCreditGrantRequest) => void;
	onCancel: () => void;
	getEmptyCreditGrant: () => InternalCreditGrantRequest;
}

interface FormErrors {
	name?: string;
	credits?: string;
	expiration_duration?: string;
	priority?: string;
	expiration_type?: string;
	period?: string;
	conversion_rate?: string;
	topup_conversion_rate?: string;
}

const CreditGrantModal: React.FC<Props> = ({ data, isOpen, onOpenChange, onSave, onCancel, getEmptyCreditGrant }) => {
	const { t, i18n } = useTranslation(['billing', 'common']);
	const isEdit = !!data;

	const expirationTypeOptions: SelectOption[] = useMemo(
		() => [
			{
				label: t('billing:creditGrant.modal.expiration.billingCycle.label'),
				value: CREDIT_GRANT_EXPIRATION_TYPE.BILLING_CYCLE,
				description: t('billing:creditGrant.modal.expiration.billingCycle.description'),
			},
			{
				label: t('billing:creditGrant.modal.expiration.never.label'),
				value: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
				description: t('billing:creditGrant.modal.expiration.never.description'),
			},
		],
		[t, i18n.language],
	);

	const localizedGrantPeriodOptions = useMemo(() => getLocalizedCreditGrantPeriodOptions(t), [t, i18n.language]);

	const [errors, setErrors] = useState<FormErrors>({});
	const [formData, setFormData] = useState<Partial<InternalCreditGrantRequest>>(data || getEmptyCreditGrant());

	// Update formData when data prop changes (for editing) or when modal opens
	useEffect(() => {
		if (isOpen) {
			if (data) {
				// Editing: load the credit grant data
				setFormData(data);
			} else {
				// Adding new: reset to empty credit grant
				setFormData(getEmptyCreditGrant());
			}
			// Clear errors when modal opens
			setErrors({});
		}
	}, [isOpen, data, getEmptyCreditGrant]);

	// Sanitize and validate data before saving
	const sanitizeData = useCallback((data: Partial<InternalCreditGrantRequest>): InternalCreditGrantRequest => {
		// Build sanitized object with required fields explicitly set (not from spread)
		const sanitized: InternalCreditGrantRequest = {
			// Required fields - explicitly set to avoid undefined
			id: data.id || '',
			name: data.name?.trim() || '',
			scope: data.scope || CREDIT_GRANT_SCOPE.PLAN,
			cadence: data.cadence || CREDIT_GRANT_CADENCE.ONETIME,
			credits: Math.max(0, Number(data.credits) || 0),
			// Optional fields
			plan_id: data.plan_id,
			subscription_id: data.subscription_id,
			period: data.period,
			period_count: data.period_count,
			expiration_type: data.expiration_type,
			expiration_duration: data.expiration_duration ? Math.max(1, Math.floor(Number(data.expiration_duration))) : undefined,
			expiration_duration_unit: data.expiration_duration_unit,
			priority: Math.max(0, Math.floor(Number(data.priority) || 0)),
			metadata: data.metadata,
			conversion_rate: data.conversion_rate,
			topup_conversion_rate: data.topup_conversion_rate ?? data.conversion_rate,
		};

		// Remove expiration_duration if not needed
		if (sanitized.expiration_type !== CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { expiration_duration, ...rest } = sanitized;
			return rest as InternalCreditGrantRequest;
		}

		// Remove period if not recurring
		if (sanitized.cadence !== CREDIT_GRANT_CADENCE.RECURRING) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { period, ...rest } = sanitized;
			return rest as InternalCreditGrantRequest;
		}

		return sanitized;
	}, []);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		// Validate name
		if (!formData.name?.trim()) {
			newErrors.name = t('billing:creditGrant.modal.validation.nameRequired');
		}

		// Validate credits
		const credits = Number(formData.credits);
		if (!formData.credits || isNaN(credits) || credits <= 0) {
			newErrors.credits = t('billing:creditGrant.modal.validation.creditsPositive');
		}

		// Validate expiration type
		if (!formData.expiration_type) {
			newErrors.expiration_type = t('billing:creditGrant.modal.validation.expirationTypeRequired');
		}

		// Validate expiration duration (only when expiration type is DURATION)
		if (formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
			const duration = Number(formData.expiration_duration);
			if (!formData.expiration_duration || isNaN(duration) || duration <= 0) {
				newErrors.expiration_duration = t('billing:creditGrant.modal.validation.expirationDurationPositive');
			}
		}

		// Validate period (only for recurring credits)
		if (formData.cadence === CREDIT_GRANT_CADENCE.RECURRING && !formData.period) {
			newErrors.period = t('billing:creditGrant.modal.validation.periodRequired');
		}

		// Validate priority
		const priority = Number(formData.priority);
		if (formData.priority !== undefined && formData.priority !== null && (isNaN(priority) || priority < 0)) {
			newErrors.priority = t('billing:creditGrant.modal.validation.priorityNonNegative');
		}

		// Validate conversion_rate if provided
		if (formData.conversion_rate !== undefined && formData.conversion_rate !== null) {
			const conversionRate = Number(formData.conversion_rate);
			if (isNaN(conversionRate) || conversionRate <= 0) {
				newErrors.conversion_rate = t('billing:creditGrant.modal.validation.conversionRatePositive');
			}
		}

		// Validate topup_conversion_rate if provided
		if (formData.topup_conversion_rate !== undefined && formData.topup_conversion_rate !== null) {
			const topupConversionRate = Number(formData.topup_conversion_rate);
			if (isNaN(topupConversionRate) || topupConversionRate <= 0) {
				newErrors.topup_conversion_rate = t('billing:creditGrant.modal.validation.topupConversionRatePositive');
			}
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData, t]);

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		// Clear errors and sanitize data before saving
		setErrors({});
		const sanitizedData = sanitizeData(formData);

		onSave(sanitizedData);
		setFormData(getEmptyCreditGrant());
		onOpenChange(false);
	}, [formData, validateForm, sanitizeData, onSave, getEmptyCreditGrant, onOpenChange]);

	const handleCancel = useCallback(() => {
		setFormData(data || getEmptyCreditGrant());
		setErrors({});
		onCancel();
	}, [data, getEmptyCreditGrant, onCancel]);

	const handleFieldChange = useCallback(
		(
			field: keyof InternalCreditGrantRequest,
			value: string | number | CREDIT_GRANT_CADENCE | CREDIT_GRANT_EXPIRATION_TYPE | CREDIT_GRANT_PERIOD | CREDIT_GRANT_SCOPE | undefined,
		) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			// Clear error for this field when user starts typing
			if (errors[field as keyof FormErrors]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors],
	);

	const billingCadenceOptions: RectangleRadiogroupOption[] = useMemo(() => {
		return [
			{
				label: t('billing:creditGrant.modal.cadence.onetime.label'),
				value: CREDIT_GRANT_CADENCE.ONETIME,
				description: t('billing:creditGrant.modal.cadence.onetime.description'),
			},
			{
				label: t('billing:creditGrant.modal.cadence.recurring.label'),
				value: CREDIT_GRANT_CADENCE.RECURRING,
				description: t('billing:creditGrant.modal.cadence.recurring.description'),
			},
		];
	}, [t, i18n.language]);

	const selectedCadenceDescription = useMemo(() => {
		return billingCadenceOptions.find((option) => option.value === formData.cadence)?.description;
	}, [billingCadenceOptions, formData.cadence]);

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={isEdit ? t('billing:creditGrant.modal.titleEdit') : t('billing:creditGrant.modal.titleAdd')}
			className='sm:max-w-[600px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2 !mb-6'>
					<Label label={t('billing:creditGrant.modal.creditType')} />
					<RectangleRadiogroup
						options={billingCadenceOptions.map((option) => ({
							...option,
							description: undefined,
						}))}
						value={formData.cadence}
						onChange={(value) => handleFieldChange('cadence', value as CREDIT_GRANT_CADENCE)}
					/>
					{selectedCadenceDescription && <p className='text-sm text-gray-500'>{selectedCadenceDescription}</p>}
				</div>

				<div className='space-y-2'>
					<Label label={t('billing:creditGrant.modal.creditName')} />
					<Input
						placeholder={t('billing:creditGrant.modal.creditNamePlaceholder')}
						value={formData.name || ''}
						onChange={(value) => handleFieldChange('name', value)}
						error={errors.name}
					/>
				</div>

				<div className='space-y-2'>
					<Label label={t('billing:creditGrant.modal.credits')} />
					<Input
						error={errors.credits}
						placeholder={t('billing:creditGrant.modal.creditsPlaceholder')}
						variant='number'
						formatOptions={{
							allowDecimals: true,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.credits?.toString() || ''}
						onChange={(value) => handleFieldChange('credits', value)}
					/>
				</div>

				{/* Conversion Rate */}
				<div className='flex flex-col items-start gap-2 w-full'>
					<label className={cn('block text-sm font-medium', 'text-zinc-950')}>{t('billing:creditGrant.modal.conversionRate')}</label>
					<div className='flex items-center gap-2 w-full'>
						<Input className='w-full' value={'1'} disabled suffix={t('billing:creditGrant.modal.suffixCredit')} />
						<span>=</span>
						<DecimalUsageInput
							className='w-full'
							value={formData.conversion_rate?.toString() || ''}
							onChange={(value) => handleFieldChange('conversion_rate', value)}
						/>
					</div>
					<p className='text-sm text-muted-foreground'>{t('billing:creditGrant.modal.conversionRateHint')}</p>
					{errors.conversion_rate && <p className='text-sm text-destructive'>{errors.conversion_rate}</p>}
				</div>

				{/* Top-up Conversion Rate */}
				<div className='flex flex-col items-start gap-2 w-full'>
					<label className={cn('block text-sm font-medium', 'text-zinc-950')}>{t('billing:creditGrant.modal.topupConversionRate')}</label>
					<div className='flex items-center gap-2 w-full'>
						<Input className='w-full' value={'1'} disabled suffix={t('billing:creditGrant.modal.suffixCredit')} />
						<span>=</span>
						<DecimalUsageInput
							className='w-full'
							value={formData.topup_conversion_rate?.toString() || formData.conversion_rate?.toString() || ''}
							onChange={(value) => handleFieldChange('topup_conversion_rate', value)}
						/>
					</div>
					<p className='text-sm text-muted-foreground'>{t('billing:creditGrant.modal.topupConversionRateHint')}</p>
					{errors.topup_conversion_rate && <p className='text-sm text-destructive'>{errors.topup_conversion_rate}</p>}
				</div>

				{formData.cadence === CREDIT_GRANT_CADENCE.RECURRING && (
					<div className='space-y-2'>
						<Label label={t('billing:creditGrant.modal.grantPeriod')} />
						<Select
							error={errors.period}
							options={localizedGrantPeriodOptions}
							value={formData.period}
							onChange={(value) => handleFieldChange('period', value as CREDIT_GRANT_PERIOD)}
						/>
					</div>
				)}

				<div className='space-y-2'>
					<Label label={t('billing:creditGrant.modal.expiryType')} />
					<Select
						error={errors.expiration_type}
						options={expirationTypeOptions}
						value={formData.expiration_type}
						onChange={(value) => handleFieldChange('expiration_type', value as CREDIT_GRANT_EXPIRATION_TYPE)}
					/>
				</div>

				{formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION && (
					<div className='space-y-2'>
						<Label label={t('billing:creditGrant.modal.expiryDays')} />
						<Input
							error={errors.expiration_duration}
							placeholder={t('billing:creditGrant.modal.expiryDaysPlaceholder')}
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							suffix={t('billing:creditGrant.modal.suffixDays')}
							value={formData.expiration_duration?.toString() || ''}
							onChange={(value) => handleFieldChange('expiration_duration', parseInt(value) || undefined)}
						/>
					</div>
				)}

				<div className='space-y-2'>
					<Label label={t('billing:creditGrant.modal.priority')} />
					<Input
						error={errors.priority}
						placeholder={t('billing:creditGrant.modal.priorityPlaceholder')}
						variant='formatted-number'
						formatOptions={{
							allowDecimals: false,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.priority?.toString() || ''}
						onChange={(value) => handleFieldChange('priority', parseInt(value) || 0)}
					/>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					{t('billing:creditGrant.modal.cancel')}
				</Button>
				<Button onClick={handleSave}>
					{isEdit ? t('billing:creditGrant.modal.saveChanges') : t('billing:creditGrant.modal.addCredit')}
				</Button>
			</div>
		</Dialog>
	);
};

export default CreditGrantModal;
