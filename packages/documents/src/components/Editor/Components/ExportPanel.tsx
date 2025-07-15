import React, { useState } from 'react';
import { DocumentComponent } from '../types';
import { usePDFExport } from '../hooks/usePDFExport';
import { ExportOptions } from '../utils/pdfExport';

interface ExportPanelProps {
	components: DocumentComponent[];
	pdfUrl?: string;
	fileName?: string;
	className?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
	components,
	pdfUrl,
	fileName,
	className,
}) => {
	const [exportOptions, setExportOptions] = useState<ExportOptions>({
		quality: 'medium',
		includeFormFields: true,
		flattenComponents: false,
	});
	const [showAdvanced, setShowAdvanced] = useState(false);

	const { isExporting, exportPDF, previewExport, getStats, validateExport } = usePDFExport({
		onExportSuccess: (result) => {
			console.log('Export successful:', result.fileName);
		},
		onExportError: (error) => {
			console.error('Export failed:', error);
			alert(`Export failed: ${error}`);
		},
	});

	const stats = getStats(components);
	const validation = validateExport(components);

	const handleExport = async () => {
		if (!pdfUrl) {
			alert('No PDF file available for export');
			return;
		}

		if (!validation.isValid) {
			const proceed = confirm(
				`There are ${validation.missingRequired.length} required components that haven't been filled out. Export anyway?`,
			);
			if (!proceed) return;
		}

		await exportPDF(pdfUrl, components, {
			...exportOptions,
			fileName: fileName || `document-${Date.now()}.pdf`,
		});
	};

	const handlePreview = async () => {
		if (!pdfUrl) {
			alert('No PDF file available for preview');
			return;
		}

		await previewExport(pdfUrl, components, exportOptions);
	};

	const canExport = components.length > 0 && pdfUrl && !isExporting;

	return (
		<div className={`bg-white border-t border-gray-200 p-4 space-y-4 ${className}`}>
			{/* Export Statistics */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Export Statistics</h3>
				<div className="grid grid-cols-2 gap-2 text-xs">
					<div className="flex justify-between">
						<span className="text-gray-600">Total Components:</span>
						<span className="font-medium">{stats.totalComponents}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Filled Out:</span>
						<span className="font-medium text-green-600">{stats.filledComponents}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Required:</span>
						<span className="font-medium text-orange-600">{stats.requiredComponents}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-600">Pages:</span>
						<span className="font-medium">{Object.keys(stats.componentsByPage).length}</span>
					</div>
				</div>
			</div>

			{/* Validation Warnings */}
			{validation.warnings.length > 0 && (
				<div className="space-y-1">
					<h4 className="text-xs font-medium text-orange-600">Warnings:</h4>
					<ul className="text-xs text-orange-600 space-y-1">
						{validation.warnings.map((warning, index) => (
							<li key={index} className="flex items-start gap-1">
								<span>⚠️</span>
								<span>{warning}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Missing Required */}
			{validation.missingRequired.length > 0 && (
				<div className="space-y-1">
					<h4 className="text-xs font-medium text-red-600">Missing Required:</h4>
					<ul className="text-xs text-red-600 space-y-1">
						{validation.missingRequired.map((component) => (
							<li key={component.id} className="flex items-start gap-1">
								<span>❌</span>
								<span>
									{component.type} on page {component.pageNumber + 1}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Export Options */}
			<div className="space-y-2">
				<button
					onClick={() => setShowAdvanced(!showAdvanced)}
					className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
				>
					<span>{showAdvanced ? '▼' : '▶'}</span>
					<span>Export Options</span>
				</button>

				{showAdvanced && (
					<div className="space-y-3 pl-4 border-l-2 border-gray-100">
						{/* Quality Setting */}
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Quality</label>
							<select
								value={exportOptions.quality}
								onChange={(e) =>
									setExportOptions((prev) => ({
										...prev,
										quality: e.target.value as 'low' | 'medium' | 'high',
									}))
								}
								className="w-full text-xs border border-gray-300 rounded px-2 py-1"
							>
								<option value="low">Low (Fast)</option>
								<option value="medium">Medium (Balanced)</option>
								<option value="high">High (Best Quality)</option>
							</select>
						</div>

						{/* Form Fields */}
						<div>
							<label className="flex items-center gap-2 text-xs">
								<input
									type="checkbox"
									checked={exportOptions.includeFormFields}
									onChange={(e) =>
										setExportOptions((prev) => ({
											...prev,
											includeFormFields: e.target.checked,
										}))
									}
									className="rounded"
								/>
								<span>Include Form Fields</span>
							</label>
							<p className="text-xs text-gray-500 mt-1">
								Keep PDF form fields editable in exported document
							</p>
						</div>

						{/* Flatten Components */}
						<div>
							<label className="flex items-center gap-2 text-xs">
								<input
									type="checkbox"
									checked={exportOptions.flattenComponents}
									onChange={(e) =>
										setExportOptions((prev) => ({
											...prev,
											flattenComponents: e.target.checked,
										}))
									}
									className="rounded"
								/>
								<span>Flatten Components</span>
							</label>
							<p className="text-xs text-gray-500 mt-1">
								Merge components permanently into the PDF
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Export Actions */}
			<div className="space-y-2">
				<div className="flex gap-2">
					<button
						onClick={handlePreview}
						disabled={!canExport}
						className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isExporting ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Processing...</span>
							</>
						) : (
							<>
								<span>👁️</span>
								<span>Preview</span>
							</>
						)}
					</button>

					<button
						onClick={handleExport}
						disabled={!canExport}
						className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isExporting ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Exporting...</span>
							</>
						) : (
							<>
								<span>📄</span>
								<span>Export PDF</span>
							</>
						)}
					</button>
				</div>

				{!canExport && !isExporting && (
					<p className="text-xs text-gray-500 text-center">
						{components.length === 0
							? 'Add components to enable export'
							: !pdfUrl
								? 'No PDF loaded'
								: 'Export not available'}
					</p>
				)}
			</div>

			{/* Component Type Breakdown */}
			{showAdvanced && Object.keys(stats.componentsByType).length > 0 && (
				<div className="space-y-2">
					<h4 className="text-xs font-medium text-gray-700">Components by Type:</h4>
					<div className="grid grid-cols-2 gap-1 text-xs">
						{Object.entries(stats.componentsByType).map(([type, count]) => (
							<div key={type} className="flex justify-between">
								<span className="text-gray-600 capitalize">{type.toLowerCase()}:</span>
								<span className="font-medium">{count}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
