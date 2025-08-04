import type { Meta, StoryObj } from '@storybook/react';
import { CircleComponent } from './CircleComponent';
import { ComponentType, ViewMode } from '../types';

const meta: Meta<typeof CircleComponent> = {
	title: 'Components/Editor/Components/CircleComponent',
	component: CircleComponent,
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
	id: 'circle-1',
	type: ComponentType.CIRCLE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 100, height: 100 },
	assigned: {
		email: 'system@editor.com',
		name: 'Drawing Tool',
		color: '#6b7280',
	},
	config: {
		backgroundColor: 'transparent',
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

export const FilledCircle: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				backgroundColor: '#dbeafe',
				borderWidth: 2,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
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
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#dc2626',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const GreenCircle: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				backgroundColor: '#ecfdf5',
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

export const SmallCircle: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 50, height: 50 },
			config: {
				backgroundColor: '#fef3c7',
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

export const LargeCircle: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 150, height: 150 },
			config: {
				backgroundColor: '#f3e8ff',
				borderWidth: 4,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#7c3aed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const Oval: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 160, height: 80 },
			config: {
				backgroundColor: '#fdf2f8',
				borderWidth: 2,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#ec4899',
			},
		},
		viewMode: ViewMode.FORM,
	},
};
