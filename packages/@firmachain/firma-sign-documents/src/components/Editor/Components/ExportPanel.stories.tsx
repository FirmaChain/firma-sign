import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ExportPanel } from './ExportPanel';
import { ComponentType } from '../types';
import { USER_COLORS } from '../constants';
import { exportPDFWithComponents, previewPDF } from '../utils/pdfExport';

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
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'completed-document.pdf',
	},
};

export const EmptyComponents: Story = {
	args: {
		components: [],
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
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
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'incomplete-document.pdf',
	},
};

export const AllFieldsFilled: Story = {
	args: {
		components: sampleComponents.map((comp) => ({
			...comp,
			value: comp.value || 'Sample value',
		})),
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
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
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'large-document.pdf',
	},
};

export const SinglePageDocument: Story = {
	args: {
		components: sampleComponents.filter((comp) => comp.pageNumber === 0),
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
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
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'multi-page-document.pdf',
	},
};

export const WithPDFExport: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'exported-document.pdf',
	},
	parameters: {
		docs: {
			description: {
				story:
					'ExportPanel with PDF export functionality. Use the buttons to export and view the PDF with components.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px' }}>
					<button
						onClick={async () => {
							try {
								const result = await exportPDFWithComponents(
									'/wcoomd/uploads/2018/05/blank.pdf',
									args.components,
									{ fileName: args.fileName, quality: 'high' },
								);
								if (result.success && result.pdfBytes) {
									const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
									const url = URL.createObjectURL(blob);
									setPdfUrl(url);
								}
							} catch (error) {
								console.error('Export error:', error);
							}
						}}
						style={{
							padding: '10px 20px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
						}}
					>
						Export & View PDF
					</button>
					<button
						onClick={async () => {
							try {
								const result = await exportPDFWithComponents(
									'/wcoomd/uploads/2018/05/blank.pdf',
									args.components,
									{ quality: 'high' },
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
				</div>

				<ExportPanel {...args} />

				{pdfUrl && (
					<div style={{ marginTop: '20px' }}>
						<h3>Exported PDF:</h3>
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

export const WithPDFPreview: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'preview-document.pdf',
	},
	parameters: {
		docs: {
			description: {
				story: 'ExportPanel with inline PDF preview. The PDF is rendered directly in Storybook.',
			},
		},
	},
	render: (args) => {
		const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
		const [isLoading, setIsLoading] = React.useState(false);

		const generatePDF = async () => {
			setIsLoading(true);
			try {
				const result = await exportPDFWithComponents(
					'/wcoomd/uploads/2018/05/blank.pdf',
					args.components,
					{ quality: 'medium' },
				);

				if (result.success && result.pdfBytes) {
					const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
					const url = URL.createObjectURL(blob);
					setPdfUrl(url);
				}
			} catch (error) {
				console.error('PDF generation error:', error);
			} finally {
				setIsLoading(false);
			}
		};

		React.useEffect(() => {
			generatePDF();
		}, []);

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={generatePDF}
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
						{isLoading ? 'Generating...' : 'Regenerate PDF'}
					</button>
					{isLoading && <span>Generating PDF with components...</span>}
				</div>

				<ExportPanel {...args} />

				{pdfUrl && !isLoading && (
					<div style={{ marginTop: '20px' }}>
						<h3>Generated PDF Preview:</h3>
						<iframe
							src={pdfUrl}
							width="100%"
							height="700px"
							style={{ border: '1px solid #ccc', borderRadius: '5px' }}
						/>
					</div>
				)}
			</div>
		);
	},
};

export const ExportOptionsDemo: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'high-quality-export.pdf',
		onExport: async (components, pdfUrl, fileName) => {
			console.log('Exporting with custom options');

			// Demonstrate different export options
			const exportOptions = {
				fileName,
				quality: 'high' as const,
				includeFormFields: false,
				flattenComponents: true,
			};

			console.log('Export options:', exportOptions);

			try {
				const result = await exportPDFWithComponents(pdfUrl, components, exportOptions);

				if (result.success) {
					console.log('High-quality PDF exported:', result.fileName);
				} else {
					console.error('Export failed:', result.error);
				}

				return result;
			} catch (error) {
				console.error('Export error:', error);
				return { success: false, error: error.message };
			}
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'ExportPanel demonstrating custom export options (high quality, flattened components, no form fields).',
			},
		},
	},
};

export const ExportWithStats: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: '/wcoomd/uploads/2018/05/blank.pdf',
		fileName: 'stats-export.pdf',
		onExport: async (components, pdfUrl, fileName) => {
			// Import getExportStats dynamically to show stats
			const { getExportStats } = await import('../utils/pdfExport');

			const stats = getExportStats(components);
			console.log('Export Statistics:', stats);
			console.log(`Total components: ${stats.totalComponents}`);
			console.log(`Filled components: ${stats.filledComponents}`);
			console.log(`Required components: ${stats.requiredComponents}`);
			console.log('Components by type:', stats.componentsByType);
			console.log('Components by page:', stats.componentsByPage);

			try {
				const result = await exportPDFWithComponents(pdfUrl, components, {
					fileName,
					quality: 'medium',
				});

				if (result.success) {
					console.log('PDF exported with stats tracking');
				}

				return result;
			} catch (error) {
				console.error('Export error:', error);
				return { success: false, error: error.message };
			}
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'ExportPanel with statistics tracking. Check the console to see export statistics before PDF generation.',
			},
		},
	},
};

export const ExportErrorHandling: Story = {
	args: {
		components: sampleComponents,
		pdfUrl: 'https://invalid-url.com/nonexistent.pdf',
		fileName: 'error-test.pdf',
		onExport: async (components, pdfUrl, fileName) => {
			console.log('Testing error handling with invalid PDF URL');

			try {
				const result = await exportPDFWithComponents(pdfUrl, components, {
					fileName,
				});

				if (result.success) {
					console.log('Unexpected success');
				} else {
					console.error('Expected error occurred:', result.error);
					alert(`Export failed: ${result.error}`);
				}

				return result;
			} catch (error) {
				console.error('Caught error:', error);
				return { success: false, error: error.message };
			}
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'ExportPanel demonstrating error handling with invalid PDF URL. This should show an error message.',
			},
		},
	},
};
