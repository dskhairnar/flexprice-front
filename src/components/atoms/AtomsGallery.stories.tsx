import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import {
	Button,
	Card,
	CardHeader,
	Checkbox,
	CheckboxRadioGroup,
	Chip,
	Combobox,
	Divider,
	FormHeader,
	Input,
	Label,
	NoDataCard,
	Progress,
	RadioGroup,
	SectionHeader,
	Select,
	Spacer,
	Spinner,
	Stepper,
	Textarea,
	Toggle,
	Tooltip,
} from '@/components/atoms';
import type { RadioMenuItem } from '@/components/atoms';

const meta = {
	title: 'Flexprice/Atoms/Atoms Gallery',
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const planOptions = [
	{ value: 'starter', label: 'Starter' },
	{ value: 'growth', label: 'Growth' },
	{ value: 'scale', label: 'Scale' },
];

export const Controls: Story = {
	render: function ControlsStory() {
		const [checked, setChecked] = useState(true);
		const [toggle, setToggle] = useState(true);
		const [plan, setPlan] = useState('growth');
		const [radio, setRadio] = useState<RadioMenuItem>({
			value: 'api',
			label: 'API calls',
			description: 'Meter successful requests',
		});
		const [combobox, setCombobox] = useState('growth');

		return (
			<div className='grid max-w-5xl gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader title='Inputs' subtitle='Common form atoms' />
					<div className='space-y-4'>
						<Input label='Customer name' value='Acme Inc.' onChange={() => {}} />
						<Textarea label='Internal note' value='Renewal starts next quarter.' onChange={() => {}} />
						<Select label='Plan' options={planOptions} value={plan} onChange={setPlan} />
						<Combobox options={planOptions} value={combobox} onChange={setCombobox} width='100%' />
					</div>
				</Card>

				<Card>
					<CardHeader title='Choice controls' subtitle='Boolean and option selection' />
					<div className='space-y-5'>
						<Checkbox
							checked={checked}
							onCheckedChange={setChecked}
							label='Send invoice email'
							description='Notify the customer on issue.'
						/>
						<Toggle
							checked={toggle}
							onChange={setToggle}
							label='Auto collection'
							description='Charge saved payment methods automatically.'
						/>
						<RadioGroup
							title='Usage metric'
							items={[
								{ value: 'api', label: 'API calls', description: 'Meter successful requests' },
								{ value: 'seat', label: 'Seats', description: 'Bill active users' },
							]}
							selected={radio}
							onChange={setRadio}
						/>
						<CheckboxRadioGroup
							title='Billing cadence'
							checkboxItems={[
								{ value: 'monthly', label: 'Monthly', description: 'Invoice every month' },
								{ value: 'annual', label: 'Annual', description: 'Invoice once per year' },
							]}
							value='monthly'
							onChange={() => {}}
						/>
					</div>
				</Card>
			</div>
		);
	},
};

export const Display: Story = {
	render: () => (
		<div className='max-w-5xl space-y-6'>
			<SectionHeader title='Subscription summary' subtitle='Reusable display atoms for dense product screens' />
			<div className='flex flex-wrap items-center gap-3'>
				<Chip label='Active' variant='success' icon={<CheckCircle2 className='size-4' />} />
				<Chip label='Past due' variant='warning' />
				<Chip label='Failed' variant='failed' />
				<Tooltip content='This value updates after the next invoice is finalized.'>
					<Button variant='outline'>Projected MRR</Button>
				</Tooltip>
				<Spinner size={20} className='text-primary' />
			</div>
			<Divider />
			<Card variant='notched' notchColor='primary'>
				<FormHeader
					title='Usage included'
					subtitle='10,000 included events with overage pricing after the threshold.'
					variant='form-component-title'
				/>
				<Spacer height='16px' />
				<Progress value={68} />
			</Card>
			<NoDataCard
				title='No payment methods'
				subtitle='Add a card before enabling automatic collection.'
				cta={<Button prefixIcon={<CreditCard className='size-4' />}>Add card</Button>}
			/>
			<Stepper steps={[{ label: 'Plan' }, { label: 'Pricing' }, { label: 'Review' }]} activeStep={1} />
			<Label label='Field label' />
		</div>
	),
};
