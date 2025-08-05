import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InputFieldComponent } from './InputFieldComponent';
import { ComponentType, ViewMode, ComponentProps } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents } from '../utils/pdfExport';

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

export const InputFieldInPDFExport: Story = {
	args: {
		component: {
			...sampleComponent,
			value: 'John Doe',
			config: {
				fontSize: 14,
				color: '#374151',
				backgroundColor: '#ffffff',
				placeholder: 'Enter your name...',
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
					'Input field component as it would appear in a PDF export. Click the button to export and view the PDF.',
			},
		},
	},
	render: function InputFieldInPDFExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportInputField = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[args.component],
					{
						fileName: 'input-field-export.pdf',
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
						onClick={() => void exportInputField()}
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
						{isLoading ? 'Exporting...' : 'Export Input Field to PDF'}
					</button>
					{isLoading && <span>Generating PDF with input field...</span>}
				</div>

				<InputFieldComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Input Field PDF Export:</h3>
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

export const FormWithInputFieldsExport: Story = {
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
				story: 'Demonstrates exporting multiple input fields to PDF as a complete form.',
			},
		},
	},
	render: function FormWithInputFieldsExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportForm = async () => {
			setIsLoading(true);
			try {
				const formFields = [
					{
						...sampleComponent,
						id: 'first-name',
						position: { x: 50, y: 100 },
						size: { width: 200, height: 35 },
						value: 'John',
						config: {
							fontSize: 14,
							color: '#374151',
							backgroundColor: '#ffffff',
							placeholder: 'First Name',
							required: true,
						},
					},
					{
						...sampleComponent,
						id: 'last-name',
						position: { x: 270, y: 100 },
						size: { width: 200, height: 35 },
						value: 'Doe',
						config: {
							fontSize: 14,
							color: '#374151',
							backgroundColor: '#ffffff',
							placeholder: 'Last Name',
							required: true,
						},
					},
					{
						...sampleComponent,
						id: 'email',
						position: { x: 50, y: 150 },
						size: { width: 300, height: 35 },
						value: 'john.doe@example.com',
						config: {
							fontSize: 14,
							color: '#374151',
							backgroundColor: '#f9fafb',
							placeholder: 'Email Address',
							required: true,
						},
					},
					{
						...sampleComponent,
						id: 'phone',
						position: { x: 370, y: 150 },
						size: { width: 180, height: 35 },
						value: '+1 (555) 123-4567',
						config: {
							fontSize: 14,
							color: '#374151',
							backgroundColor: '#ffffff',
							placeholder: 'Phone Number',
						},
					},
					{
						...sampleComponent,
						id: 'address',
						position: { x: 50, y: 200 },
						size: { width: 500, height: 80 },
						value: '123 Main Street\nAnytown, ST 12345\nUnited States',
						config: {
							fontSize: 12,
							color: '#4b5563',
							backgroundColor: '#f3f4f6',
							placeholder: 'Address',
							multiline: true,
						},
					},
				];

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					formFields,
					{
						fileName: 'contact-form-export.pdf',
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
						onClick={() => void exportForm()}
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
						{isLoading ? 'Exporting...' : 'Export Contact Form to PDF'}
					</button>
					{isLoading && <span>Generating PDF with contact form...</span>}
				</div>

				<InputFieldComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Contact Form PDF Export:</h3>
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
