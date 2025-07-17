import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StampComponent } from './StampComponent';
import { ComponentType, ViewMode } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents, previewPDF } from '../utils/pdfExport';

const meta: Meta<typeof StampComponent> = {
	title: 'Components/Editor/Components/StampComponent',
	component: StampComponent,
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
	id: 'stamp-1',
	type: ComponentType.STAMP,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 80, height: 80 },
	assigned: {
		email: 'approver@example.com',
		name: 'Manager',
		color: '#3b82f6',
	},
	config: {
		color: '#3b82f6',
		backgroundColor: '#f0f9ff',
	},
	created: Date.now(),
};

export const EditorMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.EDITOR,
	},
};

export const FormMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.FORM,
	},
};

export const PreviewMode: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
	},
};

export const GreenStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#059669',
			},
			config: {
				color: '#059669',
				backgroundColor: '#ecfdf5',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const RedStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#dc2626',
			},
			config: {
				color: '#dc2626',
				backgroundColor: '#fef2f2',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 120, height: 120 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const SmallStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 50, height: 50 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const OrangeStamp: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#ea580c',
			},
			config: {
				color: '#ea580c',
				backgroundColor: '#fff7ed',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const StampInPDFExport: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Stamp component as it would appear in a PDF export. Click the button to export and view the PDF.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportStamp = async () => {
			setIsLoading(true);
			try {
				const stampComponent = {
					...sampleComponent,
					value: 'APPROVED',
				};

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[stampComponent],
					{
						fileName: 'stamp-export.pdf',
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
						onClick={exportStamp}
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
						{isLoading ? 'Exporting...' : 'Export Approval Stamp to PDF'}
					</button>
					<button
						onClick={async () => {
							try {
								const stampComponent = {
									...sampleComponent,
									value: 'APPROVED',
								};
								const result = await exportPDFWithComponents(
									'/wcoomd/uploads/2018/05/blank.pdf',
									[stampComponent],
									{ quality: 'medium' },
								);
								if (result.success && result.pdfBytes) {
									previewPDF(result.pdfBytes);
								}
							} catch (error) {
								console.error('Preview error:', error);
							}
						}}
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
					{isLoading && <span>Generating PDF with stamp...</span>}
				</div>

				<StampComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Approval Stamp PDF Export:</h3>
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

export const ApprovalWorkflowExport: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates exporting a complete approval workflow with multiple stamps at different stages.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportApprovalWorkflow = async () => {
			setIsLoading(true);
			try {
				const approvalStamps = [
					{
						...sampleComponent,
						id: 'initial-review',
						position: { x: 50, y: 100 },
						size: { width: 70, height: 70 },
						assigned: {
							email: 'reviewer@example.com',
							name: 'Initial Reviewer',
							color: '#059669',
						},
						config: {
							color: '#059669',
							backgroundColor: '#ecfdf5',
						},
						value: 'REVIEWED',
					},
					{
						...sampleComponent,
						id: 'manager-approval',
						position: { x: 200, y: 100 },
						size: { width: 80, height: 80 },
						assigned: {
							email: 'manager@example.com',
							name: 'Department Manager',
							color: '#3b82f6',
						},
						config: {
							color: '#3b82f6',
							backgroundColor: '#f0f9ff',
						},
						value: 'APPROVED',
					},
					{
						...sampleComponent,
						id: 'final-approval',
						position: { x: 350, y: 100 },
						size: { width: 90, height: 90 },
						assigned: {
							email: 'director@example.com',
							name: 'Director',
							color: '#dc2626',
						},
						config: {
							color: '#dc2626',
							backgroundColor: '#fef2f2',
						},
						value: 'FINAL APPROVED',
					},
					{
						...sampleComponent,
						id: 'quality-check',
						position: { x: 125, y: 250 },
						size: { width: 75, height: 75 },
						assigned: {
							email: 'quality@example.com',
							name: 'Quality Control',
							color: '#7c3aed',
						},
						config: {
							color: '#7c3aed',
							backgroundColor: '#f3e8ff',
						},
						value: 'QC PASSED',
					},
				];

				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					approvalStamps,
					{
						fileName: 'approval-workflow-export.pdf',
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
				console.error('Approval workflow export error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={exportApprovalWorkflow}
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
						{isLoading ? 'Exporting...' : 'Export Approval Workflow'}
					</button>
					{isLoading && <span>Generating PDF with approval workflow...</span>}
				</div>

				<StampComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Approval Workflow PDF Export:</h3>
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
