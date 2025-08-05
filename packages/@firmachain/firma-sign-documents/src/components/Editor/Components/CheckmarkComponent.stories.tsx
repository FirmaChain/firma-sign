import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CheckmarkComponent } from './CheckmarkComponent';
import { ComponentType, ViewMode, DocumentComponent } from '../types';
import { exportPDFWithComponents } from '../utils/pdfExport';

const meta: Meta<typeof CheckmarkComponent> = {
	title: 'Components/Editor/Components/CheckmarkComponent',
	component: CheckmarkComponent,
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
	id: 'checkmark-1',
	type: ComponentType.CHECKMARK,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 30, height: 30 },
	assigned: {
		email: 'system@editor.com',
		name: 'System',
		color: '#10b981',
	},
	config: {
		color: '#10b981',
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

export const CustomColor: Story = {
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

export const BlueTheme: Story = {
	args: {
		component: {
			...sampleComponent,
			assigned: {
				...sampleComponent.assigned,
				color: '#2563eb',
			},
			config: {
				color: '#2563eb',
				backgroundColor: '#dbeafe',
			},
		},
		viewMode: ViewMode.FORM,
	},
};

export const LargeSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 60, height: 60 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const SmallSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 16, height: 16 },
		},
		viewMode: ViewMode.FORM,
	},
};

export const OrangeTheme: Story = {
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

export const CheckmarkInPDFExport: Story = {
	args: {
		component: sampleComponent,
		viewMode: ViewMode.PREVIEW,
	},
	parameters: {
		docs: {
			description: {
				story: 'Checkmark component as it would appear in a PDF export. Click the button to export and view the PDF.',
			},
		},
	},
	render: function RenderCheckmarkExport(args) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportCheckmark = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[args.component as DocumentComponent],
					{
						fileName: 'checkmark-export.pdf',
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
						onClick={() => void exportCheckmark()}
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
						{isLoading ? 'Exporting...' : 'Export Checkmark to PDF'}
					</button>
					{isLoading && <span>Generating PDF with checkmark...</span>}
				</div>

				<CheckmarkComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Checkmark PDF Export:</h3>
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
