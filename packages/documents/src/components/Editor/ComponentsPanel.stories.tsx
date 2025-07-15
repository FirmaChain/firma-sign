import type { Meta, StoryObj } from '@storybook/react';
import { ComponentsPanel } from './ComponentsPanel';
import { ComponentType, ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof ComponentsPanel> = {
	title: 'Components/Editor/ComponentsPanel',
	component: ComponentsPanel,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: [ViewMode.EDITOR, ViewMode.FORM, ViewMode.PREVIEW],
		},
		numPages: {
			control: { type: 'number' },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleComponents = [
	{
		id: 'comp-1',
		type: ComponentType.SIGNATURE,
		pageNumber: 0,
		position: { x: 100, y: 200 },
		size: { width: 150, height: 60 },
		assigned: {
			email: 'john@example.com',
			name: 'John Doe',
			color: USER_COLORS[0],
		},
		config: { required: true },
		value: 'John Doe',
		created: Date.now() - 3000,
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
		value: 'Sample text content',
		created: Date.now() - 2000,
	},
	{
		id: 'comp-3',
		type: ComponentType.CHECKBOX,
		pageNumber: 1,
		position: { x: 200, y: 300 },
		size: { width: 20, height: 20 },
		assigned: {
			email: 'mike@example.com',
			name: 'Mike Wilson',
			color: USER_COLORS[2],
		},
		config: { required: true },
		value: 'true',
		created: Date.now() - 1000,
	},
	{
		id: 'comp-4',
		type: ComponentType.INPUT_FIELD,
		pageNumber: 1,
		position: { x: 150, y: 250 },
		size: { width: 180, height: 35 },
		assigned: {
			email: 'sarah@example.com',
			name: 'Sarah Johnson',
			color: USER_COLORS[3],
		},
		config: { required: true, placeholder: 'Enter your name' },
		value: '',
		created: Date.now() - 500,
	},
	{
		id: 'comp-5',
		type: ComponentType.STAMP,
		pageNumber: 0,
		position: { x: 400, y: 100 },
		size: { width: 80, height: 80 },
		assigned: {
			email: 'admin@example.com',
			name: 'Admin User',
			color: USER_COLORS[4],
		},
		config: { backgroundColor: '#22c55e', color: '#ffffff' },
		value: 'APPROVED',
		created: Date.now() - 4000,
	},
	{
		id: 'comp-6',
		type: ComponentType.DATE,
		pageNumber: 1,
		position: { x: 350, y: 200 },
		size: { width: 120, height: 30 },
		assigned: {
			email: 'john@example.com',
			name: 'John Doe',
			color: USER_COLORS[0],
		},
		config: { required: true, dateFormat: 'YYYY-MM-DD' },
		value: '2024-01-15',
		created: Date.now() - 100,
	},
];

export const WithComponents: Story = {
	args: {
		components: sampleComponents,
		selectedComponentId: 'comp-1',
		viewMode: ViewMode.EDITOR,
		numPages: 2,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'sample-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const EmptyPanel: Story = {
	args: {
		components: [],
		viewMode: ViewMode.EDITOR,
		numPages: 1,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'empty-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const FormMode: Story = {
	args: {
		components: sampleComponents,
		viewMode: ViewMode.FORM,
		numPages: 2,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'form-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const PreviewMode: Story = {
	args: {
		components: sampleComponents,
		viewMode: ViewMode.PREVIEW,
		numPages: 2,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'preview-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const LargeComponentList: Story = {
	args: {
		components: [
			...sampleComponents,
			...Array.from({ length: 20 }, (_, i) => ({
				id: `generated-${i}`,
				type: ComponentType.TEXT,
				pageNumber: Math.floor(i / 5),
				position: { x: 50 + (i % 5) * 100, y: 50 + Math.floor(i / 5) * 50 },
				size: { width: 80, height: 25 },
				assigned: {
					email: `user${i}@example.com`,
					name: `User ${i}`,
					color: USER_COLORS[i % USER_COLORS.length],
				},
				config: { fontSize: 12 },
				value: i % 3 === 0 ? `Text ${i}` : '',
				created: Date.now() - i * 1000,
			})),
		],
		viewMode: ViewMode.EDITOR,
		numPages: 5,
		pdfUrl: 'https://example.com/large-document.pdf',
		fileName: 'large-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const SinglePage: Story = {
	args: {
		components: sampleComponents.filter((comp) => comp.pageNumber === 0),
		viewMode: ViewMode.EDITOR,
		numPages: 1,
		pdfUrl: 'https://example.com/single-page.pdf',
		fileName: 'single-page.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const AllRequired: Story = {
	args: {
		components: sampleComponents.map((comp) => ({
			...comp,
			config: { ...comp.config, required: true },
		})),
		viewMode: ViewMode.EDITOR,
		numPages: 2,
		pdfUrl: 'https://example.com/required-document.pdf',
		fileName: 'required-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const MixedComponentTypes: Story = {
	args: {
		components: [
			{
				id: 'mixed-1',
				type: ComponentType.RECTANGLE,
				pageNumber: 0,
				position: { x: 100, y: 100 },
				size: { width: 100, height: 60 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[0],
				},
				config: { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' },
				created: Date.now() - 5000,
			},
			{
				id: 'mixed-2',
				type: ComponentType.CIRCLE,
				pageNumber: 0,
				position: { x: 220, y: 100 },
				size: { width: 60, height: 60 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[0],
				},
				config: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
				created: Date.now() - 4000,
			},
			{
				id: 'mixed-3',
				type: ComponentType.LINE,
				pageNumber: 0,
				position: { x: 100, y: 200 },
				size: { width: 200, height: 4 },
				assigned: {
					email: 'designer@example.com',
					name: 'Designer',
					color: USER_COLORS[0],
				},
				config: { backgroundColor: '#374151' },
				created: Date.now() - 3000,
			},
			{
				id: 'mixed-4',
				type: ComponentType.CHECKMARK,
				pageNumber: 0,
				position: { x: 350, y: 150 },
				size: { width: 30, height: 30 },
				assigned: {
					email: 'approver@example.com',
					name: 'Approver',
					color: USER_COLORS[1],
				},
				config: { color: '#22c55e' },
				value: 'true',
				created: Date.now() - 2000,
			},
			{
				id: 'mixed-5',
				type: ComponentType.EXTRA,
				pageNumber: 0,
				position: { x: 400, y: 100 },
				size: { width: 150, height: 80 },
				assigned: {
					email: 'editor@example.com',
					name: 'Editor',
					color: USER_COLORS[2],
				},
				config: { backgroundColor: '#f3f4f6', fontSize: 12 },
				value: 'Additional notes',
				created: Date.now() - 1000,
			},
		],
		viewMode: ViewMode.EDITOR,
		numPages: 1,
		pdfUrl: 'https://example.com/mixed-document.pdf',
		fileName: 'mixed-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const IncompleteComponents: Story = {
	args: {
		components: sampleComponents.map((comp) => ({
			...comp,
			value: comp.config?.required ? '' : comp.value,
		})),
		viewMode: ViewMode.EDITOR,
		numPages: 2,
		pdfUrl: 'https://example.com/incomplete-document.pdf',
		fileName: 'incomplete-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
};

export const ResponsiveLayout: Story = {
	args: {
		components: sampleComponents,
		viewMode: ViewMode.EDITOR,
		numPages: 2,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'responsive-document.pdf',
		onComponentSelect: (id: string) => {
			console.log('Component selected:', id);
		},
		onComponentUpdate: (component) => {
			console.log('Component updated:', component);
		},
		onComponentDelete: (id: string) => {
			console.log('Component deleted:', id);
		},
		onComponentsChange: (components) => {
			console.log('Components changed:', components);
		},
	},
	parameters: {
		viewport: {
			viewports: {
				mobile: {
					name: 'Mobile',
					styles: {
						width: '375px',
						height: '667px',
					},
				},
				tablet: {
					name: 'Tablet',
					styles: {
						width: '768px',
						height: '1024px',
					},
				},
			},
			defaultViewport: 'mobile',
		},
	},
};
