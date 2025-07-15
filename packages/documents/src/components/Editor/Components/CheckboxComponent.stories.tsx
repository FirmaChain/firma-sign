import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxComponent } from './CheckboxComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof CheckboxComponent> = {
	title: 'Components/Editor/Components/CheckboxComponent',
	component: CheckboxComponent,
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
	id: 'checkbox-1',
	type: ComponentType.CHECKBOX,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 20, height: 20 },
	assigned: {
		email: 'user@example.com',
		name: 'Mike Wilson',
		color: USER_COLORS[2],
	},
	config: {
		required: true,
		backgroundColor: '#ffffff',
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

export const Checked: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'true',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const Unchecked: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'false',
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

export const LargeSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 40, height: 40 },
			value: 'true',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
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
			value: 'true',
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
			value: 'true',
		},
		viewMode: ViewMode.PREVIEW,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};
