import type { Meta, StoryObj } from '@storybook/react';
import { ExportPanel } from './ExportPanel';
import { ComponentType } from '../types';
import { USER_COLORS } from '../constants';

const meta: Meta<typeof ExportPanel> = {
	title: 'Components/Editor/Components/ExportPanel',
	component: ExportPanel,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		pdfUrl: {
			control: { type: 'text' },
		},
		fileName: {
			control: { type: 'text' },
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
		value: 'Signed by John Doe',
		created: Date.now() - 1000,
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
		value: 'John Doe',
		created: Date.now() - 500,
	},
	{
		id: 'comp-3',
		type: ComponentType.CHECKBOX,
		pageNumber: 0,
		position: { x: 200, y: 300 },
		size: { width: 20, height: 20 },
		assigned: {
			email: 'mike@example.com',
			name: 'Mike Wilson',
			color: USER_COLORS[2],
		},
		config: { required: true },
		value: 'true',
		created: Date.now() - 200,
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
		config: { required: true },
		value: '',
		created: Date.now(),
	},
];

export const WithComponents: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'completed-document.pdf',
	},
};

export const EmptyComponents: Story = {
	args: {
		components: [],
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'empty-document.pdf',
	},
};

export const NoPdfUrl: Story = {
	args: {
		components: sampleComponents,
		fileName: 'document.pdf',
	},
};

export const MissingRequiredFields: Story = {
	args: {
		components: [
			{
				...sampleComponents[0],
				value: '', // Missing signature
			},
			{
				...sampleComponents[3],
				value: '', // Missing required input
			},
		],
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'incomplete-document.pdf',
	},
};

export const AllFieldsFilled: Story = {
	args: {
		components: sampleComponents.map((comp) => ({
			...comp,
			value: comp.value || 'Sample value',
		})),
		pdfUrl: 'https://example.com/document.pdf',
		fileName: 'completed-document.pdf',
	},
};

export const LargeDocument: Story = {
	args: {
		components: [
			...sampleComponents,
			...Array.from({ length: 15 }, (_, i) => ({
				id: `extra-comp-${i}`,
				type: ComponentType.TEXT,
				pageNumber: Math.floor(i / 5),
				position: { x: 50 + (i % 3) * 100, y: 100 + Math.floor(i / 3) * 50 },
				size: { width: 80, height: 25 },
				assigned: {
					email: `user${i}@example.com`,
					name: `User ${i}`,
					color: USER_COLORS[i % USER_COLORS.length],
				},
				config: { fontSize: 12 },
				value: i % 2 === 0 ? `Value ${i}` : '',
				created: Date.now() - i * 100,
			})),
		],
		pdfUrl: 'https://example.com/large-document.pdf',
		fileName: 'large-document.pdf',
	},
};

export const SinglePageDocument: Story = {
	args: {
		components: sampleComponents.filter((comp) => comp.pageNumber === 0),
		pdfUrl: 'https://example.com/single-page.pdf',
		fileName: 'single-page.pdf',
	},
};

export const MultiPageDocument: Story = {
	args: {
		components: [
			...sampleComponents,
			{
				id: 'page2-comp',
				type: ComponentType.SIGNATURE,
				pageNumber: 2,
				position: { x: 100, y: 400 },
				size: { width: 150, height: 60 },
				assigned: {
					email: 'manager@example.com',
					name: 'Manager',
					color: USER_COLORS[4],
				},
				config: { required: true },
				value: 'Manager Signature',
				created: Date.now(),
			},
		],
		pdfUrl: 'https://example.com/multi-page.pdf',
		fileName: 'multi-page-document.pdf',
	},
};
