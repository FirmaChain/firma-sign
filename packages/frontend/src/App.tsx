import type React from 'react';
import DocumentsModule from './components/DocumentsModule';

const App: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="container mx-auto relative bg-white">
				<h1 className="text-4xl font-bold text-center text-gray-900 bg-gray-100">
					Firma Sign Frontend
				</h1>
				<DocumentsModule />
			</div>
		</div>
	);
};

export default App;
