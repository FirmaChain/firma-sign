import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxComponent } from './CheckboxComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents, previewPDF } from '../utils/pdfExport';

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

export const CheckboxInPDFExport: Story = {
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
	parameters: {
		docs: {
			description: {
				story:
					'Checkbox component as it would appear in a PDF export. Click the buttons to export and view the PDF.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportCheckbox = async (isChecked: boolean) => {
			setIsLoading(true);
			try {
				const checkboxComponent = {
					...sampleComponent,
					value: isChecked ? 'true' : 'false',
				};

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[checkboxComponent],
					{
						fileName: `${isChecked ? 'checked' : 'unchecked'}-checkbox-export.pdf`,
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
						onClick={() => exportCheckbox(true)}
						disabled={isLoading}
						style={{
							padding: '10px 20px',
							background: isLoading ? '#9ca3af' : '#059669',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Exporting...' : 'Export Checked'}
					</button>
					<button
						onClick={() => exportCheckbox(false)}
						disabled={isLoading}
						style={{
							padding: '10px 20px',
							background: isLoading ? '#9ca3af' : '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Exporting...' : 'Export Unchecked'}
					</button>
					{isLoading && <span>Generating PDF with checkbox...</span>}
				</div>

				<CheckboxComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Checkbox PDF Export:</h3>
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

export const CheckboxFormExport: Story = {
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
					'Demonstrates exporting a complete checkbox form to PDF with multiple options and states.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportCheckboxForm = async () => {
			setIsLoading(true);
			try {
				const checkboxes = [
					{
						...sampleComponent,
						id: 'terms-checkbox',
						position: { x: 50, y: 100 },
						size: { width: 20, height: 20 },
						value: 'true',
						config: {
							required: true,
							backgroundColor: '#ffffff',
						},
					},
					{
						...sampleComponent,
						id: 'privacy-checkbox',
						position: { x: 50, y: 130 },
						size: { width: 20, height: 20 },
						value: 'true',
						assigned: {
							email: 'user@example.com',
							name: 'Jane Doe',
							color: USER_COLORS[1],
						},
					},
					{
						...sampleComponent,
						id: 'newsletter-checkbox',
						position: { x: 50, y: 160 },
						size: { width: 20, height: 20 },
						value: 'false',
						assigned: {
							email: 'user@example.com',
							name: 'Bob Smith',
							color: USER_COLORS[3],
						},
						config: {
							required: false,
							backgroundColor: '#fef3c7',
						},
					},
					{
						...sampleComponent,
						id: 'marketing-checkbox',
						position: { x: 50, y: 190 },
						size: { width: 20, height: 20 },
						value: 'true',
						assigned: {
							email: 'user@example.com',
							name: 'Alice Johnson',
							color: USER_COLORS[4],
						},
					},
				];

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					checkboxes,
					{
						fileName: 'checkbox-form-export.pdf',
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
				console.error('Checkbox form export error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={exportCheckboxForm}
						disabled={isLoading}
						style={{
							padding: '10px 20px',
							background: isLoading ? '#9ca3af' : '#ea580c',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Exporting...' : 'Export Consent Form'}
					</button>
					{isLoading && <span>Generating PDF with checkbox form...</span>}
				</div>

				<CheckboxComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Consent Form PDF Export:</h3>
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
