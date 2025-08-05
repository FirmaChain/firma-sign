import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Palette } from './Palette';
import { ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof Palette> = {
	title: 'Components/Editor/Palette',
	component: Palette,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: [ViewMode.EDITOR, ViewMode.FORM, ViewMode.PREVIEW],
		},
	},
	decorators: [
		(Story) => (
			<div className="w-80 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock signers that match the component's expected structure
const sampleSigners = [
	{
		email: 'john@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
		isFilled: true,
	},
	{
		email: 'jane@example.com',
		name: 'Jane Smith',
		color: USER_COLORS[1],
		isFilled: false,
	},
	{
		email: 'mike@example.com',
		name: 'Mike Wilson',
		color: USER_COLORS[2],
		isFilled: true,
	},
	{
		email: 'sarah@example.com',
		name: 'Sarah Johnson',
		color: USER_COLORS[3],
		isFilled: false,
	},
];

export const Default: Story = {
	args: {
		signers: sampleSigners,
		viewMode: ViewMode.EDITOR,
		onToolSelect: (tool) => {
			console.log('Tool selected:', tool);
		},
		onUserSelect: (user) => {
			console.log('User selected:', user);
		},
	},
};

export const NoSigners: Story = {
	args: {
		...Default.args,
		signers: [],
	},
};

export const SingleSigner: Story = {
	args: {
		...Default.args,
		signers: [sampleSigners[0]],
	},
};

export const ManySigners: Story = {
	args: {
		...Default.args,
		signers: [
			...sampleSigners,
			{
				email: 'alex@example.com',
				name: 'Alex Brown',
				color: USER_COLORS[4],
				isFilled: false,
			},
			{
				email: 'emma@example.com',
				name: 'Emma Davis',
				color: USER_COLORS[5],
				isFilled: true,
			},
			{
				email: 'chris@example.com',
				name: 'Chris Wilson',
				color: USER_COLORS[6],
				isFilled: false,
			},
			{
				email: 'lisa@example.com',
				name: 'Lisa Anderson',
				color: USER_COLORS[7],
				isFilled: true,
			},
		],
	},
};

export const AllCompleted: Story = {
	args: {
		...Default.args,
		signers: sampleSigners.map((signer) => ({
			...signer,
			isFilled: true,
		})),
	},
};

export const NoneCompleted: Story = {
	args: {
		...Default.args,
		signers: sampleSigners.map((signer) => ({
			...signer,
			isFilled: false,
		})),
	},
};

export const MixedCompletion: Story = {
	args: {
		...Default.args,
		signers: sampleSigners.map((signer, index) => ({
			...signer,
			isFilled: index % 2 === 0,
		})),
	},
};

export const LongNames: Story = {
	args: {
		...Default.args,
		signers: [
			{
				email: 'verylongname@verylongdomainname.com',
				name: 'Dr. Jonathan Alexander Williamson III',
				color: USER_COLORS[0],
				isFilled: false,
			},
			{
				email: 'anotherlongname@company.com',
				name: 'Elizabeth Catherine Montgomery-Smith',
				color: USER_COLORS[1],
				isFilled: true,
			},
			{
				email: 'short@co.com',
				name: 'Jo',
				color: USER_COLORS[2],
				isFilled: false,
			},
		],
	},
};

export const CustomColors: Story = {
	args: {
		...Default.args,
		signers: [
			{
				email: 'red@example.com',
				name: 'Red User',
				color: '#ef4444',
				isFilled: true,
			},
			{
				email: 'green@example.com',
				name: 'Green User',
				color: '#22c55e',
				isFilled: false,
			},
			{
				email: 'purple@example.com',
				name: 'Purple User',
				color: '#8b5cf6',
				isFilled: true,
			},
			{
				email: 'orange@example.com',
				name: 'Orange User',
				color: '#f97316',
				isFilled: false,
			},
		],
	},
};

export const InteractiveDemo: Story = {
	render: function InteractiveDemoRender() {
		const [selectedTool, setSelectedTool] = React.useState(null);
		const [signers, setSigners] = React.useState(sampleSigners);

		const toggleSignerCompletion = (email: string) => {
			setSigners((prev) =>
				prev.map((signer) =>
					signer.email === email ? { ...signer, isFilled: !signer.isFilled } : signer,
				),
			);
		};

		return (
			<div className="flex gap-4">
				<div className="w-80 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
					<Palette
						signers={signers}
						selectedTool={selectedTool}
						viewMode={ViewMode.EDITOR}
						onToolSelect={setSelectedTool}
						onUserSelect={(user) => console.log('User selected:', user)}
					/>
				</div>
				<div className="w-64 p-4 bg-gray-50 rounded-lg">
					<h3 className="font-medium text-gray-900 mb-3">Toggle Completion</h3>
					<div className="space-y-2">
						{signers.map((signer) => (
							<button
								key={signer.email}
								onClick={() => toggleSignerCompletion(signer.email)}
								className="w-full p-2 text-left text-sm bg-white hover:bg-gray-100 rounded border flex items-center gap-2"
							>
								<div className="w-3 h-3 rounded-full" style={{ backgroundColor: signer.color }} />
								<span className="flex-1">{signer.name}</span>
								<span className="text-xs">{signer.isFilled ? '✓' : '○'}</span>
							</button>
						))}
					</div>
					<div className="mt-4 pt-3 border-t">
						<div className="text-sm text-gray-600">Selected Tool: {selectedTool || 'None'}</div>
					</div>
				</div>
			</div>
		);
	},
};

export const ToolInteraction: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-4">
			<div className="w-80 h-[400px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Default Tools
				</div>
				<Palette
					signers={sampleSigners}
					viewMode={ViewMode.EDITOR}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
				/>
			</div>
			<div className="w-80 h-[400px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					With Fewer Signers
				</div>
				<Palette
					signers={sampleSigners.slice(0, 2)}
					viewMode={ViewMode.EDITOR}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
				/>
			</div>
		</div>
	),
};

export const ResponsiveWidths: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4">
			<div className="w-60 h-[500px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-1 left-1 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Standard Width
				</div>
				<Palette
					signers={sampleSigners}
					viewMode={ViewMode.EDITOR}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
				/>
			</div>
			<div className="w-48 h-[500px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-1 left-1 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Narrow
				</div>
				<Palette
					signers={sampleSigners.slice(0, 3)}
					viewMode={ViewMode.EDITOR}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
				/>
			</div>
			<div className="w-80 h-[500px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-1 left-1 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Wide
				</div>
				<Palette
					signers={sampleSigners}
					viewMode={ViewMode.EDITOR}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
				/>
			</div>
		</div>
	),
};

export const EmptyState: Story = {
	args: {
		signers: [],
		viewMode: ViewMode.EDITOR,
		onToolSelect: (tool) => {
			console.log('Tool selected:', tool);
		},
		onUserSelect: (user) => {
			console.log('User selected:', user);
		},
	},
};

export const SingleSignerInteraction: Story = {
	args: {
		...Default.args,
		signers: [
			{
				email: 'solo@example.com',
				name: 'Solo User',
				color: USER_COLORS[0],
				isFilled: false,
			},
		],
	},
};
