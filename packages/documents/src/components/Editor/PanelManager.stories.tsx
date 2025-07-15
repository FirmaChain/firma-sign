import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PanelManagerProvider, usePanelManager } from './PanelManager';
import { FloatingPanel } from './FloatingPanel';

const meta: Meta<typeof PanelManagerProvider> = {
	title: 'Components/Editor/PanelManager',
	component: PanelManagerProvider,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component that uses the panel manager
const PanelManagerDemo: React.FC = () => {
	const {
		state,
		updateLeftPanel,
		updateRightPanel,
		toggleLeftPanel,
		toggleRightPanel,
		resetPanels,
		adjustPanelsToContainer,
	} = usePanelManager();

	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (containerRef.current) {
			const { width, height } = containerRef.current.getBoundingClientRect();
			adjustPanelsToContainer(width, height);
		}
	}, [adjustPanelsToContainer]);

	return (
		<div ref={containerRef} className="relative w-full h-screen bg-gray-100 overflow-hidden">
			{/* Main content area */}
			<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
				<div className="p-8">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">Panel Manager Demo</h2>
					<p className="text-gray-600 mb-6">
						This demonstrates the panel management system with floating panels that can be
						positioned, resized, and toggled.
					</p>

					<div className="space-y-4">
						<div className="flex gap-4">
							<button
								onClick={toggleLeftPanel}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								{state.leftPanel.isVisible ? 'Hide' : 'Show'} Left Panel
							</button>
							<button
								onClick={toggleRightPanel}
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								{state.rightPanel.isVisible ? 'Hide' : 'Show'} Right Panel
							</button>
							<button
								onClick={resetPanels}
								className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
							>
								Reset Panels
							</button>
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="bg-gray-50 p-4 rounded">
								<h3 className="font-semibold mb-2">Left Panel</h3>
								<div className="space-y-1">
									<div>Position: {state.leftPanel.position}</div>
									<div>Visible: {state.leftPanel.isVisible ? 'Yes' : 'No'}</div>
									<div>Pinned: {state.leftPanel.isPinned ? 'Yes' : 'No'}</div>
									<div>
										Size: {state.leftPanel.width}×{state.leftPanel.height}
									</div>
									<div>
										Floating Position: {state.leftPanel.floatingPosition.x},{' '}
										{state.leftPanel.floatingPosition.y}
									</div>
								</div>
							</div>

							<div className="bg-gray-50 p-4 rounded">
								<h3 className="font-semibold mb-2">Right Panel</h3>
								<div className="space-y-1">
									<div>Position: {state.rightPanel.position}</div>
									<div>Visible: {state.rightPanel.isVisible ? 'Yes' : 'No'}</div>
									<div>Pinned: {state.rightPanel.isPinned ? 'Yes' : 'No'}</div>
									<div>
										Size: {state.rightPanel.width}×{state.rightPanel.height}
									</div>
									<div>
										Floating Position: {state.rightPanel.floatingPosition.x},{' '}
										{state.rightPanel.floatingPosition.y}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Left Panel */}
			<FloatingPanel
				id="managed-left-panel"
				title="Tools Panel"
				position={state.leftPanel.position}
				floatingPosition={state.leftPanel.floatingPosition}
				isPinned={state.leftPanel.isPinned}
				isVisible={state.leftPanel.isVisible}
				width={state.leftPanel.width}
				height={state.leftPanel.height}
				onPositionChange={(position, floatingPosition) => {
					updateLeftPanel({
						position,
						...(floatingPosition && { floatingPosition }),
					});
				}}
				onPinnedChange={(isPinned) => {
					updateLeftPanel({ isPinned });
				}}
				onVisibilityChange={(isVisible) => {
					updateLeftPanel({ isVisible });
				}}
			>
				<div className="p-4 space-y-4">
					<h3 className="font-semibold text-gray-900">Tool Palette</h3>
					<div className="grid grid-cols-2 gap-2">
						<button className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">Text</button>
						<button className="p-2 bg-green-50 border border-green-200 rounded text-sm">
							Signature
						</button>
						<button className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
							Stamp
						</button>
						<button className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
							Date
						</button>
					</div>
					<div className="pt-4 border-t">
						<h4 className="font-medium text-gray-700 mb-2">Signers</h4>
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm">
								<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
								<span>John Doe</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<div className="w-3 h-3 bg-green-500 rounded-full"></div>
								<span>Jane Smith</span>
							</div>
						</div>
					</div>
				</div>
			</FloatingPanel>

			{/* Right Panel */}
			<FloatingPanel
				id="managed-right-panel"
				title="Properties Panel"
				position={state.rightPanel.position}
				floatingPosition={state.rightPanel.floatingPosition}
				isPinned={state.rightPanel.isPinned}
				isVisible={state.rightPanel.isVisible}
				width={state.rightPanel.width}
				height={state.rightPanel.height}
				onPositionChange={(position, floatingPosition) => {
					updateRightPanel({
						position,
						...(floatingPosition && { floatingPosition }),
					});
				}}
				onPinnedChange={(isPinned) => {
					updateRightPanel({ isPinned });
				}}
				onVisibilityChange={(isVisible) => {
					updateRightPanel({ isVisible });
				}}
			>
				<div className="p-4 space-y-4">
					<h3 className="font-semibold text-gray-900">Component Properties</h3>
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
							<input
								type="number"
								className="w-full p-2 border border-gray-300 rounded text-sm"
								defaultValue={150}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
							<input
								type="number"
								className="w-full p-2 border border-gray-300 rounded text-sm"
								defaultValue={40}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
							<input
								type="color"
								className="w-full p-1 border border-gray-300 rounded"
								defaultValue="#3b82f6"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
							<select className="w-full p-2 border border-gray-300 rounded text-sm">
								<option>12px</option>
								<option>14px</option>
								<option>16px</option>
								<option>18px</option>
							</select>
						</div>
					</div>
				</div>
			</FloatingPanel>
		</div>
	);
};

export const Default: Story = {
	render: () => (
		<PanelManagerProvider>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const WithInitialState: Story = {
	render: () => (
		<PanelManagerProvider
			initialState={{
				leftPanel: {
					position: 'left',
					floatingPosition: { x: 0, y: 0 },
					isPinned: true,
					isVisible: true,
					width: 280,
					height: 600,
				},
				rightPanel: {
					position: 'right',
					floatingPosition: { x: 0, y: 0 },
					isPinned: true,
					isVisible: true,
					width: 350,
					height: 600,
				},
			}}
		>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const DockedPanels: Story = {
	render: () => (
		<PanelManagerProvider
			initialState={{
				leftPanel: {
					position: 'left',
					floatingPosition: { x: 0, y: 0 },
					isPinned: true,
					isVisible: true,
					width: 260,
					height: 600,
				},
				rightPanel: {
					position: 'right',
					floatingPosition: { x: 0, y: 0 },
					isPinned: true,
					isVisible: true,
					width: 320,
					height: 600,
				},
			}}
		>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const FloatingPanels: Story = {
	render: () => (
		<PanelManagerProvider
			initialState={{
				leftPanel: {
					position: 'floating',
					floatingPosition: { x: 50, y: 100 },
					isPinned: false,
					isVisible: true,
					width: 260,
					height: 500,
				},
				rightPanel: {
					position: 'floating',
					floatingPosition: { x: 400, y: 150 },
					isPinned: false,
					isVisible: true,
					width: 320,
					height: 500,
				},
			}}
		>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const OnePanelHidden: Story = {
	render: () => (
		<PanelManagerProvider
			initialState={{
				leftPanel: {
					position: 'floating',
					floatingPosition: { x: 50, y: 100 },
					isPinned: false,
					isVisible: true,
					width: 260,
					height: 500,
				},
				rightPanel: {
					position: 'floating',
					floatingPosition: { x: 400, y: 150 },
					isPinned: false,
					isVisible: false,
					width: 320,
					height: 500,
				},
			}}
		>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const DifferentSizes: Story = {
	render: () => (
		<PanelManagerProvider
			initialState={{
				leftPanel: {
					position: 'floating',
					floatingPosition: { x: 50, y: 100 },
					isPinned: false,
					isVisible: true,
					width: 200,
					height: 400,
				},
				rightPanel: {
					position: 'floating',
					floatingPosition: { x: 350, y: 150 },
					isPinned: false,
					isVisible: true,
					width: 400,
					height: 600,
				},
			}}
		>
			<PanelManagerDemo />
		</PanelManagerProvider>
	),
};

export const InteractiveDemo: Story = {
	render: () => {
		const PanelControlsDemo = () => {
			const {
				state,
				updateLeftPanel,
				updateRightPanel,
				toggleLeftPanel,
				toggleRightPanel,
				resetPanels,
			} = usePanelManager();

			return (
				<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
					{/* Control Panel */}
					<div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-50 min-w-[300px]">
						<h3 className="font-semibold mb-3">Panel Controls</h3>
						<div className="space-y-2">
							<div className="flex gap-2">
								<button
									onClick={toggleLeftPanel}
									className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
								>
									Toggle Left
								</button>
								<button
									onClick={toggleRightPanel}
									className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
								>
									Toggle Right
								</button>
								<button
									onClick={resetPanels}
									className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
								>
									Reset
								</button>
							</div>
							<div className="text-xs text-gray-600">
								<div>
									Left: {state.leftPanel.position} |{' '}
									{state.leftPanel.isVisible ? 'Visible' : 'Hidden'}
								</div>
								<div>
									Right: {state.rightPanel.position} |{' '}
									{state.rightPanel.isVisible ? 'Visible' : 'Hidden'}
								</div>
							</div>
						</div>
					</div>

					{/* Main content */}
					<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
						<div className="p-8 pt-20">
							<h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive Panel Demo</h2>
							<p className="text-gray-600 mb-4">
								Use the control panel above to interact with the panels. You can also:
							</p>
							<ul className="list-disc pl-6 space-y-1 text-gray-600">
								<li>Drag panels by their headers (when not pinned)</li>
								<li>Resize floating panels using the resize handle</li>
								<li>Change panel position using the position menu</li>
								<li>Pin/unpin panels using the pin button</li>
								<li>Hide panels using the close button</li>
							</ul>
						</div>
					</div>

					{/* Managed Panels */}
					<FloatingPanel
						id="interactive-left-panel"
						title="Interactive Tools"
						position={state.leftPanel.position}
						floatingPosition={state.leftPanel.floatingPosition}
						isPinned={state.leftPanel.isPinned}
						isVisible={state.leftPanel.isVisible}
						width={state.leftPanel.width}
						height={state.leftPanel.height}
						onPositionChange={(position, floatingPosition) => {
							updateLeftPanel({
								position,
								...(floatingPosition && { floatingPosition }),
							});
						}}
						onPinnedChange={(isPinned) => updateLeftPanel({ isPinned })}
						onVisibilityChange={(isVisible) => updateLeftPanel({ isVisible })}
					>
						<div className="p-4 space-y-4">
							<h3 className="font-semibold text-gray-900">Left Panel Content</h3>
							<div className="space-y-2">
								<div className="p-3 bg-blue-50 rounded border">
									<div className="font-medium text-sm">Tool 1</div>
									<div className="text-xs text-gray-600">Description</div>
								</div>
								<div className="p-3 bg-green-50 rounded border">
									<div className="font-medium text-sm">Tool 2</div>
									<div className="text-xs text-gray-600">Description</div>
								</div>
							</div>
						</div>
					</FloatingPanel>

					<FloatingPanel
						id="interactive-right-panel"
						title="Interactive Properties"
						position={state.rightPanel.position}
						floatingPosition={state.rightPanel.floatingPosition}
						isPinned={state.rightPanel.isPinned}
						isVisible={state.rightPanel.isVisible}
						width={state.rightPanel.width}
						height={state.rightPanel.height}
						onPositionChange={(position, floatingPosition) => {
							updateRightPanel({
								position,
								...(floatingPosition && { floatingPosition }),
							});
						}}
						onPinnedChange={(isPinned) => updateRightPanel({ isPinned })}
						onVisibilityChange={(isVisible) => updateRightPanel({ isVisible })}
					>
						<div className="p-4 space-y-4">
							<h3 className="font-semibold text-gray-900">Right Panel Content</h3>
							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Panel Width
									</label>
									<input
										type="range"
										min="200"
										max="500"
										value={state.rightPanel.width}
										onChange={(e) => updateRightPanel({ width: parseInt(e.target.value) })}
										className="w-full"
									/>
									<div className="text-xs text-gray-500">{state.rightPanel.width}px</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Panel Height
									</label>
									<input
										type="range"
										min="300"
										max="800"
										value={state.rightPanel.height}
										onChange={(e) => updateRightPanel({ height: parseInt(e.target.value) })}
										className="w-full"
									/>
									<div className="text-xs text-gray-500">{state.rightPanel.height}px</div>
								</div>
							</div>
						</div>
					</FloatingPanel>
				</div>
			);
		};

		return (
			<PanelManagerProvider>
				<PanelControlsDemo />
			</PanelManagerProvider>
		);
	},
};

export const ResponsiveDemo: Story = {
	render: () => (
		<PanelManagerProvider>
			<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
				<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
					<div className="p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">Responsive Panel Demo</h2>
						<p className="text-gray-600 mb-6">
							Resize your browser window to see how the panels adjust their positions automatically.
						</p>
					</div>
				</div>
				<PanelManagerDemo />
			</div>
		</PanelManagerProvider>
	),
};
