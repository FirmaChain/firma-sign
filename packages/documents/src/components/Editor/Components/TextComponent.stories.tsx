import type { Meta, StoryObj } from '@storybook/react';
import { TextComponent } from './TextComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof TextComponent> = {
	title: 'Components/Editor/Components/TextComponent',
	component: TextComponent,
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
	id: 'text-1',
	type: ComponentType.TEXT,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 200, height: 40 },
	assigned: {
		email: 'user@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	config: {
		fontSize: 14,
		color: '#000000',
		backgroundColor: '#ffffff',
		placeholder: 'Enter text...',
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
			value: 'Sample text content',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const Selected: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.EDITOR,
		isSelected: true,
		isHovered: false,
		scale: 1,
	},
};

export const Hovered: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.EDITOR,
		isSelected: false,
		isHovered: true,
		scale: 1,
	},
};

export const PreviewMode: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Final text content',
		},
		viewMode: ViewMode.PREVIEW,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const CustomStyling: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Styled text',
			config: {
				fontSize: 18,
				color: '#2563eb',
				backgroundColor: '#dbeafe',
				placeholder: 'Enter styled text...',
			},
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const Scaled: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Scaled text',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1.5,
	},
};
