import type React from 'react';
import DocumentsModule from './components/DocumentsModule';

const App: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-100">
			<div className="container mx-auto h-screen flex flex-col bg-white shadow-lg">
				<header className="flex-shrink-0 bg-white border-b border-gray-200">
					<h1 className="text-3xl font-bold text-center text-gray-900 py-6 px-4">
						Firma Sign - PDF Document Editor
					</h1>
				</header>

				<main className="flex-1 overflow-hidden">
					<DocumentsModule />
				</main>
			</div>
		</div>
	);
};

export default App;
