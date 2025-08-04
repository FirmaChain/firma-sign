import type { Meta, StoryObj } from '@storybook/react';
import { ComponentFactory } from './ComponentFactory';
import { ComponentType, ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof ComponentFactory> = {
	title: 'Components/Editor/ComponentFactory',
	component: ComponentFactory,
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

const baseComponentProps = {
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 150, height: 40 },
	assigned: {
		email: 'user@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	created: Date.now(),
};

export const TextComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'text-1',
			type: ComponentType.TEXT,
			value: 'Sample text content',
			config: { fontSize: 14 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const SignatureComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'signature-1',
			type: ComponentType.SIGNATURE,
			value: 'John Doe',
			config: { required: true },
		},
		viewMode: ViewMode.FORM,
	},
};

export const CheckboxComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'checkbox-1',
			type: ComponentType.CHECKBOX,
			size: { width: 20, height: 20 },
			value: 'true',
			config: { required: true },
		},
		viewMode: ViewMode.FORM,
	},
};

export const InputFieldComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'input-1',
			type: ComponentType.INPUT_FIELD,
			value: 'Input field value',
			config: { placeholder: 'Enter text here' },
		},
		viewMode: ViewMode.FORM,
	},
};

export const StampComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'stamp-1',
			type: ComponentType.STAMP,
			size: { width: 80, height: 80 },
			value: 'APPROVED',
			config: {
				backgroundColor: '#22c55e',
				color: '#ffffff',
				borderRadius: 50,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const CheckmarkComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'checkmark-1',
			type: ComponentType.CHECKMARK,
			size: { width: 30, height: 30 },
			value: 'true',
			config: { color: '#22c55e' },
		},
		viewMode: ViewMode.FORM,
	},
};

export const DateComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'date-1',
			type: ComponentType.DATE,
			value: '2024-01-15',
			config: {
				dateFormat: 'YYYY-MM-DD',
				required: true,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const ExtraComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'extra-1',
			type: ComponentType.EXTRA,
			size: { width: 200, height: 100 },
			value: 'Extra content area',
			config: {
				backgroundColor: '#f3f4f6',
				fontSize: 12,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const RectangleComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'rectangle-1',
			type: ComponentType.RECTANGLE,
			size: { width: 100, height: 60 },
			config: {
				backgroundColor: '#3b82f6',
				borderColor: '#1d4ed8',
				borderWidth: 2,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const CircleComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'circle-1',
			type: ComponentType.CIRCLE,
			size: { width: 60, height: 60 },
			config: {
				backgroundColor: '#ef4444',
				borderColor: '#dc2626',
				borderWidth: 2,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LineComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'line-1',
			type: ComponentType.LINE,
			size: { width: 200, height: 4 },
			config: {
				backgroundColor: '#374151',
				borderWidth: 0,
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const UnknownComponent: Story = {
	args: {
		component: {
			...baseComponentProps,
			id: 'unknown-1',
			type: 'UNKNOWN_TYPE' as ComponentType,
			size: { width: 200, height: 50 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const AllComponentsPreview: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4 p-4">
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Text</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'text-demo',
						type: ComponentType.TEXT,
						value: 'Sample text',
						config: { fontSize: 12 },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Signature</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'signature-demo',
						type: ComponentType.SIGNATURE,
						value: 'John Doe',
						size: { width: 120, height: 35 },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Checkbox</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'checkbox-demo',
						type: ComponentType.CHECKBOX,
						size: { width: 20, height: 20 },
						value: 'true',
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Input Field</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'input-demo',
						type: ComponentType.INPUT_FIELD,
						value: 'Input value',
						size: { width: 120, height: 30 },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Stamp</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'stamp-demo',
						type: ComponentType.STAMP,
						size: { width: 60, height: 60 },
						value: 'APPROVED',
						config: { backgroundColor: '#22c55e', color: '#ffffff' },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Date</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'date-demo',
						type: ComponentType.DATE,
						value: '2024-01-15',
						size: { width: 100, height: 30 },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
		</div>
	),
};

export const EditorModeComparison: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4 p-4">
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Editor Mode</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'editor-mode',
						type: ComponentType.TEXT,
						value: 'Sample text',
						config: { fontSize: 14 },
					}}
					viewMode={ViewMode.EDITOR}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Form Mode</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'form-mode',
						type: ComponentType.TEXT,
						value: 'Sample text',
						config: { fontSize: 14 },
					}}
					viewMode={ViewMode.FORM}
				/>
			</div>
			<div className="border p-2">
				<h3 className="text-sm font-medium mb-2">Preview Mode</h3>
				<ComponentFactory
					component={{
						...baseComponentProps,
						id: 'preview-mode',
						type: ComponentType.TEXT,
						value: 'Sample text',
						config: { fontSize: 14 },
					}}
					viewMode={ViewMode.PREVIEW}
				/>
			</div>
		</div>
	),
};
