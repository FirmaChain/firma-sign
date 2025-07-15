import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from './Editor';
import { SAMPLE_PDF_BASE64, MULTI_PAGE_PDF_BASE64 } from './pdf-utils';
import { AssignedUser, DocumentComponent, ComponentType } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof Editor> = {
	title: 'Components/Editor',
	component: Editor,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: ['editor', 'form', 'preview'],
		},
		preview: {
			control: { type: 'boolean' },
		},
		hideActionBtn: {
			control: { type: 'boolean' },
		},
		hideSave: {
			control: { type: 'boolean' },
		},
		enableNext: {
			control: { type: 'boolean' },
		},
		fileUrl: {
			control: { type: 'text' },
			description: 'URL of the PDF file to display',
		},
		fileId: {
			control: { type: 'text' },
			description: 'File ID for the PDF document',
		},
		contractId: {
			control: { type: 'text' },
			description: 'Contract ID for the document',
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample users for testing
const sampleSigners: AssignedUser[] = [
	{
		userId: '1',
		email: 'john.doe@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	{
		userId: '2',
		email: 'jane.smith@example.com',
		name: 'Jane Smith',
		color: USER_COLORS[1],
	},
	{
		userId: '3',
		email: 'mike.wilson@example.com',
		name: 'Mike Wilson',
		color: USER_COLORS[2],
	},
];

// Sample components for testing
const sampleComponents: DocumentComponent[] = [
	{
		id: 'comp-1',
		type: ComponentType.SIGNATURE,
		pageNumber: 0,
		position: { x: 100, y: 200 },
		size: { width: 150, height: 60 },
		assigned: sampleSigners[0],
		config: { required: true, backgroundColor: '#f8f9ff', borderColor: '#3b82f6' },
		created: Date.now() - 1000,
	},
	{
		id: 'comp-2',
		type: ComponentType.TEXT,
		pageNumber: 0,
		position: { x: 300, y: 150 },
		size: { width: 120, height: 30 },
		assigned: sampleSigners[1],
		config: { fontSize: 14, placeholder: 'Enter name...' },
		value: 'John Doe',
		created: Date.now() - 500,
	},
	{
		id: 'comp-3',
		type: ComponentType.CHECKBOX,
		pageNumber: 0,
		position: { x: 200, y: 300 },
		size: { width: 20, height: 20 },
		assigned: sampleSigners[2],
		config: { required: true },
		created: Date.now() - 200,
	},
	{
		id: 'comp-4',
		type: ComponentType.RECTANGLE,
		pageNumber: 0,
		position: { x: 50, y: 400 },
		size: { width: 200, height: 100 },
		assigned: {
			email: 'system@editor.com',
			name: 'Drawing Tool',
			color: '#666666',
		},
		config: {},
		created: Date.now() - 100,
	},
	{
		id: 'comp-5',
		type: ComponentType.INPUT_FIELD,
		pageNumber: 1,
		position: { x: 150, y: 250 },
		size: { width: 180, height: 35 },
		assigned: sampleSigners[0],
		config: { required: true, placeholder: 'Enter your address...' },
		value: '',
		created: Date.now(),
	},
];

export const EditorMode: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
		signers: sampleSigners,
		components: [],
	},
};

export const FormMode: Story = {
	args: {
		viewMode: 'form',
		preview: false,
		hideActionBtn: false,
		hideSave: true,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
	},
};

export const PreviewMode: Story = {
	args: {
		viewMode: 'preview',
		preview: true,
		hideActionBtn: true,
		hideSave: true,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
	},
};

export const WithNextButton: Story = {
	args: {
		viewMode: 'form',
		preview: false,
		hideActionBtn: false,
		hideSave: true,
		enableNext: true,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
	},
};

export const WithMultiPagePDF: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: MULTI_PAGE_PDF_BASE64,
		fileId: 'multi-page-test',
		contractId: 'contract-multi',
		signers: sampleSigners,
		components: [],
	},
};

export const WithExistingComponents: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
		signers: sampleSigners,
		components: sampleComponents,
	},
};

export const FormModeWithComponents: Story = {
	args: {
		viewMode: 'form',
		preview: false,
		hideActionBtn: false,
		hideSave: true,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'sample-file-1',
		contractId: 'contract-123',
		signers: sampleSigners,
		components: sampleComponents,
	},
};

export const ComponentManagement: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: MULTI_PAGE_PDF_BASE64,
		fileId: 'component-management-demo',
		contractId: 'contract-mgmt',
		signers: sampleSigners,
		components: sampleComponents,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the floating panel system with properly centered document area. The document stays centered while panels float around it. Both panels can be dragged, pinned/unpinned, and docked to different positions (left, right, top, bottom, or floating). Use the 📍 button in panel headers to change positions, 📌/📎 to pin/unpin, and ✕ to hide panels. A sample components file is available at `src/components/Editor/sample-components.json` for testing the import feature.',
			},
		},
	},
};

export const ImportFeatureDemo: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: MULTI_PAGE_PDF_BASE64,
		fileId: 'import-demo',
		contractId: 'contract-import',
		signers: sampleSigners,
		components: [], // Start with empty components to test import
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demo for testing the import feature with floating panels. Start with no components and use the Import button in the component management panel to load the sample components from `src/components/Editor/sample-components.json`. You can test both "Add to existing" and "Replace all" import modes. Try moving the panels to different positions!',
			},
		},
	},
};

export const FloatingPanelsDemo: Story = {
	args: {
		viewMode: 'editor',
		preview: false,
		hideActionBtn: false,
		hideSave: false,
		enableNext: false,
		fileUrl: SAMPLE_PDF_BASE64,
		fileId: 'floating-panels-demo',
		contractId: 'contract-floating',
		signers: sampleSigners,
		components: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the centered document layout with floating panels. The document area remains perfectly centered while panels float around it. Both the Tools panel (left) and Components panel (right) can be: 1) **Dragged** anywhere when floating and unpinned, 2) **Docked** to left, right, top, or bottom edges, 3) **Pinned/Unpinned** to prevent accidental dragging, 4) **Hidden/Shown** using toggle buttons, 5) **Resized** when floating (drag from bottom-right corner). Try different combinations and use the Reset button to restore default layout.',
			},
		},
	},
};
