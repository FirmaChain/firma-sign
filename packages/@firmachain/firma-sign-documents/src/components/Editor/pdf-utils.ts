// Import PDF base64 data from text files
import samplePdfBase64 from '../../assets/sample-pdf.txt?raw';
import multiPagePdfBase64 from '../../assets/multi-page-pdf.txt?raw';

// Base64 encoded PDF with sample content
export const SAMPLE_PDF_BASE64 = `data:application/pdf;base64,${samplePdfBase64}`;

// Multiple page PDF for more complex testing
export const MULTI_PAGE_PDF_BASE64 = `data:application/pdf;base64,${multiPagePdfBase64}`;

// Fallback URLs that should work for CORS
export const FALLBACK_PDF_URLS = [
	SAMPLE_PDF_BASE64,
	MULTI_PAGE_PDF_BASE64,
	// Add more fallback URLs as needed
];

// Function to try multiple PDF sources with fallback
export function tryPDFSources(primaryUrl: string): string[] {
	return [primaryUrl, ...FALLBACK_PDF_URLS].filter(Boolean);
}

// Function to check if a URL is a data URL
export function isDataURL(url: string): boolean {
	return url.startsWith('data:');
}

// Function to create a CORS-friendly URL
export function makeCORSFriendly(url: string): string {
	if (isDataURL(url)) {
		return url;
	}

	// For development/testing, you might want to use a CORS proxy
	// Note: This is just for testing, don't use in production
	return url;
}
