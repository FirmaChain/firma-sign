import type { Meta, StoryObj } from '@storybook/react';
import { DocumentLayer } from './DocumentLayer';
import { ComponentType, ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof DocumentLayer> = {
	title: 'Components/Editor/DocumentLayer',
	component: DocumentLayer,
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
		pageNumber: {
			control: { type: 'number' },
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

const sampleComponents = [
	{
		id: 'comp-1',
		type: ComponentType.SIGNATURE,
		pageNumber: 0,
		position: { x: 100, y: 100 },
		size: { width: 150, height: 60 },
		assigned: {
			email: 'john@example.com',
			name: 'John Doe',
			color: USER_COLORS[0],
		},
		config: { required: true },
		value: 'John Doe',
		created: Date.now() - 5000,
	},
	{
		id: 'comp-2',
		type: ComponentType.TEXT,
		pageNumber: 0,
		position: { x: 300, y: 150 },
		size: { width: 120, height: 30 },
		assigned: {
			email: 'jane@example.com',
			name: 'Jane Smith',
			color: USER_COLORS[1],
		},
		config: { fontSize: 14 },
		value: 'Sample text',
		created: Date.now() - 4000,
	},
	{
		id: 'comp-3',
		type: ComponentType.CHECKBOX,
		pageNumber: 0,
		position: { x: 200, y: 200 },
		size: { width: 20, height: 20 },
		assigned: {
			email: 'mike@example.com',
			name: 'Mike Wilson',
			color: USER_COLORS[2],
		},
		config: { required: true },
		value: 'true',
		created: Date.now() - 3000,
	},
	{
		id: 'comp-4',
		type: ComponentType.INPUT_FIELD,
		pageNumber: 1,
		position: { x: 150, y: 100 },
		size: { width: 180, height: 35 },
		assigned: {
			email: 'sarah@example.com',
			name: 'Sarah Johnson',
			color: USER_COLORS[3],
		},
		config: { required: true, placeholder: 'Enter name' },
		value: '',
		created: Date.now() - 2000,
	},
	{
		id: 'comp-5',
		type: ComponentType.STAMP,
		pageNumber: 0,
		position: { x: 400, y: 80 },
		size: { width: 80, height: 80 },
		assigned: {
			email: 'admin@example.com',
			name: 'Admin',
			color: USER_COLORS[4],
		},
		config: { backgroundColor: '#22c55e', color: '#ffffff' },
		value: 'APPROVED',
		created: Date.now() - 1000,
	},
	{
		id: 'comp-6',
		type: ComponentType.RECTANGLE,
		pageNumber: 0,
		position: { x: 50, y: 300 },
		size: { width: 100, height: 60 },
		assigned: {
			email: 'designer@example.com',
			name: 'Designer',
			color: USER_COLORS[5],
		},
		config: { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' },
		created: Date.now() - 500,
	},
	{
		id: 'comp-7',
		type: ComponentType.CIRCLE,
		pageNumber: 1,
		position: { x: 300, y: 200 },
		size: { width: 60, height: 60 },
		assigned: {
			email: 'designer@example.com',
			name: 'Designer',
			color: USER_COLORS[5],
		},
		config: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
		created: Date.now() - 100,
	},
];

export const Page0WithComponents: Story = {
	args: {
		pageNumber: 0,
		components: sampleComponents,
		selectedComponentId: 'comp-1',
		hoveredComponentId: 'comp-2',
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentSelect: (id) => {
			console.log('Component selected:', id);
		},
		onComponentDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onComponentHover: (id) => {
			console.log('Component hovered:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
	},
};

export const Page1WithComponents: Story = {
	args: {
		...Page0WithComponents.args,
		pageNumber: 1,
		selectedComponentId: 'comp-4',
		hoveredComponentId: 'comp-7',
	},
};

export const EmptyPage: Story = {
	args: {
		pageNumber: 0,
		components: [],
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentSelect: (id) => {
			console.log('Component selected:', id);
		},
		onComponentDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onComponentHover: (id) => {
			console.log('Component hovered:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
	},
};

export const FormMode: Story = {
	args: {
		...Page0WithComponents.args,
		viewMode: ViewMode.FORM,
		selectedComponentId: undefined,
		hoveredComponentId: undefined,
	},
};

export const PreviewMode: Story = {
	args: {
		...Page0WithComponents.args,
		viewMode: ViewMode.PREVIEW,
		selectedComponentId: undefined,
		hoveredComponentId: undefined,
	},
};

export const ScaledDown: Story = {
	args: {
		...Page0WithComponents.args,
		scale: 0.6,
	},
};

export const ScaledUp: Story = {
	args: {
		...Page0WithComponents.args,
		scale: 1.4,
	},
};

export const ManyComponents: Story = {
	args: {
		pageNumber: 0,
		components: [
			...sampleComponents.filter((comp) => comp.pageNumber === 0),
			...Array.from({ length: 15 }, (_, i) => ({
				id: `grid-${i}`,
				type: ComponentType.TEXT,
				pageNumber: 0,
				position: { x: 50 + (i % 5) * 100, y: 400 + Math.floor(i / 5) * 50 },
				size: { width: 80, height: 30 },
				assigned: {
					email: `user${i}@example.com`,
					name: `User ${i}`,
					color: USER_COLORS[i % USER_COLORS.length],
				},
				config: { fontSize: 12 },
				value: `Text ${i}`,
				created: Date.now() - (15 - i) * 100,
			})),
		],
		selectedComponentId: 'grid-5',
		hoveredComponentId: 'grid-10',
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentSelect: (id) => {
			console.log('Component selected:', id);
		},
		onComponentDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onComponentHover: (id) => {
			console.log('Component hovered:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
	},
};

export const LayeredComponents: Story = {
	args: {
		pageNumber: 0,
		components: [
			{
				id: 'background',
				type: ComponentType.RECTANGLE,
				pageNumber: 0,
				position: { x: 100, y: 100 },
				size: { width: 300, height: 200 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[0],
				},
				config: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
				created: Date.now() - 5000,
			},
			{
				id: 'middle',
				type: ComponentType.CIRCLE,
				pageNumber: 0,
				position: { x: 200, y: 150 },
				size: { width: 100, height: 100 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[1],
				},
				config: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
				created: Date.now() - 3000,
			},
			{
				id: 'foreground',
				type: ComponentType.TEXT,
				pageNumber: 0,
				position: { x: 220, y: 180 },
				size: { width: 60, height: 40 },
				assigned: {
					email: 'editor@example.com',
					name: 'Editor',
					color: USER_COLORS[2],
				},
				config: { fontSize: 14 },
				value: 'Top Layer',
				created: Date.now() - 1000,
			},
		],
		selectedComponentId: 'foreground',
		hoveredComponentId: 'middle',
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentSelect: (id) => {
			console.log('Component selected:', id);
		},
		onComponentDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onComponentHover: (id) => {
			console.log('Component hovered:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
	},
};

export const DifferentComponentTypes: Story = {
	args: {
		pageNumber: 0,
		components: [
			{
				id: 'signature',
				type: ComponentType.SIGNATURE,
				pageNumber: 0,
				position: { x: 50, y: 50 },
				size: { width: 150, height: 60 },
				assigned: {
					email: 'signer@example.com',
					name: 'Signer',
					color: USER_COLORS[0],
				},
				config: { required: true },
				value: 'John Doe',
				created: Date.now() - 8000,
			},
			{
				id: 'input',
				type: ComponentType.INPUT_FIELD,
				pageNumber: 0,
				position: { x: 250, y: 50 },
				size: { width: 120, height: 30 },
				assigned: {
					email: 'user@example.com',
					name: 'User',
					color: USER_COLORS[1],
				},
				config: { placeholder: 'Enter text' },
				value: 'Sample input',
				created: Date.now() - 7000,
			},
			{
				id: 'checkbox',
				type: ComponentType.CHECKBOX,
				pageNumber: 0,
				position: { x: 50, y: 150 },
				size: { width: 20, height: 20 },
				assigned: {
					email: 'user@example.com',
					name: 'User',
					color: USER_COLORS[1],
				},
				config: { required: true },
				value: 'true',
				created: Date.now() - 6000,
			},
			{
				id: 'stamp',
				type: ComponentType.STAMP,
				pageNumber: 0,
				position: { x: 100, y: 150 },
				size: { width: 80, height: 80 },
				assigned: {
					email: 'approver@example.com',
					name: 'Approver',
					color: USER_COLORS[2],
				},
				config: { backgroundColor: '#22c55e', color: '#ffffff' },
				value: 'APPROVED',
				created: Date.now() - 5000,
			},
			{
				id: 'date',
				type: ComponentType.DATE,
				pageNumber: 0,
				position: { x: 250, y: 150 },
				size: { width: 100, height: 30 },
				assigned: {
					email: 'user@example.com',
					name: 'User',
					color: USER_COLORS[1],
				},
				config: { dateFormat: 'YYYY-MM-DD' },
				value: '2024-01-15',
				created: Date.now() - 4000,
			},
			{
				id: 'checkmark',
				type: ComponentType.CHECKMARK,
				pageNumber: 0,
				position: { x: 50, y: 250 },
				size: { width: 30, height: 30 },
				assigned: {
					email: 'approver@example.com',
					name: 'Approver',
					color: USER_COLORS[2],
				},
				config: { color: '#22c55e' },
				value: 'true',
				created: Date.now() - 3000,
			},
			{
				id: 'rectangle',
				type: ComponentType.RECTANGLE,
				pageNumber: 0,
				position: { x: 100, y: 250 },
				size: { width: 80, height: 50 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[3],
				},
				config: { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' },
				created: Date.now() - 2000,
			},
			{
				id: 'circle',
				type: ComponentType.CIRCLE,
				pageNumber: 0,
				position: { x: 200, y: 250 },
				size: { width: 60, height: 60 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[3],
				},
				config: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
				created: Date.now() - 1000,
			},
			{
				id: 'line',
				type: ComponentType.LINE,
				pageNumber: 0,
				position: { x: 50, y: 350 },
				size: { width: 200, height: 4 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[3],
				},
				config: { backgroundColor: '#374151' },
				created: Date.now() - 500,
			},
			{
				id: 'extra',
				type: ComponentType.EXTRA,
				pageNumber: 0,
				position: { x: 280, y: 250 },
				size: { width: 120, height: 80 },
				assigned: {
					email: 'editor@example.com',
					name: 'Editor',
					color: USER_COLORS[4],
				},
				config: { backgroundColor: '#f3f4f6', fontSize: 12 },
				value: 'Extra content',
				created: Date.now() - 100,
			},
		],
		selectedComponentId: 'signature',
		hoveredComponentId: 'stamp',
		viewMode: ViewMode.EDITOR,
		scale: 1,
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentSelect: (id) => {
			console.log('Component selected:', id);
		},
		onComponentDelete: (id) => {
			console.log('Component deleted:', id);
		},
		onComponentHover: (id) => {
			console.log('Component hovered:', id);
		},
		onStartDrag: (id, position) => {
			console.log('Drag started:', id, position);
		},
		onStartResize: (id, handle, position, size) => {
			console.log('Resize started:', id, handle, position, size);
		},
	},
};

export const NoSelection: Story = {
	args: {
		...Page0WithComponents.args,
		selectedComponentId: undefined,
		hoveredComponentId: undefined,
	},
};

export const MultipleSelections: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-4 p-4">
			<div className="relative bg-white shadow-lg h-96 overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
					Selected: comp-1
				</div>
				<DocumentLayer
					pageNumber={0}
					components={sampleComponents}
					selectedComponentId="comp-1"
					hoveredComponentId="comp-2"
					viewMode={ViewMode.EDITOR}
					scale={1}
					onComponentUpdate={(component) => console.log('Updated:', component)}
					onComponentSelect={(id) => console.log('Selected:', id)}
					onComponentDelete={(id) => console.log('Deleted:', id)}
					onComponentHover={(id) => console.log('Hovered:', id)}
					onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
					onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
				/>
			</div>
			<div className="relative bg-white shadow-lg h-96 overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
					Selected: comp-3
				</div>
				<DocumentLayer
					pageNumber={0}
					components={sampleComponents}
					selectedComponentId="comp-3"
					hoveredComponentId="comp-5"
					viewMode={ViewMode.EDITOR}
					scale={1}
					onComponentUpdate={(component) => console.log('Updated:', component)}
					onComponentSelect={(id) => console.log('Selected:', id)}
					onComponentDelete={(id) => console.log('Deleted:', id)}
					onComponentHover={(id) => console.log('Hovered:', id)}
					onStartDrag={(id, pos) => console.log('Drag:', id, pos)}
					onStartResize={(id, handle, pos, size) => console.log('Resize:', id, handle, pos, size)}
				/>
			</div>
		</div>
	),
};
