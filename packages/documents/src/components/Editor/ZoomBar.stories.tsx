import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ZoomBar } from './ZoomBar';

const meta: Meta<typeof ZoomBar> = {
	title: 'Components/Editor/ZoomBar',
	component: ZoomBar,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		scale: {
			control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
		},
	},
	decorators: [
		(Story) => (
			<div className="p-8 bg-gray-100">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		scale: 1,
		viewMode: 'editor',
		onScaleChange: (scale: number) => {
			console.log('Scale changed to:', scale);
		},
	},
};

export const ZoomedIn: Story = {
	args: {
		...Default.args,
		scale: 1.5,
	},
};

export const ZoomedOut: Story = {
	args: {
		...Default.args,
		scale: 0.75,
	},
};

export const MinimumZoom: Story = {
	args: {
		...Default.args,
		scale: 0.2,
	},
};

export const MaximumZoom: Story = {
	args: {
		...Default.args,
		scale: 3,
	},
};

export const CustomScale: Story = {
	args: {
		...Default.args,
		scale: 1.33, // Non-predefined scale
	},
};

export const Interactive: Story = {
	render: () => {
		const [scale, setScale] = React.useState(1);

		return (
			<div className="space-y-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold mb-2">Interactive Zoom Bar</h3>
					<p className="text-gray-600 text-sm mb-4">Try the zoom controls to see them in action</p>
				</div>

				<ZoomBar scale={scale} onScaleChange={setScale} />

				<div className="text-center">
					<div className="text-sm text-gray-600">
						Current Scale: <span className="font-semibold">{Math.round(scale * 100)}%</span>
					</div>
				</div>

				{/* Demo content that scales */}
				<div className="bg-white p-4 rounded-lg shadow-sm border">
					<div
						style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
						className="transition-transform duration-200"
					>
						<div className="w-64 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
							Demo Content
							<br />
							Scale: {Math.round(scale * 100)}%
						</div>
					</div>
				</div>
			</div>
		);
	},
};

export const DifferentViewModes: Story = {
	render: () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-semibold mb-2">Editor Mode</h3>
				<ZoomBar scale={1} onScaleChange={(scale) => console.log('Editor scale:', scale)} />
			</div>

			<div>
				<h3 className="text-sm font-semibold mb-2">Form Mode</h3>
				<ZoomBar scale={1} onScaleChange={(scale) => console.log('Form scale:', scale)} />
			</div>

			<div>
				<h3 className="text-sm font-semibold mb-2">Preview Mode</h3>
				<ZoomBar scale={1} onScaleChange={(scale) => console.log('Preview scale:', scale)} />
			</div>
		</div>
	),
};

export const ZoomLevels: Story = {
	render: () => (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-center">Different Zoom Levels</h3>

			<div className="grid grid-cols-2 gap-4">
				<div className="text-center">
					<div className="text-sm font-medium mb-2">50% Zoom</div>
					<ZoomBar scale={0.5} onScaleChange={(scale) => console.log('50% scale:', scale)} />
				</div>

				<div className="text-center">
					<div className="text-sm font-medium mb-2">75% Zoom</div>
					<ZoomBar scale={0.75} onScaleChange={(scale) => console.log('75% scale:', scale)} />
				</div>

				<div className="text-center">
					<div className="text-sm font-medium mb-2">100% Zoom</div>
					<ZoomBar scale={1} onScaleChange={(scale) => console.log('100% scale:', scale)} />
				</div>

				<div className="text-center">
					<div className="text-sm font-medium mb-2">125% Zoom</div>
					<ZoomBar scale={1.25} onScaleChange={(scale) => console.log('125% scale:', scale)} />
				</div>

				<div className="text-center">
					<div className="text-sm font-medium mb-2">150% Zoom</div>
					<ZoomBar scale={1.5} onScaleChange={(scale) => console.log('150% scale:', scale)} />
				</div>

				<div className="text-center">
					<div className="text-sm font-medium mb-2">200% Zoom</div>
					<ZoomBar scale={2} onScaleChange={(scale) => console.log('200% scale:', scale)} />
				</div>
			</div>
		</div>
	),
};

export const EdgeCases: Story = {
	render: () => (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-center">Edge Cases</h3>

			<div className="space-y-4">
				<div>
					<div className="text-sm font-medium mb-2">Minimum Zoom (20%) - Zoom Out Disabled</div>
					<ZoomBar scale={0.2} onScaleChange={(scale) => console.log('Min scale:', scale)} />
				</div>

				<div>
					<div className="text-sm font-medium mb-2">Maximum Zoom (300%) - Zoom In Disabled</div>
					<ZoomBar scale={3} onScaleChange={(scale) => console.log('Max scale:', scale)} />
				</div>

				<div>
					<div className="text-sm font-medium mb-2">
						Custom Scale (133%) - Not in Predefined List
					</div>
					<ZoomBar scale={1.33} onScaleChange={(scale) => console.log('Custom scale:', scale)} />
				</div>
			</div>
		</div>
	),
};

export const WithCustomStyling: Story = {
	args: {
		...Default.args,
		className: 'border-2 border-blue-500 bg-blue-50',
	},
};

export const DocumentZoomDemo: Story = {
	render: () => {
		const [scale, setScale] = React.useState(1);

		return (
			<div className="w-full max-w-4xl space-y-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold mb-2">Document Zoom Demo</h3>
					<p className="text-gray-600 text-sm mb-4">
						Use the zoom bar to scale the document preview
					</p>
				</div>

				<div className="flex justify-center">
					<ZoomBar scale={scale} onScaleChange={setScale} />
				</div>

				<div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 overflow-auto">
					<div className="flex justify-center">
						<div
							style={{
								transform: `scale(${scale})`,
								transformOrigin: 'center top',
								transition: 'transform 0.2s ease-out',
							}}
						>
							{/* Mock document page */}
							<div className="w-96 h-[500px] bg-white shadow-lg border rounded-lg p-6">
								<div className="space-y-4">
									<div className="h-4 bg-gray-300 rounded w-3/4"></div>
									<div className="h-4 bg-gray-300 rounded w-1/2"></div>
									<div className="h-20 bg-blue-100 rounded border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-600 text-sm">
										Text Component
									</div>
									<div className="h-4 bg-gray-300 rounded w-2/3"></div>
									<div className="h-12 bg-green-100 rounded border-2 border-dashed border-green-300 flex items-center justify-center text-green-600 text-sm">
										Signature Area
									</div>
									<div className="h-4 bg-gray-300 rounded w-1/3"></div>
									<div className="h-8 bg-purple-100 rounded border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-600 text-sm">
										Date Field
									</div>
									<div className="space-y-2">
										<div className="h-3 bg-gray-200 rounded w-full"></div>
										<div className="h-3 bg-gray-200 rounded w-5/6"></div>
										<div className="h-3 bg-gray-200 rounded w-4/5"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="text-center text-sm text-gray-600">
					Current Zoom: <span className="font-semibold">{Math.round(scale * 100)}%</span>
				</div>
			</div>
		);
	},
};

export const ResponsiveDemo: Story = {
	render: () => (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-center">Responsive Zoom Bar</h3>

			<div className="space-y-4">
				<div>
					<div className="text-sm font-medium mb-2">Desktop Width</div>
					<div className="max-w-lg">
						<ZoomBar scale={1} onScaleChange={(scale) => console.log('Desktop scale:', scale)} />
					</div>
				</div>

				<div>
					<div className="text-sm font-medium mb-2">Tablet Width</div>
					<div className="max-w-md">
						<ZoomBar scale={1} onScaleChange={(scale) => console.log('Tablet scale:', scale)} />
					</div>
				</div>

				<div>
					<div className="text-sm font-medium mb-2">Mobile Width</div>
					<div className="max-w-xs">
						<ZoomBar scale={1} onScaleChange={(scale) => console.log('Mobile scale:', scale)} />
					</div>
				</div>
			</div>
		</div>
	),
};

export const ZoomBarInContext: Story = {
	render: () => {
		const [scale, setScale] = React.useState(1);

		return (
			<div className="w-full max-w-6xl bg-white border rounded-lg shadow-lg">
				{/* Toolbar */}
				<div className="border-b border-gray-200 p-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<h3 className="font-semibold text-gray-900">Document Editor</h3>
						<div className="text-sm text-gray-500">Page 1 of 3</div>
					</div>

					<ZoomBar scale={scale} onScaleChange={setScale} />
				</div>

				{/* Content area */}
				<div className="p-6 bg-gray-50 min-h-[400px] flex items-center justify-center">
					<div
						style={{
							transform: `scale(${scale})`,
							transformOrigin: 'center',
							transition: 'transform 0.2s ease-out',
						}}
					>
						<div className="w-64 h-80 bg-white shadow-md border rounded-lg p-4">
							<div className="text-center text-gray-600 text-sm">
								Document Content
								<br />
								{Math.round(scale * 100)}% Zoom
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
};
