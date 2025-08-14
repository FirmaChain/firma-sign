import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ContextMenuItem, ContextMenuPosition } from './types';

interface ContextMenuProps {
	items: ContextMenuItem[];
	position: ContextMenuPosition;
	onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose }) => {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [onClose]);

	// Adjust position to prevent menu from going off-screen
	useEffect(() => {
		if (menuRef.current) {
			const rect = menuRef.current.getBoundingClientRect();
			const { innerWidth, innerHeight } = window;

			if (rect.right > innerWidth) {
				menuRef.current.style.left = `${position.x - rect.width}px`;
			}
			if (rect.bottom > innerHeight) {
				menuRef.current.style.top = `${position.y - rect.height}px`;
			}
		}
	}, [position]);

	return (
		<div
			ref={menuRef}
			className="fixed z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 min-w-[150px]"
			style={{ left: position.x, top: position.y }}
		>
			{items.map((item, index) => {
				if (item.divider) {
					return <div key={index} className="border-t border-gray-600 my-1" />;
				}

				return (
					<button
						key={index}
						className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors ${
							item.disabled
								? 'text-gray-500 cursor-not-allowed'
								: 'text-gray-200 hover:bg-gray-700'
						}`}
						onClick={() => {
							if (!item.disabled) {
								item.action();
								onClose();
							}
						}}
						disabled={item.disabled}
					>
						{item.icon && <span className="w-4 h-4">{item.icon}</span>}
						<span>{item.label}</span>
					</button>
				);
			})}
		</div>
	);
};

export default ContextMenu;