import { Editor, SAMPLE_PDF_BASE64, USER_COLORS } from '@firmachain/firma-sign-documents';
import type React from 'react';
import { useState, useEffect } from 'react';
import PDFUploader from './PDFUploader';
import type { FileItem } from './FileExplorer/types';

interface DocumentsModuleProps {
	selectedFile?: FileItem | null;
}

const DocumentsModule: React.FC<DocumentsModuleProps> = ({ selectedFile }) => {
	const [uploadedPDF, setUploadedPDF] = useState<string | null>(null);
	const [isUploadSectionVisible, setIsUploadSectionVisible] = useState(false);

	// Update uploaded PDF when a file is selected from the explorer
	useEffect(() => {
		if (selectedFile && selectedFile.type === 'file' && selectedFile.data) {
			setUploadedPDF(selectedFile.data);
			setIsUploadSectionVisible(false);
		}
	}, [selectedFile]);

	const handlePDFUpload = (pdfDataUrl: string) => {
		setUploadedPDF(pdfDataUrl);
	};

	const handleClearPDF = () => {
		setUploadedPDF(null);
	};

	const toggleUploadSection = () => {
		setIsUploadSectionVisible(!isUploadSectionVisible);
	};

	// Use selected file, uploaded PDF, or sample PDF
	const currentPDFUrl = selectedFile?.data || uploadedPDF || SAMPLE_PDF_BASE64;
	const hasDocument = !!selectedFile?.data || !!uploadedPDF || !!SAMPLE_PDF_BASE64;
	const currentFileName = selectedFile?.name || (uploadedPDF ? 'uploaded-pdf' : 'sample-document');

	return (
		<div className="h-full flex flex-col">
			{/* PDF Upload Section with Toggle */}
			<div
				className={`flex-shrink-0 border-b border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out ${
					isUploadSectionVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
				}`}
			>
				<div
					className={`transition-all duration-300 ease-in-out ${isUploadSectionVisible ? 'p-4' : 'p-0'}`}
				>
					<PDFUploader
						onUpload={handlePDFUpload}
						onClear={handleClearPDF}
						hasUploadedFile={!!uploadedPDF}
					/>
				</div>
			</div>

			{/* File Info and Toggle Button */}
			{hasDocument && (
				<div className="flex-shrink-0 border-b border-gray-200 bg-white">
					<div className="px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600">Current file:</span>
							<span className="text-sm font-medium text-gray-800">{currentFileName}</span>
							{selectedFile?.status && (
								<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
									{selectedFile.status}
								</span>
							)}
						</div>
						<button
							onClick={toggleUploadSection}
							className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors duration-200"
						>
							<svg
								className={`w-4 h-4 transition-transform duration-200 ${
									isUploadSectionVisible ? 'rotate-0' : 'rotate-180'
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 15l7-7 7 7"
								/>
							</svg>
							{isUploadSectionVisible ? 'Hide Upload' : 'Upload New'}
						</button>
					</div>
				</div>
			)}

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
					fileId={selectedFile?.id || (uploadedPDF ? 'uploaded-pdf' : 'floating-panels-demo')}
					contractId="contract-floating"
					className="w-full h-full"
				/>
			</div>
		</div>
	);
};

export default DocumentsModule;
