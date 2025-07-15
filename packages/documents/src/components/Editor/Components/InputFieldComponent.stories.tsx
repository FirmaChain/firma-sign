import type { Meta, StoryObj } from '@storybook/react';
import { InputFieldComponent } from './InputFieldComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof InputFieldComponent> = {
	title: 'Components/Editor/Components/InputFieldComponent',
	component: InputFieldComponent,
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
	id: 'input-1',
	type: ComponentType.INPUT_FIELD,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 250, height: 40 },
	assigned: {
		email: 'user@example.com',
		name: 'Jane Smith',
		color: USER_COLORS[1],
	},
	config: {
		fontSize: 14,
		color: '#000000',
		backgroundColor: '#ffffff',
		placeholder: 'Enter your name...',
		maxLength: 100,
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
			value: 'John Doe',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const MultilineTextarea: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 300, height: 120 },
			config: {
				...sampleComponent.config,
				multiline: true,
				placeholder: 'Enter your address...',
			},
			value: 'This is a multiline\ntextarea for longer\ncontent input.',
		},
		viewMode: ViewMode.FORM,
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

export const WithMaxLength: Story = {
	args: {
		component: {
			...sampleComponent,
			config: {
				...sampleComponent.config,
				maxLength: 10,
				placeholder: 'Max 10 chars',
			},
			value: '1234567890',
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
			value: 'Styled input',
			config: {
				fontSize: 16,
				color: '#059669',
				backgroundColor: '#ecfdf5',
				placeholder: 'Green themed input...',
			},
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};
