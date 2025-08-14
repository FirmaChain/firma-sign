import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthConnect: React.FC = () => {
	const { connect } = useAuth();
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim()) {
			setError('Please enter a transfer code');
			return;
		}

		setLoading(true);
		setError('');
		try {
			await connect(code.trim());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to connect');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-2xl font-bold mb-6 text-center">Connect to Firma-Sign</h2>
				<form onSubmit={(e) => void handleSubmit(e)}>
					<div className="mb-4">
						<label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
							Transfer Code
						</label>
						<input
							id="code"
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="Enter 6-character code"
							maxLength={6}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={loading}
						/>
					</div>
					{error && (
						<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
							{error}
						</div>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Connecting...' : 'Connect'}
					</button>
				</form>
				<div className="mt-6 text-center text-sm text-gray-600">
					<p>Enter the transfer code to access documents</p>
					<p className="mt-2">For demo, use: <strong>DEMO01</strong></p>
				</div>
			</div>
		</div>
	);
};

export default AuthConnect;