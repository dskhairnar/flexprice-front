import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import DatePicker from './DatePicker';
import commonEn from '@/i18n/locales/en/common.json';

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;

const CLEAR_LABEL = commonEn.dateTime.clear;

describe('DatePicker clear button', () => {
	it('is not rendered when clearable is not set', () => {
		render(
			<TestWrapper>
				<DatePicker date={new Date(2026, 0, 15)} setDate={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.queryByLabelText(CLEAR_LABEL)).not.toBeInTheDocument();
	});

	it('is not rendered when clearable is set but no date is selected', () => {
		render(
			<TestWrapper>
				<DatePicker date={undefined} setDate={vi.fn()} clearable />
			</TestWrapper>,
		);

		expect(screen.queryByLabelText(CLEAR_LABEL)).not.toBeInTheDocument();
	});

	it('is not rendered when the picker is disabled', () => {
		render(
			<TestWrapper>
				<DatePicker date={new Date(2026, 0, 15)} setDate={vi.fn()} clearable disabled />
			</TestWrapper>,
		);

		expect(screen.queryByLabelText(CLEAR_LABEL)).not.toBeInTheDocument();
	});

	it('resets the date to undefined when clicked', () => {
		const setDate = vi.fn();
		render(
			<TestWrapper>
				<DatePicker date={new Date(2026, 0, 15)} setDate={setDate} clearable />
			</TestWrapper>,
		);

		fireEvent.click(screen.getByLabelText(CLEAR_LABEL));

		expect(setDate).toHaveBeenCalledTimes(1);
		expect(setDate).toHaveBeenCalledWith(undefined);
	});

	it('does not open the calendar popover when clicked', () => {
		render(
			<TestWrapper>
				<DatePicker date={new Date(2026, 0, 15)} setDate={vi.fn()} clearable />
			</TestWrapper>,
		);

		fireEvent.click(screen.getByLabelText(CLEAR_LABEL));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('grid')).not.toBeInTheDocument();
	});
});
