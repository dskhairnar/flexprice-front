import type { Decorator } from '@storybook/react';
import AppToaster from './AppToaster';

export const withAppToaster: Decorator = (Story) => (
	<div className='flex min-h-[320px] items-center justify-center p-8'>
		<Story />
		<AppToaster />
	</div>
);
