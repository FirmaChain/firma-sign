import type { Meta, StoryObj } from '@storybook/react';
import { ExtraComponent } from './ExtraComponent';
import { ComponentType, ViewMode } from '../types';

const meta: Meta<typeof ExtraComponent> = {
	title: 'Components/Editor/Components/ExtraComponent',
	component: ExtraComponent,
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
	id: 'extra-1',
	type: ComponentType.EXTRA,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 200, height: 100 },
	assigned: {
		email: 'system@editor.com',
		name: 'Drawing Tool',
		color: '#6b7280',
	},
	config: {
		backgroundColor: '#fafafa',
		fontSize: 12,
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

export const WithValue: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Additional notes or custom content',
		},
		viewMode: ViewMode.FORM,
	},
};

export const BlueTheme: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Blue themed extra content',
			config: {
				backgroundColor: '#dbeafe',
				fontSize: 14,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const GreenTheme: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Green themed extra content',
			config: {
				backgroundColor: '#ecfdf5',
				fontSize: 14,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 300, height: 150 },
			value: 'Large extra component with more content space',
			config: {
				backgroundColor: '#f3e8ff',
				fontSize: 16,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#7c3aed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const SmallSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 150, height: 60 },
			value: 'Small extra',
			config: {
				backgroundColor: '#fef3c7',
				fontSize: 10,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#d97706',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LongText: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 350, height: 120 },
			value:
				'This is a longer text content for the extra component to demonstrate how it handles multiline text and wrapping within the dashed border area.',
			config: {
				backgroundColor: '#fdf2f8',
				fontSize: 12,
			},
			assigned: {
				...sampleComponent.assigned,
				color: '#ec4899',
			},
		},
		viewMode: ViewMode.FORM,
	},
};
