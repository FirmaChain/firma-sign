import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';
import { ComponentType, ViewMode, AssignedUser } from './types';

interface PaletteProps {
	signers: AssignedUser[];
	selectedTool?: ComponentType;
	onToolSelect?: (tool: ComponentType) => void;
	onUserSelect?: (user: AssignedUser) => void;
	viewMode?: ViewMode;
	className?: string;
}

interface MenuBoxProps {
	selectedName: string;
	toolName: string;
	isTemplate: boolean;
	signers?: AssignedUser[];
	handleSelect?: (signerOrIndex: AssignedUser) => void;
	onOutside?: () => void;
	// Toolbox props
	title: string;
	tooltip: string;
	onClick: (evt: React.MouseEvent) => void;
	iconKey: string;
	disabled?: boolean;
}

const MenuBox: React.FC<MenuBoxProps> = ({
	selectedName,
	toolName,
	isTemplate,
	signers,
	handleSelect,
	onOutside: _onOutside,
	title,
	tooltip,
	onClick,
	iconKey: _iconKey,
	disabled = false,
}) => {
	const isSelected = selectedName === toolName;

	return (
		<div className="relative w-full">
			<button
				onClick={onClick}
				disabled={disabled}
				className={cn(
					'w-full p-3 rounded-lg border transition-all duration-200',
					'flex items-center justify-center flex-col gap-2',
					'text-sm font-medium',
					isSelected
						? 'bg-blue-50 border-blue-200 text-blue-700'
						: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
					disabled && 'opacity-50 cursor-not-allowed',
				)}
				title={tooltip}
			>
				<div className="w-6 h-6 flex items-center justify-center">
					{/* Icon placeholder - would use actual icons */}
					<div className="w-4 h-4 bg-gray-400 rounded" />
				</div>
				<span className="text-xs">{title}</span>
			</button>

			{/* Dropdown/Popover for tool options */}
			{isSelected && (
				<div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
					<div className="p-3">
						<h4 className="font-medium text-gray-900 mb-2">{title}</h4>

						{/* Signer list for tools that need assignment */}
						{signers && signers.length > 0 && (
							<div className="space-y-2">
								<div className="text-xs text-gray-500 mb-2">Assign to:</div>
								{signers.map((signer) => (
									<button
										key={signer.email}
										onClick={() => handleSelect?.(signer)}
										className={cn(
											'w-full p-2 text-left rounded border transition-colors',
											'flex items-center gap-2',
											'hover:bg-gray-50',
										)}
									>
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: signer.color || '#3b82f6' }}
										/>
										<span className="text-sm">{signer.name}</span>
										<span className="text-xs text-gray-500">({signer.email})</span>
									</button>
								))}
							</div>
						)}

						{/* Template extras for certain tools */}
						{isTemplate && (
							<div className="mt-3 pt-3 border-t border-gray-200">
								<div className="text-xs text-gray-500 mb-2">Templates:</div>
								<div className="space-y-1">
									<button className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded">
										Template 1
									</button>
									<button className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded">
										Template 2
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export const Palette: React.FC<PaletteProps> = ({ signers, className }) => {
	const [selectedTool, setSelectedTool] = useState<string>('');

	const tools = useMemo(
		() => [
			{
				name: 'text',
				title: 'Text',
				tooltip: 'Add text field',
				iconKey: 'text',
				needsAssignment: true,
			},
			{
				name: 'signature',
				title: 'Signature',
				tooltip: 'Add signature field',
				iconKey: 'signature',
				needsAssignment: true,
			},
			{
				name: 'stamp',
				title: 'Stamp',
				tooltip: 'Add stamp field',
				iconKey: 'stamp',
				needsAssignment: true,
			},
			{
				name: 'checkbox',
				title: 'Checkbox',
				tooltip: 'Add checkbox',
				iconKey: 'checkbox',
				needsAssignment: true,
			},
			{
				name: 'checkmark',
				title: 'Checkmark',
				tooltip: 'Add checkmark',
				iconKey: 'checkmark',
				needsAssignment: true,
			},
			{
				name: 'textbox',
				title: 'Text Box',
				tooltip: 'Add text box',
				iconKey: 'textbox',
				needsAssignment: true,
			},
			{
				name: 'extradata',
				title: 'Extra Data',
				tooltip: 'Add extra data field',
				iconKey: 'extradata',
				needsAssignment: true,
			},
		],
		[],
	);

	const handleToolClick = useCallback(
		(toolName: string) => {
			setSelectedTool(selectedTool === toolName ? '' : toolName);
		},
		[selectedTool],
	);

	const handleSignerSelect = useCallback((signer: AssignedUser) => {
		console.log('Selected signer:', signer);
		// Handle signer selection logic
	}, []);

	return (
		<div
			className={cn('w-60 h-full bg-gray-50 border-r border-gray-200', 'flex flex-col', className)}
		>
			{/* Header */}
			<div className="p-4 border-b border-gray-200">
				<h2 className="font-semibold text-gray-900">Tools</h2>
			</div>

			{/* Tools Grid */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4">
					<div className="grid grid-cols-2 gap-3">
						{tools.map((tool) => (
							<MenuBox
								key={tool.name}
								selectedName={selectedTool}
								toolName={tool.name}
								isTemplate={tool.name === 'extradata'}
								signers={tool.needsAssignment ? signers : undefined}
								handleSelect={handleSignerSelect}
								title={tool.title}
								tooltip={tool.tooltip}
								onClick={() => handleToolClick(tool.name)}
								iconKey={tool.iconKey}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Signers List */}
			<div className="border-t border-gray-200 p-4">
				<h3 className="font-medium text-gray-900 mb-3">Signers</h3>
				<div className="space-y-2">
					{signers.map((signer) => (
						<div
							key={signer.email}
							className={cn(
								'flex items-center gap-2 p-2 rounded',
								'text-sm',
								signer.isFilled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700',
							)}
						>
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: signer.color || '#3b82f6' }}
							/>
							<span className="font-medium">{signer.name}</span>
							<span className="text-xs text-gray-500 ml-auto">{signer.isFilled ? '✓' : '○'}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Palette;
