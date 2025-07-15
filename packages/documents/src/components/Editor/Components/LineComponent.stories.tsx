import type { Meta, StoryObj } from '@storybook/react';
import { LineComponent } from './LineComponent';
import { ComponentType, ViewMode } from '../types';

const meta: Meta<typeof LineComponent> = {
	title: 'Components/Editor/Components/LineComponent',
	component: LineComponent,
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
	id: 'line-1',
	type: ComponentType.LINE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 200, height: 4 },
	assigned: {
		email: 'system@editor.com',
		name: 'Drawing Tool',
		color: '#6b7280',
	},
	config: {
		borderWidth: 2,
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

export const ThickLine: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				borderWidth: 5,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#dc2626',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const ThinLine: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				borderWidth: 1,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#6b7280',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const BlueLine: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				borderWidth: 3,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const GreenLine: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				borderWidth: 3,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const ShortLine: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 100, height: 4 },
			config: {
				borderWidth: 2,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#d97706',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LongLine: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 400, height: 4 },
			config: {
				borderWidth: 2,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#7c3aed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};
