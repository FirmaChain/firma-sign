import type { Meta, StoryObj } from '@storybook/react';
import { DateComponent } from './DateComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof DateComponent> = {
	title: 'Components/Editor/Components/DateComponent',
	component: DateComponent,
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
	id: 'date-1',
	type: ComponentType.DATE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 180, height: 40 },
	assigned: {
		email: 'user@example.com',
		name: 'Sarah Johnson',
		color: USER_COLORS[3],
	},
	config: {
		fontSize: 14,
		color: '#000000',
		backgroundColor: '#ffffff',
		required: true,
	},
	created: Date.now(),
};

export const EditorMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.EDITOR,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const FormMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const WithValue: Story = {
	args: {
		component: {
			...sampleComponent,
			value: '2023-12-15',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const PreviewMode: Story = {
	args: {
		component: {
			...sampleComponent,
			value: '2023-12-15',
		},
		viewMode: ViewMode.PREVIEW,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const Required: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				...sampleComponent.config,
				required: true,
			},
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const CustomStyling: Story = {
	args: {
		component: {
			...sampleComponent,
			value: '2023-12-15',
			config: {
				fontSize: 16,
				color: '#7c2d12',
				backgroundColor: '#fef7ed',
			},
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const LargeSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 250, height: 60 },
			value: '2023-12-15',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const SmallSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 120, height: 30 },
			value: '2023-12-15',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};
