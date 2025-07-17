import { Editor, SAMPLE_PDF_BASE64, USER_COLORS } from '@firma-sign/documents';
import type React from 'react';
import { useState } from 'react';
import PDFUploader from './PDFUploader';

const DocumentsModule: React.FC = () => {
	const [uploadedPDF, setUploadedPDF] = useState<string | null>(null);

	const handlePDFUpload = (pdfDataUrl: string) => {
		setUploadedPDF(pdfDataUrl);
	};

	const handleClearPDF = () => {
		setUploadedPDF(null);
	};

	// Use uploaded PDF if available, otherwise use sample PDF
	const currentPDFUrl = uploadedPDF || SAMPLE_PDF_BASE64;

	return (
		<div className="h-full flex flex-col">
			{/* PDF Upload Section */}
			<div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
				<PDFUploader
					onUpload={handlePDFUpload}
					onClear={handleClearPDF}
					hasUploadedFile={!!uploadedPDF}
				/>
			</div>

			{/* Editor Component */}
			<div className="flex-1 overflow-hidden">
				<Editor
					signers={[
						{
							userId: '1',
							email: 'john.doe@example.com',
							name: 'John Doe',
							color: USER_COLORS[0],
						},
					]}
					components={[]}
					viewMode="editor"
					preview={false}
					hideActionBtn={false}
					hideSave={false}
					enableNext={false}
					fileUrl={currentPDFUrl}
					fileId={uploadedPDF ? 'uploaded-pdf' : 'floating-panels-demo'}
					contractId="contract-floating"
					className="w-full h-full"
				/>
			</div>
		</div>
	);
};

export default DocumentsModule;
