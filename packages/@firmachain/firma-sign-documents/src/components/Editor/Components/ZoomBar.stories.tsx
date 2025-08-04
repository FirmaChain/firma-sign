import type { Meta, StoryObj } from '@storybook/react';
import { ZoomBar } from './ZoomBar';

const meta: Meta<typeof ZoomBar> = {
	title: 'Components/Editor/Components/ZoomBar',
	component: ZoomBar,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		displayScale: {
			control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		displayScale: 1,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const ZoomedIn: Story = {
	args: {
		displayScale: 1.5,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const ZoomedOut: Story = {
	args: {
		displayScale: 0.75,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const MinimumZoom: Story = {
	args: {
		displayScale: 0.25,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const MaximumZoom: Story = {
	args: {
		displayScale: 2.5,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const Interactive: Story = {
	args: {
		displayScale: 1,
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
	parameters: {
		docs: {
			description: {
				story: 'Interactive zoom bar - click the + and - buttons to test zoom functionality.',
			},
		},
	},
};
