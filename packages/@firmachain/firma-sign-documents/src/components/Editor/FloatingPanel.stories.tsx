import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FloatingPanel, PanelPosition } from './FloatingPanel';

const meta: Meta<typeof FloatingPanel> = {
	title: 'Components/Editor/FloatingPanel',
	component: FloatingPanel,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		position: {
			control: { type: 'select' },
			options: ['left', 'right', 'top', 'bottom', 'floating'],
		},
		isPinned: {
			control: { type: 'boolean' },
		},
		isVisible: {
			control: { type: 'boolean' },
		},
		width: {
			control: { type: 'range', min: 200, max: 600, step: 10 },
		},
		height: {
			control: { type: 'range', min: 300, max: 800, step: 10 },
		},
	},
	decorators: [
		(Story) => (
			<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
				<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
					<div className="p-8 text-center text-gray-500">
						<h2 className="text-xl font-semibold mb-2">Document Editor Area</h2>
						<p>The floating panel can be docked to any side or float freely</p>
					</div>
					<Story />
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent: React.FC = () => (
	<div className="p-4 space-y-4">
		<div className="space-y-2">
			<h3 className="font-medium text-gray-900">Panel Content</h3>
			<div className="space-y-2">
				<div className="p-3 bg-blue-50 rounded border">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-blue-500 rounded"></div>
						<span className="text-sm font-medium">Sample Item 1</span>
					</div>
				</div>
				<div className="p-3 bg-green-50 rounded border">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-green-500 rounded"></div>
						<span className="text-sm font-medium">Sample Item 2</span>
					</div>
				</div>
				<div className="p-3 bg-purple-50 rounded border">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-purple-500 rounded"></div>
						<span className="text-sm font-medium">Sample Item 3</span>
					</div>
				</div>
			</div>
		</div>
		<div className="space-y-2">
			<h4 className="font-medium text-gray-700">Controls</h4>
			<div className="space-y-1">
				<button className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded">
					Action 1
				</button>
				<button className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded">
					Action 2
				</button>
				<button className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded">
					Action 3
				</button>
			</div>
		</div>
	</div>
);

export const FloatingPosition: Story = {
	args: {
		id: 'sample-panel',
		title: 'Floating Panel',
		position: 'floating',
		floatingPosition: { x: 100, y: 100 },
		isPinned: false,
		isVisible: true,
		width: 320,
		height: 500,
		onPositionChange: (position, floatingPosition) => {
			console.log('Position changed:', position, floatingPosition);
		},
		onPinnedChange: (pinned) => {
			console.log('Pinned changed:', pinned);
		},
		onVisibilityChange: (visible) => {
			console.log('Visibility changed:', visible);
		},
		children: <SampleContent />,
	},
};

export const DockedLeft: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Left Panel',
		position: 'left',
		isPinned: true,
	},
};

export const DockedRight: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Right Panel',
		position: 'right',
		isPinned: true,
	},
};

export const DockedTop: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Top Panel',
		position: 'top',
		isPinned: true,
		height: 300,
	},
};

export const DockedBottom: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Bottom Panel',
		position: 'bottom',
		isPinned: true,
		height: 300,
	},
};

export const PinnedFloating: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Pinned Floating Panel',
		isPinned: true,
		floatingPosition: { x: 200, y: 150 },
	},
};

export const SmallPanel: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Small Panel',
		width: 250,
		height: 400,
		floatingPosition: { x: 50, y: 50 },
	},
};

export const LargePanel: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Large Panel',
		width: 500,
		height: 600,
		floatingPosition: { x: 50, y: 50 },
	},
};

export const CompactPanel: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Compact Panel',
		width: 200,
		height: 450,
		floatingPosition: { x: 50, y: 50 },
		children: (
			<div className="p-2 space-y-2">
				<div className="text-xs font-medium text-gray-700">Compact Mode</div>
				<div className="space-y-1">
					<div className="p-2 bg-blue-50 rounded text-xs">Item 1</div>
					<div className="p-2 bg-green-50 rounded text-xs">Item 2</div>
					<div className="p-2 bg-purple-50 rounded text-xs">Item 3</div>
				</div>
				<div className="space-y-1">
					<button className="w-full p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
						Action
					</button>
				</div>
			</div>
		),
	},
};

export const MultiplePanels: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
			<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
				<div className="p-8 text-center text-gray-500">
					<h2 className="text-xl font-semibold mb-2">Document Editor</h2>
					<p>Multiple panels in different positions</p>
				</div>

				<FloatingPanel
					id="left-panel"
					title="Tools"
					position="left"
					isPinned={true}
					isVisible={true}
					width={280}
					height={500}
					onPositionChange={(pos, floatingPos) =>
						console.log('Left panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Left panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Left panel visible:', visible)}
				>
					<div className="p-3 space-y-2">
						<h3 className="font-medium text-gray-900">Tool Palette</h3>
						<div className="grid grid-cols-2 gap-2">
							<button className="p-2 bg-blue-50 rounded text-sm">Text</button>
							<button className="p-2 bg-green-50 rounded text-sm">Signature</button>
							<button className="p-2 bg-purple-50 rounded text-sm">Stamp</button>
							<button className="p-2 bg-yellow-50 rounded text-sm">Date</button>
						</div>
					</div>
				</FloatingPanel>

				<FloatingPanel
					id="right-panel"
					title="Properties"
					position="right"
					isPinned={true}
					isVisible={true}
					width={320}
					height={500}
					onPositionChange={(pos, floatingPos) =>
						console.log('Right panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Right panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Right panel visible:', visible)}
				>
					<div className="p-3 space-y-4">
						<h3 className="font-medium text-gray-900">Component Properties</h3>
						<div className="space-y-2">
							<div>
								<label className="block text-sm font-medium text-gray-700">Width</label>
								<input
									type="number"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Height</label>
								<input
									type="number"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Color</label>
								<input
									type="color"
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
								/>
							</div>
						</div>
					</div>
				</FloatingPanel>

				<FloatingPanel
					id="floating-panel"
					title="Inspector"
					position="floating"
					floatingPosition={{ x: 400, y: 100 }}
					isPinned={false}
					isVisible={true}
					width={280}
					height={350}
					onPositionChange={(pos, floatingPos) =>
						console.log('Floating panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Floating panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Floating panel visible:', visible)}
				>
					<div className="p-3 space-y-3">
						<h3 className="font-medium text-gray-900">Document Inspector</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Components:</span>
								<span className="font-medium">12</span>
							</div>
							<div className="flex justify-between">
								<span>Pages:</span>
								<span className="font-medium">3</span>
							</div>
							<div className="flex justify-between">
								<span>Signers:</span>
								<span className="font-medium">4</span>
							</div>
						</div>
					</div>
				</FloatingPanel>
			</div>
		</div>
	),
};

export const ResponsiveWidths: Story = {
	render: () => (
		<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
			<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
				<div className="p-8 text-center text-gray-500 mb-4">
					<h2 className="text-xl font-semibold mb-2">Responsive Panel Widths</h2>
					<p>Panels adapt their layout based on width</p>
				</div>

				<FloatingPanel
					id="compact-panel"
					title="Compact"
					position="floating"
					floatingPosition={{ x: 50, y: 150 }}
					isPinned={false}
					isVisible={true}
					width={180}
					height={400}
					onPositionChange={(pos, floatingPos) =>
						console.log('Compact panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Compact panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Compact panel visible:', visible)}
				>
					<div className="p-2 space-y-2">
						<div className="text-xs font-medium text-gray-700">Very narrow layout</div>
						<div className="space-y-1">
							<div className="p-1 bg-blue-50 rounded text-xs">Item 1</div>
							<div className="p-1 bg-green-50 rounded text-xs">Item 2</div>
						</div>
					</div>
				</FloatingPanel>

				<FloatingPanel
					id="narrow-panel"
					title="Narrow"
					position="floating"
					floatingPosition={{ x: 280, y: 150 }}
					isPinned={false}
					isVisible={true}
					width={250}
					height={400}
					onPositionChange={(pos, floatingPos) =>
						console.log('Narrow panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Narrow panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Narrow panel visible:', visible)}
				>
					<div className="p-2 space-y-2">
						<div className="text-sm font-medium text-gray-700">Narrow layout</div>
						<div className="space-y-1">
							<div className="p-2 bg-blue-50 rounded text-sm">Item 1</div>
							<div className="p-2 bg-green-50 rounded text-sm">Item 2</div>
						</div>
					</div>
				</FloatingPanel>

				<FloatingPanel
					id="wide-panel"
					title="Wide"
					position="floating"
					floatingPosition={{ x: 580, y: 150 }}
					isPinned={false}
					isVisible={true}
					width={450}
					height={400}
					onPositionChange={(pos, floatingPos) =>
						console.log('Wide panel position:', pos, floatingPos)
					}
					onPinnedChange={(pinned) => console.log('Wide panel pinned:', pinned)}
					onVisibilityChange={(visible) => console.log('Wide panel visible:', visible)}
				>
					<div className="p-4 space-y-4">
						<div className="text-base font-medium text-gray-700">
							Wide layout with extra features
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="p-3 bg-blue-50 rounded">
								<div className="font-medium text-sm">Feature 1</div>
								<div className="text-xs text-gray-600">More details available</div>
							</div>
							<div className="p-3 bg-green-50 rounded">
								<div className="font-medium text-sm">Feature 2</div>
								<div className="text-xs text-gray-600">Additional options</div>
							</div>
						</div>
					</div>
				</FloatingPanel>
			</div>
		</div>
	),
};

export const InteractiveDemo: Story = {
	render: function InteractiveDemoRender() {
		const [position, setPosition] = React.useState<PanelPosition>('floating');
		const [floatingPosition, setFloatingPosition] = React.useState({ x: 100, y: 100 });
		const [isPinned, setIsPinned] = React.useState(false);
		const [isVisible, setIsVisible] = React.useState(true);
		const [width, setWidth] = React.useState(320);
		const [height, setHeight] = React.useState(500);

		return (
			<div className="relative w-full h-screen bg-gray-100 overflow-hidden">
				<div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
					<div className="p-8 text-center text-gray-500">
						<h2 className="text-xl font-semibold mb-2">Interactive Panel Demo</h2>
						<p>Use the panel controls to change position, pin/unpin, and resize</p>
						<div className="mt-4 text-sm space-y-1">
							<div>Position: {position}</div>
							<div>Pinned: {isPinned ? 'Yes' : 'No'}</div>
							<div>Visible: {isVisible ? 'Yes' : 'No'}</div>
							<div>
								Size: {width}×{height}
							</div>
						</div>
						{!isVisible && (
							<button
								onClick={() => setIsVisible(true)}
								className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Show Panel
							</button>
						)}
					</div>

					<FloatingPanel
						id="interactive-panel"
						title="Interactive Panel"
						position={position}
						floatingPosition={floatingPosition}
						isPinned={isPinned}
						isVisible={isVisible}
						width={width}
						height={height}
						onPositionChange={(newPosition, newFloatingPosition) => {
							setPosition(newPosition);
							if (newFloatingPosition) {
								setFloatingPosition(newFloatingPosition);
							}
						}}
						onPinnedChange={setIsPinned}
						onVisibilityChange={setIsVisible}
					>
						<div className="p-4 space-y-4">
							<div className="space-y-2">
								<h3 className="font-medium text-gray-900">Panel Controls</h3>
								<div className="text-sm text-gray-600">
									Try the buttons in the header to change position, pin/unpin, or hide the panel.
								</div>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium text-gray-700">Manual Controls:</div>
								<div className="space-y-1">
									<button
										onClick={() => setWidth(Math.max(200, width - 20))}
										className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
									>
										Decrease Width
									</button>
									<button
										onClick={() => setWidth(Math.min(600, width + 20))}
										className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
									>
										Increase Width
									</button>
									<button
										onClick={() => setHeight(Math.max(300, height - 20))}
										className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
									>
										Decrease Height
									</button>
									<button
										onClick={() => setHeight(Math.min(800, height + 20))}
										className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
									>
										Increase Height
									</button>
								</div>
							</div>
						</div>
					</FloatingPanel>
				</div>
			</div>
		);
	},
};

export const Hidden: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Hidden Panel',
		isVisible: false,
	},
};

export const MinimalContent: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Minimal Panel',
		width: 250,
		height: 200,
		children: (
			<div className="p-4 text-center">
				<div className="text-sm text-gray-600">Minimal content</div>
			</div>
		),
	},
};

export const RichContent: Story = {
	args: {
		...FloatingPosition.args,
		title: 'Rich Content Panel',
		width: 400,
		height: 600,
		children: (
			<div className="p-4 space-y-4">
				<div className="space-y-2">
					<h3 className="font-semibold text-gray-900">Rich Content Example</h3>
					<p className="text-sm text-gray-600">
						This panel demonstrates rich content with various UI elements.
					</p>
				</div>

				<div className="space-y-2">
					<h4 className="font-medium text-gray-800">Form Elements</h4>
					<div className="space-y-2">
						<input
							type="text"
							placeholder="Text input"
							className="w-full p-2 border border-gray-300 rounded"
						/>
						<select className="w-full p-2 border border-gray-300 rounded">
							<option>Option 1</option>
							<option>Option 2</option>
							<option>Option 3</option>
						</select>
						<label className="flex items-center gap-2">
							<input type="checkbox" />
							<span className="text-sm">Checkbox option</span>
						</label>
					</div>
				</div>

				<div className="space-y-2">
					<h4 className="font-medium text-gray-800">Color Swatches</h4>
					<div className="flex gap-2">
						<div className="w-6 h-6 bg-red-500 rounded"></div>
						<div className="w-6 h-6 bg-blue-500 rounded"></div>
						<div className="w-6 h-6 bg-green-500 rounded"></div>
						<div className="w-6 h-6 bg-yellow-500 rounded"></div>
					</div>
				</div>

				<div className="space-y-2">
					<h4 className="font-medium text-gray-800">Actions</h4>
					<div className="flex gap-2">
						<button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Primary</button>
						<button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">Secondary</button>
					</div>
				</div>
			</div>
		),
	},
};
