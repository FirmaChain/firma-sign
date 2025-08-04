import type { Meta, StoryObj } from '@storybook/react';
import { RectangleComponent } from './RectangleComponent';
import { ComponentType, ViewMode } from '../types';

const meta: Meta<typeof RectangleComponent> = {
	title: 'Components/Editor/Components/RectangleComponent',
	component: RectangleComponent,
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
	id: 'rectangle-1',
	type: ComponentType.RECTANGLE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 150, height: 100 },
	assigned: {
		email: 'system@editor.com',
		name: 'Drawing Tool',
		color: '#6b7280',
	},
	config: {
		backgroundColor: 'transparent',
		borderWidth: 2,
		borderRadius: 0,
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

export const FilledRectangle: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				backgroundColor: '#dbeafe',
				borderWidth: 2,
				borderRadius: 0,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const RoundedRectangle: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				backgroundColor: '#ecfdf5',
				borderWidth: 2,
				borderRadius: 8,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const ThickBorder: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				backgroundColor: 'transparent',
				borderWidth: 5,
				borderRadius: 0,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#dc2626',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const Square: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 100, height: 100 },
			config: {
				backgroundColor: '#fef3c7',
				borderWidth: 2,
				borderRadius: 4,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#d97706',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeRectangle: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 300, height: 200 },
			config: {
				backgroundColor: '#f3e8ff',
				borderWidth: 3,
				borderRadius: 12,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#7c3aed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};
