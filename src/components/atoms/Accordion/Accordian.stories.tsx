import type { Meta } from '@storybook/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.';

const meta = {
	title: 'Flexprice/Atoms/Accordion',
} satisfies Meta;

export default meta;

export const Default = {
	render: () => (
		<Accordion type='single' collapsible className='w-[420px] rounded-md border px-4'>
			<AccordionItem value='billing'>
				<AccordionTrigger>Billing details</AccordionTrigger>
				<AccordionContent>Configure invoice cadence, payment collection, and grace periods.</AccordionContent>
			</AccordionItem>
			<AccordionItem value='usage'>
				<AccordionTrigger>Usage tracking</AccordionTrigger>
				<AccordionContent>Meter events can be aggregated in real time for usage based plans.</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};
