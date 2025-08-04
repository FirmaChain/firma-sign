import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedPalette } from './EnhancedPalette';
import { ComponentType, ViewMode } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof EnhancedPalette> = {
	title: 'Components/Editor/EnhancedPalette',
	component: EnhancedPalette,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		viewMode: {
			control: { type: 'select' },
			options: [ViewMode.EDITOR, ViewMode.FORM, ViewMode.PREVIEW],
		},
		selectedTool: {
			control: { type: 'select' },
			options: [null, ...Object.values(ComponentType)],
		},
		numPages: {
			control: { type: 'number', min: 1, max: 10 },
		},
		selectedPage: {
			control: { type: 'number', min: 0, max: 9 },
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

const sampleSigners = [
	{
		email: 'john@example.com',
		name: 'John Doe',
		color: USER_COLORS[0],
	},
	{
		email: 'jane@example.com',
		name: 'Jane Smith',
		color: USER_COLORS[1],
	},
	{
		email: 'mike@example.com',
		name: 'Mike Wilson',
		color: USER_COLORS[2],
	},
	{
		email: 'sarah@example.com',
		name: 'Sarah Johnson',
		color: USER_COLORS[3],
	},
];

export const Default: Story = {
	args: {
		signers: sampleSigners,
		selectedTool: null,
		viewMode: ViewMode.EDITOR,
		numPages: 1,
		selectedPage: 0,
		onToolSelect: (tool) => {
			console.log('Tool selected:', tool);
		},
		onUserSelect: (user) => {
			console.log('User selected:', user);
		},
		onPageSelect: (page) => {
			console.log('Page selected:', page);
		},
	},
};

export const WithSelectedTool: Story = {
	args: {
		...Default.args,
		selectedTool: ComponentType.SIGNATURE,
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
			},
			{
				email: 'emma@example.com',
				name: 'Emma Davis',
				color: USER_COLORS[5],
			},
			{
				email: 'chris@example.com',
				name: 'Chris Wilson',
				color: USER_COLORS[6],
			},
			{
				email: 'lisa@example.com',
				name: 'Lisa Anderson',
				color: USER_COLORS[7],
			},
		],
	},
};

export const MultiPageDocument: Story = {
	args: {
		...Default.args,
		numPages: 5,
		selectedPage: 2,
	},
};

export const FormMode: Story = {
	args: {
		...Default.args,
		viewMode: ViewMode.FORM,
	},
};

export const PreviewMode: Story = {
	args: {
		...Default.args,
		viewMode: ViewMode.PREVIEW,
	},
};

export const DifferentToolSelections: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-4">
			<div className="w-80 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
					Text Tool Selected
				</div>
				<EnhancedPalette
					signers={sampleSigners}
					selectedTool={ComponentType.TEXT}
					viewMode={ViewMode.EDITOR}
					numPages={1}
					selectedPage={0}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
					onPageSelect={(page) => console.log('Page selected:', page)}
				/>
			</div>
			<div className="w-80 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10">
					Signature Tool Selected
				</div>
				<EnhancedPalette
					signers={sampleSigners}
					selectedTool={ComponentType.SIGNATURE}
					viewMode={ViewMode.EDITOR}
					numPages={1}
					selectedPage={0}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
					onPageSelect={(page) => console.log('Page selected:', page)}
				/>
			</div>
		</div>
	),
};

export const AllTools: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4 max-w-6xl">
			{Object.values(ComponentType)
				.slice(0, 9)
				.map((toolType) => (
					<div
						key={toolType}
						className="w-80 h-[400px] border border-gray-200 rounded-lg overflow-hidden"
					>
						<div className="absolute top-1 left-1 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
							{toolType}
						</div>
						<EnhancedPalette
							signers={sampleSigners}
							selectedTool={toolType}
							viewMode={ViewMode.EDITOR}
							numPages={1}
							selectedPage={0}
							onToolSelect={(tool) => console.log('Tool selected:', tool)}
							onUserSelect={(user) => console.log('User selected:', user)}
							onPageSelect={(page) => console.log('Page selected:', page)}
						/>
					</div>
				))}
		</div>
	),
};

export const ResponsiveNarrow: Story = {
	args: {
		...Default.args,
	},
	decorators: [
		(Story) => (
			<div className="w-48 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<Story />
			</div>
		),
	],
};

export const ResponsiveCompact: Story = {
	args: {
		...Default.args,
	},
	decorators: [
		(Story) => (
			<div className="w-32 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<Story />
			</div>
		),
	],
};

export const InteractiveDemo: Story = {
	render: () => {
		const [selectedTool, setSelectedTool] = React.useState<ComponentType | null>(null);
		const [selectedPage, setSelectedPage] = React.useState(0);

		return (
			<div className="w-80 h-[600px] border border-gray-200 rounded-lg overflow-hidden">
				<EnhancedPalette
					signers={sampleSigners}
					selectedTool={selectedTool}
					viewMode={ViewMode.EDITOR}
					numPages={3}
					selectedPage={selectedPage}
					onToolSelect={setSelectedTool}
					onUserSelect={(user) => console.log('User selected:', user)}
					onPageSelect={setSelectedPage}
				/>
			</div>
		);
	},
};

export const LongSignerNames: Story = {
	args: {
		...Default.args,
		signers: [
			{
				email: 'verylongname@verylongdomainname.com',
				name: 'Dr. Jonathan Alexander Williamson III',
				color: USER_COLORS[0],
			},
			{
				email: 'anotherlongname@company.com',
				name: 'Elizabeth Catherine Montgomery-Smith',
				color: USER_COLORS[1],
			},
			{
				email: 'short@co.com',
				name: 'Jo',
				color: USER_COLORS[2],
			},
		],
	},
};

export const WithCustomColors: Story = {
	args: {
		...Default.args,
		signers: [
			{
				email: 'red@example.com',
				name: 'Red User',
				color: '#ef4444',
			},
			{
				email: 'green@example.com',
				name: 'Green User',
				color: '#22c55e',
			},
			{
				email: 'purple@example.com',
				name: 'Purple User',
				color: '#8b5cf6',
			},
			{
				email: 'orange@example.com',
				name: 'Orange User',
				color: '#f97316',
			},
		],
	},
};

export const ToolInteractionStates: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-4">
			<div className="w-80 h-[300px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Drawing Tools (No Assignment)
				</div>
				<EnhancedPalette
					signers={sampleSigners}
					selectedTool={ComponentType.RECTANGLE}
					viewMode={ViewMode.EDITOR}
					numPages={1}
					selectedPage={0}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
					onPageSelect={(page) => console.log('Page selected:', page)}
				/>
			</div>
			<div className="w-80 h-[300px] border border-gray-200 rounded-lg overflow-hidden">
				<div className="absolute top-2 left-2 text-xs font-medium text-gray-600 z-10 bg-white px-1 rounded">
					Assignment Tools
				</div>
				<EnhancedPalette
					signers={sampleSigners}
					selectedTool={ComponentType.SIGNATURE}
					viewMode={ViewMode.EDITOR}
					numPages={1}
					selectedPage={0}
					onToolSelect={(tool) => console.log('Tool selected:', tool)}
					onUserSelect={(user) => console.log('User selected:', user)}
					onPageSelect={(page) => console.log('Page selected:', page)}
				/>
			</div>
		</div>
	),
};

export const EmptyState: Story = {
	args: {
		signers: [],
		selectedTool: null,
		viewMode: ViewMode.EDITOR,
		numPages: 1,
		selectedPage: 0,
		onToolSelect: (tool) => {
			console.log('Tool selected:', tool);
		},
		onUserSelect: (user) => {
			console.log('User selected:', user);
		},
		onPageSelect: (page) => {
			console.log('Page selected:', page);
		},
	},
};
