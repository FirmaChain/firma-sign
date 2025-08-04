import type { Meta, StoryObj } from '@storybook/react';
import { LoadingComponent } from './LoadingComponent';

const meta: Meta<typeof LoadingComponent> = {
	title: 'Components/Editor/Components/LoadingComponent',
	component: LoadingComponent,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		isLoading: {
			control: { type: 'boolean' },
		},
		message: {
			control: { type: 'text' },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isLoading: true,
		message: 'Loading PDF...',
	},
};

export const CustomMessage: Story = {
	args: {
		isLoading: true,
		message: 'Processing document...',
	},
};

export const NotLoading: Story = {
	args: {
		isLoading: false,
		message: 'Loading PDF...',
	},
};

export const LongMessage: Story = {
	args: {
		isLoading: true,
		message: 'Loading large PDF document, this may take a moment...',
	},
};

export const ShortMessage: Story = {
	args: {
		isLoading: true,
		message: 'Loading...',
	},
};

export const NoMessage: Story = {
	args: {
		isLoading: true,
	},
};
