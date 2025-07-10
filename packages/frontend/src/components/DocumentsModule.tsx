import { Editor, SAMPLE_PDF_BASE64, USER_COLORS } from '@firma-sign/documents';
import type React from 'react';

const DocumentsModule: React.FC = () => {
	return (
		<div className="flex items-center justify-center min-h-screen">
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
				fileUrl={SAMPLE_PDF_BASE64}
				fileId="floating-panels-demo"
				contractId="contract-floating"
			/>
		</div>
	);
};

export default DocumentsModule;
