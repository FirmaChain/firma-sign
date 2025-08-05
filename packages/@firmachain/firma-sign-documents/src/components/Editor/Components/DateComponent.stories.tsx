import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateComponent } from './DateComponent';
import { ComponentType, ViewMode, ComponentProps } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents } from '../utils/pdfExport';

const meta: Meta<typeof DateComponent> = {
	title: 'Components/Editor/Components/DateComponent',
	component: DateComponent,
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
	id: 'date-1',
	type: ComponentType.DATE,
	pageNumber: 0,
	position: { x: 0, y: 0 },
	size: { width: 180, height: 40 },
	assigned: {
		email: 'user@example.com',
		name: 'Sarah Johnson',
		color: USER_COLORS[3],
	},
	config: {
		fontSize: 14,
		color: '#000000',
		backgroundColor: '#ffffff',
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
			value: '2023-12-15',
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
			value: '2023-12-15',
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
			value: '2023-12-15',
			config: {
				fontSize: 16,
				color: '#7c2d12',
				backgroundColor: '#fef7ed',
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
			size: { width: 250, height: 60 },
			value: '2023-12-15',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const SmallSize: Story = {
	args: {
		component: {
			...sampleComponent,
			size: { width: 120, height: 30 },
			value: '2023-12-15',
		},
		viewMode: ViewMode.FORM,
		isSelected: false,
		isHovered: false,
		scale: 1,
	},
};

export const DateInPDFExport: Story = {
	args: {
		component: {
			...sampleComponent,
			value: '2023-12-15',
			config: {
				fontSize: 14,
				color: '#374151',
				backgroundColor: '#ffffff',
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
					'Date component as it would appear in a PDF export. Click the button to export and view the PDF.',
			},
		},
	},
	render: function DateInPDFExportRender(args: ComponentProps) {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const exportDate = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					[args.component],
					{
						fileName: 'date-export.pdf',
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
						onClick={() => void exportDate()}
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
						{isLoading ? 'Exporting...' : 'Export Date to PDF'}
					</button>
					{isLoading && <span>Generating PDF with date...</span>}
				</div>

				<DateComponent {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Date Component PDF Export:</h3>
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
