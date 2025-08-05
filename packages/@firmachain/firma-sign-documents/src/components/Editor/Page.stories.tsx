import type { Meta, StoryObj } from '@storybook/react';
import { Page } from './Page';
import { Document } from 'react-pdf';

const meta: Meta<typeof Page> = {
	title: 'Components/Editor/Page',
	component: Page,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		page: {
			control: { type: 'number', min: 0, max: 10 },
		},
		scale: {
			control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
		},
		show: {
			control: { type: 'boolean' },
		},
		viewMode: {
			control: { type: 'select' },
			options: ['editor', 'form', 'preview'],
		},
		totalPage: {
			control: { type: 'number', min: 1, max: 20 },
		},
		removeScrollGap: {
			control: { type: 'boolean' },
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full min-h-screen bg-gray-100 p-8">
				<div className="max-w-4xl mx-auto">
					{/* Mock Document provider for react-pdf */}
					<Document file={null} loading={null} error={null}>
						<Story />
					</Document>
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Note: In a real scenario, you would mock react-pdf properly in the test setup
// For storybook, the actual Page component will handle PDF rendering

export const Default: Story = {
	args: {
		fileId: 'sample-document',
		page: 0,
		scale: 1,
		show: true,
		viewMode: 'editor',
		totalPage: 3,
		removeScrollGap: false,
		onVisible: (page, visible) => {
			console.log('Page visibility changed:', page, visible);
		},
		onPosition: (page, position) => {
			console.log('Page position changed:', page, position);
		},
		onFinish: () => {
			console.log('Page finished loading');
		},
	},
};

export const EditorMode: Story = {
	args: {
		...Default.args,
		viewMode: 'editor',
	},
};

export const FormMode: Story = {
	args: {
		...Default.args,
		viewMode: 'form',
	},
};

export const PreviewMode: Story = {
	args: {
		...Default.args,
		viewMode: 'preview',
	},
};

export const ScaledDown: Story = {
	args: {
		...Default.args,
		scale: 0.5,
	},
};

export const ScaledUp: Story = {
	args: {
		...Default.args,
		scale: 1.5,
	},
};

export const Loading: Story = {
	args: {
		...Default.args,
		show: false,
	},
};

export const FirstPage: Story = {
	args: {
		...Default.args,
		page: 0,
	},
};

export const MiddlePage: Story = {
	args: {
		...Default.args,
		page: 1,
	},
};

export const LastPage: Story = {
	args: {
		...Default.args,
		page: 2,
	},
};

export const WithScrollGap: Story = {
	args: {
		...Default.args,
		removeScrollGap: false,
	},
};

export const WithoutScrollGap: Story = {
	args: {
		...Default.args,
		removeScrollGap: true,
	},
};

export const MultiplePages: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8">
			<div className="max-w-4xl mx-auto space-y-8">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Multi-Page Document</h2>
				<Document file={null} loading={null} error={null}>
					{[0, 1, 2].map((pageIndex) => (
						<Page
							key={pageIndex}
							fileId="multi-page-document"
							page={pageIndex}
							scale={0.8}
							show={true}
							viewMode="editor"
							totalPage={3}
							onVisible={(page, visible) => console.log('Page visible:', page, visible)}
							onPosition={(page, position) => console.log('Page position:', page, position)}
						/>
					))}
				</Document>
			</div>
		</div>
	),
};

export const DifferentScales: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8">
			<div className="max-w-6xl mx-auto">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Different Scales</h2>
				<div className="grid grid-cols-3 gap-8">
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">50% Scale</h3>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="scale-demo"
								page={0}
								scale={0.5}
								show={true}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">100% Scale</h3>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="scale-demo"
								page={0}
								scale={1}
								show={true}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">150% Scale</h3>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="scale-demo"
								page={0}
								scale={1.5}
								show={true}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
				</div>
			</div>
		</div>
	),
};

export const DifferentViewModes: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8">
			<div className="max-w-6xl mx-auto">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Different View Modes</h2>
				<div className="grid grid-cols-3 gap-8">
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">Editor Mode</h3>
						<div className="text-sm text-gray-600 mb-4">Interactive editing with tool overlays</div>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="viewmode-demo"
								page={0}
								scale={0.6}
								show={true}
								viewMode="editor"
								totalPage={1}
							/>
						</Document>
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">Form Mode</h3>
						<div className="text-sm text-gray-600 mb-4">Form filling interface</div>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="viewmode-demo"
								page={0}
								scale={0.6}
								show={true}
								viewMode="form"
								totalPage={1}
							/>
						</Document>
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">Preview Mode</h3>
						<div className="text-sm text-gray-600 mb-4">Read-only preview</div>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="viewmode-demo"
								page={0}
								scale={0.6}
								show={true}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
				</div>
			</div>
		</div>
	),
};

export const WithCustomClassName: Story = {
	args: {
		...Default.args,
		className: 'custom-page-styling border-4 border-blue-500 rounded-lg',
	},
};

export const InteractiveDemo: Story = {
	render: function InteractiveDemoRender() {
		const [scale, setScale] = React.useState(1);
		const [viewMode, setViewMode] = React.useState('editor');
		const [currentPage, setCurrentPage] = React.useState(0);
		const [show, setShow] = React.useState(true);

		return (
			<div className="w-full min-h-screen bg-gray-100 p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white p-6 rounded-lg shadow-lg mb-8">
						<h2 className="text-xl font-bold mb-4">Interactive Page Demo</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Scale</label>
								<input
									type="range"
									min="0.3"
									max="2"
									step="0.1"
									value={scale}
									onChange={(e) => setScale(parseFloat(e.target.value))}
									className="w-full"
								/>
								<div className="text-xs text-gray-500 text-center">{scale}x</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
								<select
									value={viewMode}
									onChange={(e) => setViewMode(e.target.value)}
									className="w-full p-1 border border-gray-300 rounded text-sm"
								>
									<option value="editor">Editor</option>
									<option value="form">Form</option>
									<option value="preview">Preview</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
								<select
									value={currentPage}
									onChange={(e) => setCurrentPage(parseInt(e.target.value))}
									className="w-full p-1 border border-gray-300 rounded text-sm"
								>
									<option value={0}>Page 1</option>
									<option value={1}>Page 2</option>
									<option value={2}>Page 3</option>
								</select>
							</div>
							<div className="flex items-end">
								<button
									onClick={() => setShow(!show)}
									className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
								>
									{show ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>
					</div>

					<Document file={null} loading={null} error={null}>
						<Page
							fileId="interactive-demo"
							page={currentPage}
							scale={scale}
							show={show}
							viewMode={viewMode}
							totalPage={3}
							onVisible={(page, visible) => console.log('Page visible:', page, visible)}
							onPosition={(page, position) => console.log('Page position:', page, position)}
							onFinish={() => console.log('Page finished loading')}
						/>
					</Document>
				</div>
			</div>
		);
	},
};

export const LoadingStates: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8">
			<div className="max-w-6xl mx-auto">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Loading States</h2>
				<div className="grid grid-cols-2 gap-8">
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">Visible Page</h3>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="loading-demo"
								page={0}
								scale={0.7}
								show={true}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold mb-4">Loading Page</h3>
						<Document file={null} loading={null} error={null}>
							<Page
								fileId="loading-demo"
								page={0}
								scale={0.7}
								show={false}
								viewMode="preview"
								totalPage={1}
							/>
						</Document>
					</div>
				</div>
			</div>
		</div>
	),
};

export const WithPreviewEmail: Story = {
	args: {
		...Default.args,
		previewEmail: 'user@example.com',
	},
};
