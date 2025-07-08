import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
	title: 'Components/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: { type: 'select' },
			options: ['primary', 'secondary', 'outline'],
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'md', 'lg'],
		},
		disabled: {
			control: { type: 'boolean' },
		},
		onClick: { action: 'clicked' },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: 'primary',
		children: 'Primary Button',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		children: 'Secondary Button',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
		children: 'Outline Button',
	},
};

export const Small: Story = {
	args: {
		size: 'sm',
		children: 'Small Button',
	},
};

export const Large: Story = {
	args: {
		size: 'lg',
		children: 'Large Button',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'Disabled Button',
	},
};
