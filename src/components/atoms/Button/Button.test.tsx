import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
	it('renders children', () => {
		render(<Button type='button'>Submit</Button>);
		expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
	});

	it('fires click when not disabled', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<Button type='button' onClick={onClick}>
				Go
			</Button>,
		);
		await user.click(screen.getByRole('button', { name: /go/i }));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
