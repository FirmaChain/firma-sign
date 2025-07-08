import type React from 'react';
import { useState } from 'react';
import { Button } from '@firma-sign/documents';

const DocumentsModule: React.FC = () => {
	const [isLoading, setIsLoading] = useState(false);

	const loadWebsite = () => {
		setIsLoading(true);
		window.open('https://firmachain.org', '_blank');
		setTimeout(() => setIsLoading(false), 1000);
	};

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Button onClick={loadWebsite} disabled={isLoading} variant="primary" size="lg">
				{isLoading ? 'Loading...' : 'Load Website'}
			</Button>
		</div>
	);
};

export default DocumentsModule;
