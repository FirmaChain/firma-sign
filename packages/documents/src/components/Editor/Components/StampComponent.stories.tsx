import type { Meta, StoryObj } from '@storybook/react';
import { StampComponent } from './StampComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof StampComponent> = {
	title: 'Components/Editor/Components/StampComponent',
	component: StampComponent,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: [ViewMode.EDITOR, ViewMode.FORM, ViewMode.PREVIEW],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleComponent = {
	id: 'stamp-1',
	type: ComponentType.STAMP,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 80, height: 80 },
	assigned: {
		email: 'approver@example.com',
		name: 'Manager',
		color: '#3b82f6',
	},
	config: {
		color: '#3b82f6',
		backgroundColor: '#f0f9ff',
	},
	created: Date.now(),
};

export const EditorMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.EDITOR,
	},
};

export const FormMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.FORM,
	},
};

export const PreviewMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
	},
};

export const GreenStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
			config: {
				color: '#059669',
				backgroundColor: '#ecfdf5',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const RedStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#dc2626',
			},
			config: {
				color: '#dc2626',
				backgroundColor: '#fef2f2',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 120, height: 120 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const SmallStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 50, height: 50 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const OrangeStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#ea580c',
			},
			config: {
				color: '#ea580c',
				backgroundColor: '#fff7ed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};
