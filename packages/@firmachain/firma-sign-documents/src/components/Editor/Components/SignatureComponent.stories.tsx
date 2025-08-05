import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SignatureComponent } from './SignatureComponent';
import { ComponentType, ViewMode, ComponentProps } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents } from '../utils/pdfExport';

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

export const SignatureInPDFExport: Story = {
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
	parameters: {
		docs: {
			description: {
				story:
					'Signature component as it would appear in a PDF export. This demonstrates how signed signatures are rendered in the final PDF document.',
			},
		},
	},
};

export const ExportSingleSignature: Story = {
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
	parameters: {
		docs: {
			description: {
				story:
					'Interactive story showing signature export to PDF. Click the buttons to export and view the PDF.',
			},
		},
	},
	render: function ExportSingleSignatureRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportSignature = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[args.component],
					{
						fileName: 'signature-export.pdf',
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
						onClick={() => void exportSignature()}
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
						{isLoading ? 'Exporting...' : 'Export Signature to PDF'}
					</button>
					<button
						onClick={() =>
							void (async () => {
								try {
									const result = await exportPDFWithComponents(
										'/wcoomd/uploads/2018/05/blank.pdf',
										[args.component],
										{ quality: 'medium' },
									);
									if (result.success && result.pdfBytes) {
										const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
										const url = URL.createObjectURL(blob);
										window.open(url, '_blank');
									}
								} catch (error) {
									console.error('Preview error:', error);
								}
							})()
						}
						style={{
							padding: '10px 20px',
							background: '#059669',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
						}}
					>
						Open in New Tab
					</button>
				</div>

				<SignatureComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Signature PDF Export:</h3>
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

export const MultipleSignaturesExport: Story = {
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
					'Demonstrates exporting multiple signatures to PDF. Shows how multiple signature components appear in the final exported document.',
			},
		},
	},
	render: function MultipleSignaturesExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportMultipleSignatures = async () => {
			setIsLoading(true);
			try {
				const signatures = [
					{
						...sampleComponent,
						id: 'sig-1',
						position: { x: 50, y: 100 },
						value: 'Signed by John Doe at 12/15/2023, 2:30:45 PM',
					},
					{
						...sampleComponent,
						id: 'sig-2',
						position: { x: 300, y: 200 },
						assigned: {
							email: 'manager@example.com',
							name: 'Jane Manager',
							color: USER_COLORS[1],
						},
						value: 'Signed by Jane Manager at 12/15/2023, 3:45:12 PM',
					},
					{
						...sampleComponent,
						id: 'sig-3',
						position: { x: 150, y: 350 },
						assigned: {
							email: 'witness@example.com',
							name: 'Bob Witness',
							color: USER_COLORS[2],
						},
						value: 'Signed by Bob Witness at 12/15/2023, 4:15:30 PM',
					},
				];

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					signatures,
					{
						fileName: 'multi-signature-contract.pdf',
						quality: 'high',
						flattenComponents: true,
					},
				);

				if (result.success && result.pdfBytes) {
					const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
					const url = URL.createObjectURL(blob);
					setPdfUrl(url);
				}
			} catch (error) {
				console.error('Multi-signature export error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={() => void exportMultipleSignatures()}
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
						{isLoading ? 'Exporting...' : 'Export Multi-Signature Contract'}
					</button>
					{isLoading && <span>Generating PDF with multiple signatures...</span>}
				</div>

				<SignatureComponent
					{...args}
					component={args.component || sampleComponent}
					viewMode={args.viewMode || ViewMode.PREVIEW}
					scale={args.scale || 1}
				/>

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Multi-Signature Contract PDF:</h3>
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
