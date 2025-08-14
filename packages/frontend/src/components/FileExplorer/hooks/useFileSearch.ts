import { useState, useCallback, useMemo } from 'react';
import type { FileItem } from '../types';
import { searchFiles } from '../utils';

export const useFileSearch = (files: FileItem[]) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchHistory, setSearchHistory] = useState<string[]>([]);

	const filteredFiles = useMemo(() => {
		if (!searchQuery.trim()) return files;
		return searchFiles(files, searchQuery);
	}, [files, searchQuery]);

	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		if (query.trim() && !searchHistory.includes(query)) {
			setSearchHistory((prev) => [query, ...prev.slice(0, 4)]);
		}
	}, [searchHistory]);

	const clearSearch = useCallback(() => {
		setSearchQuery('');
	}, []);

	const highlightMatch = useCallback((text: string, query: string) => {
		if (!query) return text;
		const regex = new RegExp(`(${query})`, 'gi');
		return text.replace(regex, '<mark>$1</mark>');
	}, []);

	return {
		searchQuery,
		filteredFiles,
		searchHistory,
		handleSearch,
		clearSearch,
		highlightMatch,
	};
};