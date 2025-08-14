import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
	onSearch?: () => void;
	onDelete?: () => void;
	onRename?: () => void;
	onNewFolder?: () => void;
	onUpload?: () => void;
	onSelectAll?: () => void;
	onRefresh?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig, isActive = true) => {
	useEffect(() => {
		if (!isActive) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			// Ctrl/Cmd + F: Focus search
			if (modKey && e.key === 'f') {
				e.preventDefault();
				config.onSearch?.();
			}

			// Delete key: Delete selected
			if (e.key === 'Delete' && !modKey) {
				e.preventDefault();
				config.onDelete?.();
			}

			// F2: Rename selected
			if (e.key === 'F2') {
				e.preventDefault();
				config.onRename?.();
			}

			// Ctrl/Cmd + Shift + N: New folder
			if (modKey && e.shiftKey && e.key === 'N') {
				e.preventDefault();
				config.onNewFolder?.();
			}

			// Ctrl/Cmd + U: Upload file
			if (modKey && e.key === 'u') {
				e.preventDefault();
				config.onUpload?.();
			}

			// Ctrl/Cmd + A: Select all
			if (modKey && e.key === 'a') {
				e.preventDefault();
				config.onSelectAll?.();
			}

			// F5 or Ctrl/Cmd + R: Refresh
			if (e.key === 'F5' || (modKey && e.key === 'r')) {
				e.preventDefault();
				config.onRefresh?.();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [config, isActive]);
};