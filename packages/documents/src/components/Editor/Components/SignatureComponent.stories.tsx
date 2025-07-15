import type { Meta, StoryObj } from '@storybook/react';
import { SignatureComponent } from './SignatureComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof SignatureComponent> = {
	title: 'Components/Editor/Components/SignatureComponent',
	component: SignatureComponent,
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
	id: 'signature-1',
	type: ComponentType.SIGNATURE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 200, height: 80 },
	assigned: {
		email: 'signer@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	config: {
		required: true,
		backgroundColor: '#f8f9ff',
		borderColor: '#3b82f6',
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

export const FormModeUnsigned: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const FormModeSigned: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Signed by John Doe at 12/15/2023, 2:30:45 PM',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const PreviewModeSigned: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'Signed by John Doe at 12/15/2023, 2:30:45 PM',
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
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
			config: {
				backgroundColor: '#ecfdf5',
				borderColor: '#059669',
			},
		},
		viewMode: ViewMode.EDITOR,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const LargeSignature: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 300, height: 120 },
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const SmallSignature: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 150, height: 50 },
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};
