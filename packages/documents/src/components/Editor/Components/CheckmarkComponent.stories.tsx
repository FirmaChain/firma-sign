import type { Meta, StoryObj } from '@storybook/react';
import { CheckmarkComponent } from './CheckmarkComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof CheckmarkComponent> = {
	title: 'Components/Editor/Components/CheckmarkComponent',
	component: CheckmarkComponent,
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
	id: 'checkmark-1',
	type: ComponentType.CHECKMARK,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 30, height: 30 },
	assigned: {
		email: 'system@editor.com',
		name: 'System',
		color: '#10b981',
	},
	config: {
		color: '#10b981',
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

export const CustomColor: Story = {
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

export const BlueTheme: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
			},
			config: {
				color: '#2563eb',
				backgroundColor: '#dbeafe',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 60, height: 60 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const SmallSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 16, height: 16 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const OrangeTheme: Story = {
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
