import type React from 'react';
import DocumentsModule from './components/DocumentsModule';

const App: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-100">
			<div className="container mx-auto h-screen flex flex-col bg-white shadow-lg">
				<header className="flex-shrink-0 bg-white border-b border-gray-200">
					<h1 className="text-3xl font-bold text-center text-gray-900 pt-6 px-4">firma-sign</h1>
					<h4 className="text-center text-gray-500 pb-6 px-4">
						Zero‑friction digital signatures — anywhere, any device, no lock‑in.
					</h4>
				</header>

				<main className="flex-1 overflow-hidden">
					<DocumentsModule />
				</main>
			</div>
		</div>
	);
};

export default App;
