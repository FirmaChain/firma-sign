import type { Meta, StoryObj } from '@storybook/react';
import { ErrorComponent } from './ErrorComponent';

const meta: Meta<typeof ErrorComponent> = {
	title: 'Components/Editor/Components/ErrorComponent',
	component: ErrorComponent,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		error: {
			control: { type: 'text' },
		},
		currentUrlIndex: {
			control: { type: 'number' },
		},
		totalUrls: {
			control: { type: 'number' },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		error: 'Failed to load PDF',
		currentUrlIndex: 0,
		totalUrls: 1,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const NetworkError: Story = {
	args: {
		error: 'Network error: Unable to connect to server',
		currentUrlIndex: 0,
		totalUrls: 1,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const MultipleUrlsFirstAttempt: Story = {
	args: {
		error: 'Failed to load PDF from primary source',
		currentUrlIndex: 0,
		totalUrls: 3,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const MultipleUrlsSecondAttempt: Story = {
	args: {
		error: 'Failed to load PDF from backup source',
		currentUrlIndex: 1,
		totalUrls: 3,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const AllUrlsExhausted: Story = {
	args: {
		error: 'All sources exhausted, unable to load PDF',
		currentUrlIndex: 2,
		totalUrls: 3,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const PermissionError: Story = {
	args: {
		error: 'Permission denied: You do not have access to this document',
		currentUrlIndex: 0,
		totalUrls: 1,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const FileNotFound: Story = {
	args: {
		error: 'File not found: The requested document does not exist',
		currentUrlIndex: 0,
		totalUrls: 1,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};

export const LongErrorMessage: Story = {
	args: {
		error:
			'An unexpected error occurred while trying to load the PDF document. This could be due to network issues, server problems, or file corruption. Please try again later.',
		currentUrlIndex: 0,
		totalUrls: 1,
		onRetry: () => {
			console.log('Retry button clicked');
		},
	},
};
