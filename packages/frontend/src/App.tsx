import type React from 'react';
import DocumentsModule from './components/DocumentsModule';

const App: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="container mx-auto px-4">
				<h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Firma Sign Frontend</h1>
				<DocumentsModule />
			</div>
		</div>
	);
};

export default App;
