import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
// Use the Vite approach for modern bundlers
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

export { pdfjs };
