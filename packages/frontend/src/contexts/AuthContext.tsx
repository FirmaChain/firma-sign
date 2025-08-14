import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

interface AuthContextType {
	isAuthenticated: boolean;
	token: string | null;
	connect: (code: string, transport?: string) => Promise<void>;
	disconnect: () => void;
}

const AuthContext = createContext<AuthContextType>({
	isAuthenticated: false,
	token: null,
	connect: async () => {},
	disconnect: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [token, setToken] = useState<string | null>(null);

	// Check for existing token on mount
	useEffect(() => {
		const savedToken = localStorage.getItem('authToken');
		if (savedToken) {
			setToken(savedToken);
		}
	}, []);

	const connect = useCallback(async (code: string, transport?: string) => {
		try {
			const response = await authAPI.connect(code, transport);
			if (response.sessionToken) {
				setToken(response.sessionToken);
				localStorage.setItem('authToken', response.sessionToken);
			}
		} catch (error) {
			console.error('Failed to connect:', error);
			throw error;
		}
	}, []);

	const disconnect = useCallback(() => {
		setToken(null);
		localStorage.removeItem('authToken');
	}, []);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated: !!token,
				token,
				connect,
				disconnect,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};