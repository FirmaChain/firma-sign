import type React from 'react';
import { useCallback, useState } from 'react';

interface PDFUploaderProps {
	onUpload: (pdfDataUrl: string) => void;
	onClear: () => void;
	hasUploadedFile: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload, onClear, hasUploadedFile }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const validateFile = (file: File): string | null => {
		// Check file type
		if (file.type !== 'application/pdf') {
			return 'Please select a valid PDF file.';
		}

		// Check file size (limit to 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (file.size > maxSize) {
			return 'File size must be less than 10MB.';
		}

		return null;
	};

	const processFile = useCallback(
		(file: File) => {
			setIsProcessing(true);
			setUploadError(null);

			try {
				// Validate file
				const error = validateFile(file);
				if (error) {
					setUploadError(error);
					return;
				}

				// Convert file to base64 data URL
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result;
					if (typeof result === 'string') {
						onUpload(result);
					}
				};
				reader.onerror = () => {
					setUploadError('Failed to read the file. Please try again.');
				};
				reader.readAsDataURL(file);
			} catch {
				setUploadError('An error occurred while processing the file.');
			} finally {
				setIsProcessing(false);
			}
		},
		[onUpload],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				void processFile(file);
			}
		},
		[processFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				void processFile(files[0]);
			}
		},
		[processFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleClear = useCallback(() => {
		onClear();
		setUploadError(null);
	}, [onClear]);

	return (
		<div className="w-full max-w-md mx-auto">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Upload PDF Document</h3>
				<p className="text-sm text-gray-600">
					{hasUploadedFile
						? 'PDF uploaded successfully!'
						: 'Upload your own PDF or use the sample document below.'}
				</p>
			</div>

			{!hasUploadedFile ? (
				<div
					className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
						isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
					}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
				>
					<input
						type="file"
						accept=".pdf,application/pdf"
						onChange={handleFileSelect}
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						disabled={isProcessing}
					/>

					<div className="flex flex-col items-center space-y-2">
						<svg
							className="w-12 h-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>

						{isProcessing ? (
							<div className="flex items-center space-x-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
								<span className="text-sm text-gray-600">Processing...</span>
							</div>
						) : (
							<>
								<div className="text-sm text-gray-600">
									<span className="font-medium text-blue-600 hover:text-blue-500">
										Click to upload
									</span>{' '}
									or drag and drop
								</div>
								<p className="text-xs text-gray-500">PDF files only (max 10MB)</p>
							</>
						)}
					</div>
				</div>
			) : (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="flex-shrink-0">
							<svg
								className="w-6 h-6 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-green-800">PDF uploaded successfully!</p>
							<p className="text-xs text-green-600">Ready for editing</p>
						</div>
					</div>
					<button
						onClick={handleClear}
						className="text-green-600 hover:text-green-800 text-sm font-medium"
					>
						Upload Different PDF
					</button>
				</div>
			)}

			{uploadError && (
				<div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
					<div className="flex items-center space-x-2">
						<svg
							className="w-5 h-5 text-red-500 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p className="text-sm text-red-700">{uploadError}</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default PDFUploader;
