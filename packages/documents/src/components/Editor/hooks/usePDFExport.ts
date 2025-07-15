import { useCallback, useState } from 'react';
import { DocumentComponent } from '../types';
import { 
	exportPDFWithComponents, 
	previewPDF, 
	getExportStats,
	ExportOptions, 
	ExportResult 
} from '../utils/pdfExport';

export interface UsePDFExportOptions {
	onExportStart?: () => void;
	onExportSuccess?: (result: ExportResult) => void;
	onExportError?: (error: string) => void;
}

export interface UsePDFExportReturn {
	isExporting: boolean;
	exportPDF: (
		pdfUrl: string,
		components: DocumentComponent[],
		options?: ExportOptions
	) => Promise<ExportResult>;
	previewExport: (
		pdfUrl: string,
		components: DocumentComponent[],
		options?: ExportOptions
	) => Promise<ExportResult>;
	getStats: (components: DocumentComponent[]) => ReturnType<typeof getExportStats>;
	validateExport: (components: DocumentComponent[]) => {
		isValid: boolean;
		missingRequired: DocumentComponent[];
		warnings: string[];
	};
}

export const usePDFExport = (options: UsePDFExportOptions = {}): UsePDFExportReturn => {
	const { onExportStart, onExportSuccess, onExportError } = options;
	const [isExporting, setIsExporting] = useState(false);

	const exportPDF = useCallback(async (
		pdfUrl: string,
		components: DocumentComponent[],
		exportOptions: ExportOptions = {}
	): Promise<ExportResult> => {
		setIsExporting(true);
		onExportStart?.();

		try {
			const result = await exportPDFWithComponents(pdfUrl, components, exportOptions);
			
			if (result.success) {
				onExportSuccess?.(result);
			} else {
				onExportError?.(result.error || 'Export failed');
			}
			
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
			onExportError?.(errorMessage);
			return {
				success: false,
				error: errorMessage,
			};
		} finally {
			setIsExporting(false);
		}
	}, [onExportStart, onExportSuccess, onExportError]);

	const previewExport = useCallback(async (
		pdfUrl: string,
		components: DocumentComponent[],
		exportOptions: ExportOptions = {}
	): Promise<ExportResult> => {
		setIsExporting(true);
		onExportStart?.();

		try {
			const result = await exportPDFWithComponents(pdfUrl, components, {
				...exportOptions,
				fileName: undefined, // Don't download for preview
			});
			
			if (result.success && result.pdfBytes) {
				previewPDF(result.pdfBytes);
				onExportSuccess?.(result);
			} else {
				onExportError?.(result.error || 'Preview failed');
			}
			
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown preview error';
			onExportError?.(errorMessage);
			return {
				success: false,
				error: errorMessage,
			};
		} finally {
			setIsExporting(false);
		}
	}, [onExportStart, onExportSuccess, onExportError]);

	const getStats = useCallback((components: DocumentComponent[]) => {
		return getExportStats(components);
	}, []);

	const validateExport = useCallback((components: DocumentComponent[]) => {
		const missingRequired: DocumentComponent[] = [];
		const warnings: string[] = [];

		// Check for required components without values
		components.forEach(component => {
			if (component.config?.required && !component.value) {
				missingRequired.push(component);
			}
		});

		// Add warnings
		if (components.length === 0) {
			warnings.push('No components to export');
		}

		const stats = getExportStats(components);
		if (stats.filledComponents === 0) {
			warnings.push('No components have been filled out');
		}

		if (stats.filledComponents < stats.totalComponents / 2) {
			warnings.push('Less than half of the components have been filled out');
		}

		return {
			isValid: missingRequired.length === 0,
			missingRequired,
			warnings,
		};
	}, []);

	return {
		isExporting,
		exportPDF,
		previewExport,
		getStats,
		validateExport,
	};
};