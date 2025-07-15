import type { Meta, StoryObj } from '@storybook/react';
import { DocumentComponentWrapper } from './DocumentComponent';
import { ComponentType, ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof DocumentComponentWrapper> = {
	title: 'Components/Editor/DocumentComponent',
	component: DocumentComponentWrapper,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: [ViewMode.EDITOR, ViewMode.FORM, ViewMode.PREVIEW],
		},
		scale: {
			control: { type: 'range', min: 0.1, max: 2, step: 0.1 },
		},
		isSelected: {
			control: { type: 'boolean' },
		},
		isHovered: {
			control: { type: 'boolean' },
		},
	},
	decorators: [
		(Story) => (
			<div className="relative w-full h-screen bg-gray-100 p-8">
				<div className="relative w-full h-full bg-white shadow-lg overflow-hidden">
					<Story />
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleComponent = {
	id: 'sample-component',
	type: ComponentType.TEXT,
	pageNumber: 0,
	position: { x: 100, y: 100 },
	size: { width: 200, height: 60 },
	assigned: {
		email: 'john@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	config: { fontSize: 16 },
	value: 'Sample text content',
	created: Date.now(),
};

const SampleContent: React.FC = () => (
	<div className="w-full h-full border-2 border-gray-300 bg-blue-50 flex items-center justify-center text-sm font-medium text-gray-700">
		Sample Component Content
	</div>
);

export const Default: Story = {
	args: {
		component: sampleComponent,
		isSelected: false,
		isHovered: false,
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onSelect: (id) => {
			console.log('Component selected:', id);
		},
		onDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
		children: <SampleContent />,
	},
};

export const Selected: Story = {
	args: {
		...Default.args,
		isSelected: true,
	},
};

export const Hovered: Story = {
	args: {
		...Default.args,
		isHovered: true,
	},
};

export const SelectedAndHovered: Story = {
	args: {
		...Default.args,
		isSelected: true,
		isHovered: true,
	},
};

export const FormMode: Story = {
	args: {
		...Default.args,
		viewMode: ViewMode.FORM,
	},
};

export const PreviewMode: Story = {
	args: {
		...Default.args,
		viewMode: ViewMode.PREVIEW,
	},
};

export const ScaledUp: Story = {
	args: {
		...Default.args,
		scale: 1.5,
		isSelected: true,
	},
};

export const ScaledDown: Story = {
	args: {
		...Default.args,
		scale: 0.7,
		isSelected: true,
	},
};

export const SmallComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			size: { width: 80, height: 30 },
		},
		isSelected: true,
	},
};

export const LargeComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			size: { width: 400, height: 120 },
		},
		isSelected: true,
	},
};

export const SignatureComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			id: 'signature-component',
			type: ComponentType.SIGNATURE,
			size: { width: 200, height: 80 },
			value: 'John Doe',
			config: { required: true },
		},
		isSelected: true,
		children: (
			<div className="w-full h-full border-2 border-blue-300 bg-blue-50 flex items-center justify-center text-sm font-medium text-blue-700">
				✒️ Signature: John Doe
			</div>
		),
	},
};

export const CheckboxComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			id: 'checkbox-component',
			type: ComponentType.CHECKBOX,
			size: { width: 24, height: 24 },
			value: 'true',
			config: { required: true },
		},
		isSelected: true,
		children: (
			<div className="w-full h-full border-2 border-green-300 bg-green-50 flex items-center justify-center text-sm font-medium text-green-700">
				☑️
			</div>
		),
	},
};

export const InputFieldComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			id: 'input-component',
			type: ComponentType.INPUT_FIELD,
			size: { width: 180, height: 40 },
			value: 'Input text here',
			config: { placeholder: 'Enter text' },
		},
		isSelected: true,
		children: (
			<div className="w-full h-full border-2 border-gray-300 bg-white flex items-center px-2 text-sm text-gray-700">
				Input text here
			</div>
		),
	},
};

export const StampComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			id: 'stamp-component',
			type: ComponentType.STAMP,
			size: { width: 100, height: 100 },
			value: 'APPROVED',
			config: { backgroundColor: '#22c55e', color: '#ffffff' },
		},
		isSelected: true,
		children: (
			<div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
				APPROVED
			</div>
		),
	},
};

export const DateComponent: Story = {
	args: {
		...Default.args,
		component: {
			...sampleComponent,
			id: 'date-component',
			type: ComponentType.DATE,
			size: { width: 120, height: 30 },
			value: '2024-01-15',
			config: { dateFormat: 'YYYY-MM-DD' },
		},
		isSelected: true,
		children: (
			<div className="w-full h-full border-2 border-purple-300 bg-purple-50 flex items-center justify-center text-sm font-medium text-purple-700">
				📅 2024-01-15
			</div>
		),
	},
};

export const MultipleComponents: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 p-8">
			<div className="relative w-full h-full bg-white shadow-lg overflow-hidden">
				<DocumentComponentWrapper
					component={{
						...sampleComponent,
						id: 'comp-1',
						position: { x: 50, y: 50 },
						size: { width: 150, height: 40 },
						assigned: { ...sampleComponent.assigned, color: USER_COLORS[0] },
					}}
					isSelected={true}
					viewMode={ViewMode.EDITOR}
					scale={1}
					onUpdate={(component) => console.log('Updated:', component)}
					onSelect={(id) => console.log('Selected:', id)}
					onDelete={(id) => console.log('Deleted:', id)}
					onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
					onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
				>
					<div className="w-full h-full border-2 border-blue-300 bg-blue-50 flex items-center justify-center text-sm font-medium text-blue-700">
						Selected Component
					</div>
				</DocumentComponentWrapper>

				<DocumentComponentWrapper
					component={{
						...sampleComponent,
						id: 'comp-2',
						position: { x: 250, y: 50 },
						size: { width: 150, height: 40 },
						assigned: { ...sampleComponent.assigned, color: USER_COLORS[1] },
					}}
					isSelected={false}
					isHovered={true}
					viewMode={ViewMode.EDITOR}
					scale={1}
					onUpdate={(component) => console.log('Updated:', component)}
					onSelect={(id) => console.log('Selected:', id)}
					onDelete={(id) => console.log('Deleted:', id)}
					onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
					onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
				>
					<div className="w-full h-full border-2 border-green-300 bg-green-50 flex items-center justify-center text-sm font-medium text-green-700">
						Hovered Component
					</div>
				</DocumentComponentWrapper>

				<DocumentComponentWrapper
					component={{
						...sampleComponent,
						id: 'comp-3',
						position: { x: 50, y: 150 },
						size: { width: 150, height: 40 },
						assigned: { ...sampleComponent.assigned, color: USER_COLORS[2] },
					}}
					isSelected={false}
					isHovered={false}
					viewMode={ViewMode.EDITOR}
					scale={1}
					onUpdate={(component) => console.log('Updated:', component)}
					onSelect={(id) => console.log('Selected:', id)}
					onDelete={(id) => console.log('Deleted:', id)}
					onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
					onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
				>
					<div className="w-full h-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center text-sm font-medium text-gray-700">
						Normal Component
					</div>
				</DocumentComponentWrapper>
			</div>
		</div>
	),
};

export const DifferentViewModes: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 p-8">
			<div className="grid grid-cols-3 gap-4 w-full h-full">
				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Editor Mode
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={true}
						viewMode={ViewMode.EDITOR}
						scale={1}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>

				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Form Mode
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={false}
						viewMode={ViewMode.FORM}
						scale={1}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>

				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Preview Mode
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={false}
						viewMode={ViewMode.PREVIEW}
						scale={1}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>
			</div>
		</div>
	),
};

export const DifferentScales: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 p-8">
			<div className="grid grid-cols-3 gap-4 w-full h-full">
				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Scale: 0.5x
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={true}
						viewMode={ViewMode.EDITOR}
						scale={0.5}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>

				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Scale: 1x
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={true}
						viewMode={ViewMode.EDITOR}
						scale={1}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>

				<div className="relative bg-white shadow-lg overflow-hidden">
					<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
						Scale: 1.5x
					</div>
					<DocumentComponentWrapper
						component={{
							...sampleComponent,
							position: { x: 50, y: 50 },
							size: { width: 150, height: 40 },
						}}
						isSelected={true}
						viewMode={ViewMode.EDITOR}
						scale={1.5}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<SampleContent />
					</DocumentComponentWrapper>
				</div>
			</div>
		</div>
	),
};

export const DifferentAssignees: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 p-8">
			<div className="relative w-full h-full bg-white shadow-lg overflow-hidden">
				{USER_COLORS.slice(0, 5).map((color, index) => (
					<DocumentComponentWrapper
						key={index}
						component={{
							...sampleComponent,
							id: `assignee-${index}`,
							position: { x: 50 + index * 160, y: 50 + index * 20 },
							size: { width: 140, height: 40 },
							assigned: {
								email: `user${index}@example.com`,
								name: `User ${index + 1}`,
								color: color,
							},
						}}
						isSelected={index === 0}
						isHovered={index === 1}
						viewMode={ViewMode.EDITOR}
						scale={1}
						onUpdate={(component) => console.log('Updated:', component)}
						onSelect={(id) => console.log('Selected:', id)}
						onDelete={(id) => console.log('Deleted:', id)}
						onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
						onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
					>
						<div
							className="w-full h-full border-2 flex items-center justify-center text-sm font-medium text-white"
							style={{ backgroundColor: color, borderColor: color }}
						>
							User {index + 1}
						</div>
					</DocumentComponentWrapper>
				))}
			</div>
		</div>
	),
};
