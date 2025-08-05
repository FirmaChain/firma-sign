import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextComponent } from './TextComponent';
import { ComponentType, ViewMode, ComponentProps } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents } from '../utils/pdfExport';

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

export const TextInPDFExport: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'This text will appear in the PDF export',
			config: {
				fontSize: 16,
				color: '#1f2937',
				backgroundColor: '#f9fafb',
			},
		},
		viewMode: ViewMode.PREVIEW,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Text component as it would appear in a PDF export. Click the button to export and view the PDF.',
			},
		},
	},
	render: function TextInPDFExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportText = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[args.component],
					{
						fileName: 'text-export.pdf',
						quality: 'high',
					},
				);

				if (result.success && result.pdfBytes) {
					const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
					const url = URL.createObjectURL(blob);
					setPdfUrl(url);
				}
			} catch (error) {
				console.error('Export error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={() => void exportText()}
						disabled={isLoading}
						style={{
							padding: '10px 20px',
							background: isLoading ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Exporting...' : 'Export Text to PDF'}
					</button>
					{isLoading && <span>Generating PDF with text...</span>}
				</div>

				<TextComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Text Component PDF Export:</h3>
						<iframe
							src={pdfUrl}
							width="100%"
							height="500px"
							style={{ border: '1px solid #ccc', borderRadius: '5px' }}
						/>
					</div>
				)}
			</div>
		);
	},
};

export const MultipleTextFieldsExport: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates exporting multiple text fields to PDF with different styles and content.',
			},
		},
	},
	render: function MultipleTextFieldsExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportFormFields = async () => {
			setIsLoading(true);
			try {
				const textFields = [
					{
						...sampleComponent,
						id: 'name-field',
						position: { x: 50, y: 100 },
						size: { width: 200, height: 30 },
						value: 'John Doe',
						config: {
							fontSize: 14,
							color: '#374151',
							backgroundColor: '#ffffff',
						},
					},
					{
						...sampleComponent,
						id: 'title-field',
						position: { x: 50, y: 150 },
						size: { width: 150, height: 30 },
						value: 'Software Engineer',
						config: {
							fontSize: 12,
							color: '#6b7280',
							backgroundColor: '#f9fafb',
						},
					},
					{
						...sampleComponent,
						id: 'date-field',
						position: { x: 250, y: 100 },
						size: { width: 120, height: 30 },
						value: '12/15/2023',
						config: {
							fontSize: 14,
							color: '#dc2626',
							backgroundColor: '#fef2f2',
						},
					},
					{
						...sampleComponent,
						id: 'description-field',
						position: { x: 50, y: 200 },
						size: { width: 320, height: 60 },
						value:
							'This is a longer description field that spans multiple lines and demonstrates text wrapping in PDF exports.',
						config: {
							fontSize: 11,
							color: '#4b5563',
							backgroundColor: '#f3f4f6',
						},
					},
				];

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					textFields,
					{
						fileName: 'form-fields-export.pdf',
						quality: 'high',
						includeFormFields: true,
					},
				);

				if (result.success && result.pdfBytes) {
					const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
					const url = URL.createObjectURL(blob);
					setPdfUrl(url);
				}
			} catch (error) {
				console.error('Form export error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={() => void exportFormFields()}
						disabled={isLoading}
						style={{
							padding: '10px 20px',
							background: isLoading ? '#9ca3af' : '#7c3aed',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Exporting...' : 'Export Form Fields to PDF'}
					</button>
					{isLoading && <span>Generating PDF with multiple text fields...</span>}
				</div>

				<TextComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Form Fields PDF Export:</h3>
						<iframe
							src={pdfUrl}
							width="100%"
							height="600px"
							style={{ border: '1px solid #ccc', borderRadius: '5px' }}
						/>
					</div>
				)}
			</div>
		);
	},
};
