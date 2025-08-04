# PDF Loading Troubleshooting

If you're seeing "Failed to load PDF document" errors, here are some common solutions:

## 1. Worker Configuration

Make sure the PDF.js worker is properly configured. The component automatically sets up the worker, but if you're still having issues, you can manually configure it:

```tsx
import { pdfjs } from 'react-pdf';

// Option 1: Use CDN (recommended for development)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Option 2: Use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();
```

## 2. CORS Issues

If you're loading PDFs from external sources, ensure:

- The server supports CORS
- Set `withCredentials: false` for public PDFs
- Use a proxy server for PDFs that don't support CORS

## 3. File Format

Ensure your PDF file is:
- A valid PDF format
- Not corrupted
- Accessible via the provided URL

## 4. Testing with Local Files

For testing purposes, you can use:

```tsx
// Base64 encoded PDF
const base64PDF = 'data:application/pdf;base64,JVBERi0xLjQK...';

// Or a publicly accessible PDF
const publicPDF = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
```

## 5. Network Issues

- Check browser console for network errors
- Verify the PDF URL is accessible
- Try loading the PDF directly in the browser

## 6. Development vs Production

- In development: Use CDN worker for simplicity
- In production: Bundle the worker file with your app

## 7. Browser Compatibility

Ensure your browser supports:
- ES6 modules
- Web Workers
- Canvas API
- Fetch API

## Example Working Setup

```tsx
import { Editor } from '@firma-sign/documents';

function App() {
  return (
    <Editor
      fileUrl="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"
      viewMode="editor"
      fileId="test-file"
      contractId="test-contract"
    />
  );
}
```

## Debug Mode

The component includes debug information in development mode. Check the browser console for:
- PDF loading errors
- Worker initialization status
- Network request details

If issues persist, try the TestPDF component included in the package for basic functionality testing.