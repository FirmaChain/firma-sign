import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentComponent, ComponentType } from '../types';

export interface ExportOptions {
	fileName?: string;
	quality?: 'low' | 'medium' | 'high';
	includeFormFields?: boolean;
	flattenComponents?: boolean;
}

export interface ExportResult {
	success: boolean;
	fileName?: string;
	error?: string;
	pdfBytes?: Uint8Array;
}

/**
 * Export PDF with components overlaid
 */
export async function exportPDFWithComponents(
	originalPdfUrl: string,
	components: DocumentComponent[],
	options: ExportOptions = {}
): Promise<ExportResult> {
	try {
		const {
			fileName = `document-${Date.now()}.pdf`,
			quality = 'medium',
			includeFormFields = true,
			flattenComponents = false,
		} = options;

		// Fetch the original PDF
		const response = await fetch(originalPdfUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch PDF: ${response.statusText}`);
		}

		const originalPdfBytes = await response.arrayBuffer();
		const pdfDoc = await PDFDocument.load(originalPdfBytes);

		// Get font for text rendering
		const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
		const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		// Group components by page
		const componentsByPage = new Map<number, DocumentComponent[]>();
		components.forEach(component => {
			const pageNum = component.pageNumber;
			if (!componentsByPage.has(pageNum)) {
				componentsByPage.set(pageNum, []);
			}
			componentsByPage.get(pageNum)!.push(component);
		});

		// Process each page that has components
		const pages = pdfDoc.getPages();
		for (const [pageIndex, pageComponents] of componentsByPage.entries()) {
			if (pageIndex >= pages.length) continue;

			const page = pages[pageIndex];
			const { width: pageWidth, height: pageHeight } = page.getSize();

			// Sort components by creation time (z-index)
			const sortedComponents = pageComponents.sort((a, b) => 
				(a.created || 0) - (b.created || 0)
			);

			// Draw each component on the page
			for (const component of sortedComponents) {
				await drawComponentOnPage(page, component, font, boldFont, pageWidth, pageHeight, quality);
			}
		}

		// Serialize the PDF
		const pdfBytes = await pdfDoc.save();

		// Download the file
		downloadPDF(pdfBytes, fileName);

		return {
			success: true,
			fileName,
			pdfBytes,
		};

	} catch (error) {
		console.error('PDF export error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

/**
 * Draw a component on a PDF page
 */
async function drawComponentOnPage(
	page: any,
	component: DocumentComponent,
	font: any,
	boldFont: any,
	pageWidth: number,
	pageHeight: number,
	quality: 'low' | 'medium' | 'high'
) {
	const { position, size, type, value, config, assigned } = component;

	// Convert coordinates (PDF coordinate system has origin at bottom-left)
	const x = position.x;
	const y = pageHeight - position.y - size.height;
	const width = size.width;
	const height = size.height;

	// Get colors
	const borderColor = assigned?.color ? hexToRgb(assigned.color) : rgb(0.4, 0.4, 0.4);
	const textColor = config?.color ? hexToRgb(config.color) : rgb(0, 0, 0);
	const backgroundColor = config?.backgroundColor ? hexToRgb(config.backgroundColor) : null;

	// Draw background if specified
	if (backgroundColor && backgroundColor.r !== 1 && backgroundColor.g !== 1 && backgroundColor.b !== 1) {
		page.drawRectangle({
			x,
			y,
			width,
			height,
			color: backgroundColor,
		});
	}

	switch (type) {
		case ComponentType.TEXT:
		case ComponentType.INPUT_FIELD:
			if (value) {
				const fontSize = Math.min(config?.fontSize || 12, height * 0.8);
				const textWidth = font.widthOfTextAtSize(value, fontSize);
				
				// Center text if it fits, otherwise left align
				const textX = textWidth <= width - 8 ? x + (width - textWidth) / 2 : x + 4;
				const textY = y + (height - fontSize) / 2;

				page.drawText(value, {
					x: textX,
					y: textY,
					size: fontSize,
					font,
					color: textColor,
				});
			}
			
			// Draw border for input fields
			if (type === ComponentType.INPUT_FIELD) {
				page.drawRectangle({
					x,
					y,
					width,
					height,
					borderColor,
					borderWidth: 1,
				});
			}
			break;

		case ComponentType.CHECKBOX:
			// Draw checkbox border
			page.drawRectangle({
				x,
				y,
				width,
				height,
				borderColor,
				borderWidth: 2,
			});

			// Draw checkmark if checked
			if (value === 'true' || value === true) {
				// Draw a checkmark using lines
				const checkSize = Math.min(width, height) * 0.6;
				const checkboxCenterX = x + width / 2;
				const checkboxCenterY = y + height / 2;
				const checkboxHalfSize = checkSize / 2;

				// Draw checkmark as two lines forming a "check" shape
				// First line: bottom-left to center
				page.drawLine({
					start: { x: checkboxCenterX - checkboxHalfSize * 0.6, y: checkboxCenterY - checkboxHalfSize * 0.2 },
					end: { x: checkboxCenterX - checkboxHalfSize * 0.1, y: checkboxCenterY - checkboxHalfSize * 0.6 },
					thickness: 2,
					color: borderColor,
				});
				// Second line: center to top-right
				page.drawLine({
					start: { x: checkboxCenterX - checkboxHalfSize * 0.1, y: checkboxCenterY - checkboxHalfSize * 0.6 },
					end: { x: checkboxCenterX + checkboxHalfSize * 0.6, y: checkboxCenterY + checkboxHalfSize * 0.4 },
					thickness: 2,
					color: borderColor,
				});
			}
			break;

		case ComponentType.CHECKMARK:
			// Draw a checkmark using lines
			const checkmarkSize = Math.min(width, height) * 0.8;
			const checkmarkCenterX = x + width / 2;
			const checkmarkCenterY = y + height / 2;
			const checkmarkHalfSize = checkmarkSize / 2;

			// Draw checkmark as two lines forming a "check" shape
			// First line: bottom-left to center
			page.drawLine({
				start: { x: checkmarkCenterX - checkmarkHalfSize * 0.6, y: checkmarkCenterY - checkmarkHalfSize * 0.2 },
				end: { x: checkmarkCenterX - checkmarkHalfSize * 0.1, y: checkmarkCenterY - checkmarkHalfSize * 0.6 },
				thickness: 3,
				color: borderColor,
			});
			// Second line: center to top-right
			page.drawLine({
				start: { x: checkmarkCenterX - checkmarkHalfSize * 0.1, y: checkmarkCenterY - checkmarkHalfSize * 0.6 },
				end: { x: checkmarkCenterX + checkmarkHalfSize * 0.6, y: checkmarkCenterY + checkmarkHalfSize * 0.4 },
				thickness: 3,
				color: borderColor,
			});
			break;

		case ComponentType.SIGNATURE:
			// Draw signature border
			page.drawRectangle({
				x,
				y,
				width,
				height,
				borderColor,
				borderWidth: 2,
				borderDashArray: [5, 5],
			});

			// Draw signature text if signed
			if (value) {
				const sigText = 'SIGNED';
				const sigFontSize = Math.min(height * 0.4, 12);
				const sigTextWidth = boldFont.widthOfTextAtSize(sigText, sigFontSize);
				const sigX = x + (width - sigTextWidth) / 2;
				const sigY = y + height / 2 - sigFontSize / 2;

				page.drawText(sigText, {
					x: sigX,
					y: sigY,
					size: sigFontSize,
					font: boldFont,
					color: rgb(0, 0.6, 0),
				});
			}
			break;

		case ComponentType.STAMP:
			// Draw stamp circle
			const radius = Math.min(width, height) / 2;
			const stampCenterX = x + width / 2;
			const stampCenterY = y + height / 2;

			page.drawCircle({
				x: stampCenterX,
				y: stampCenterY,
				size: radius,
				borderColor,
				borderWidth: 3,
			});

			// Draw stamp text
			const stampText = 'APPROVED';
			const stampFontSize = radius * 0.4;
			const stampTextWidth = boldFont.widthOfTextAtSize(stampText, stampFontSize);
			const stampX = stampCenterX - stampTextWidth / 2;
			const stampY = stampCenterY - stampFontSize / 2;

			page.drawText(stampText, {
				x: stampX,
				y: stampY,
				size: stampFontSize,
				font: boldFont,
				color: borderColor,
			});
			break;

		case ComponentType.DATE:
			if (value) {
				const dateString = new Date(value).toLocaleDateString();
				const dateFontSize = Math.min(config?.fontSize || 12, height * 0.8);
				const dateTextWidth = font.widthOfTextAtSize(dateString, dateFontSize);
				const dateX = x + (width - dateTextWidth) / 2;
				const dateY = y + (height - dateFontSize) / 2;

				page.drawText(dateString, {
					x: dateX,
					y: dateY,
					size: dateFontSize,
					font,
					color: textColor,
				});
			}

			// Draw border
			page.drawRectangle({
				x,
				y,
				width,
				height,
				borderColor,
				borderWidth: 1,
			});
			break;

		case ComponentType.RECTANGLE:
			page.drawRectangle({
				x,
				y,
				width,
				height,
				color: backgroundColor,
				borderColor,
				borderWidth: config?.borderWidth || 2,
			});
			break;

		case ComponentType.CIRCLE:
			const circleRadius = Math.min(width, height) / 2;
			const circleCenterX = x + width / 2;
			const circleCenterY = y + height / 2;

			page.drawCircle({
				x: circleCenterX,
				y: circleCenterY,
				size: circleRadius,
				color: backgroundColor,
				borderColor,
				borderWidth: config?.borderWidth || 2,
			});
			break;

		case ComponentType.LINE:
			const lineY = y + height / 2;
			page.drawLine({
				start: { x, y: lineY },
				end: { x: x + width, y: lineY },
				thickness: config?.borderWidth || 2,
				color: borderColor,
			});
			break;

		case ComponentType.EXTRA:
			// Draw dashed border for extra components
			page.drawRectangle({
				x,
				y,
				width,
				height,
				borderColor,
				borderWidth: 1,
				borderDashArray: [3, 3],
			});

			if (value) {
				const extraFontSize = Math.min(config?.fontSize || 10, height * 0.6);
				const extraTextWidth = font.widthOfTextAtSize(value, extraFontSize);
				const extraX = x + (width - extraTextWidth) / 2;
				const extraY = y + (height - extraFontSize) / 2;

				page.drawText(value, {
					x: extraX,
					y: extraY,
					size: extraFontSize,
					font,
					color: textColor,
				});
			}
			break;
	}
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (result) {
		return rgb(
			parseInt(result[1], 16) / 255,
			parseInt(result[2], 16) / 255,
			parseInt(result[3], 16) / 255
		);
	}
	return rgb(0, 0, 0);
}

/**
 * Download PDF file
 */
function downloadPDF(pdfBytes: Uint8Array, fileName: string) {
	const blob = new Blob([pdfBytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Preview PDF in new tab
 */
export function previewPDF(pdfBytes: Uint8Array) {
	const blob = new Blob([pdfBytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	window.open(url, '_blank');
	
	// Clean up after a delay
	setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Get export statistics
 */
export function getExportStats(components: DocumentComponent[]): {
	totalComponents: number;
	componentsByType: Record<string, number>;
	componentsByPage: Record<number, number>;
	filledComponents: number;
	requiredComponents: number;
} {
	const stats = {
		totalComponents: components.length,
		componentsByType: {} as Record<string, number>,
		componentsByPage: {} as Record<number, number>,
		filledComponents: 0,
		requiredComponents: 0,
	};

	components.forEach(component => {
		// Count by type
		stats.componentsByType[component.type] = (stats.componentsByType[component.type] || 0) + 1;
		
		// Count by page
		stats.componentsByPage[component.pageNumber] = (stats.componentsByPage[component.pageNumber] || 0) + 1;
		
		// Count filled components
		if (component.value) {
			stats.filledComponents++;
		}
		
		// Count required components
		if (component.config?.required) {
			stats.requiredComponents++;
		}
	});

	return stats;
}