import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RibbonMenu } from './RibbonMenu';

const meta: Meta<typeof RibbonMenu> = {
	title: 'Components/Editor/RibbonMenu',
	component: RibbonMenu,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	argTypes: {
		contractName: {
			control: { type: 'text' },
		},
		viewMode: {
			control: { type: 'select' },
			options: ['editor', 'input', 'sign'],
		},
		btnDisabled: {
			control: { type: 'boolean' },
		},
		hideSave: {
			control: { type: 'boolean' },
		},
		enableNext: {
			control: { type: 'boolean' },
		},
		hideActionBtn: {
			control: { type: 'boolean' },
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full min-h-screen bg-gray-100 p-8">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorMode: Story = {
	args: {
		contractName: 'Contract Agreement',
		viewMode: 'editor',
		btnDisabled: false,
		hideSave: false,
		enableNext: false,
		hideActionBtn: false,
		handleFinishInput: () => {
			console.log('Handle finish input');
		},
		onFinish: () => {
			console.log('Handle finish');
		},
	},
};

export const InputMode: Story = {
	args: {
		...EditorMode.args,
		contractName: 'Employment Agreement',
		viewMode: 'input',
	},
};

export const SignMode: Story = {
	args: {
		...EditorMode.args,
		contractName: 'Non-Disclosure Agreement',
		viewMode: 'sign',
	},
};

export const EditorModeWithoutSave: Story = {
	args: {
		...EditorMode.args,
		hideSave: true,
	},
};

export const InputModeDisabled: Story = {
	args: {
		...InputMode.args,
		btnDisabled: true,
	},
};

export const SignModeDisabled: Story = {
	args: {
		...SignMode.args,
		btnDisabled: true,
	},
};

export const WithNextEnabled: Story = {
	args: {
		...EditorMode.args,
		enableNext: true,
	},
};

export const WithoutActions: Story = {
	args: {
		...EditorMode.args,
		hideActionBtn: true,
	},
};

export const LongDocumentName: Story = {
	args: {
		...EditorMode.args,
		contractName: 'Very Long Document Name That Should Be Truncated When Display Space Is Limited',
	},
};

export const ShortDocumentName: Story = {
	args: {
		...EditorMode.args,
		contractName: 'Doc',
	},
};

export const AllModes: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8 space-y-8">
			<div>
				<h2 className="text-lg font-semibold mb-4">Editor Mode</h2>
				<RibbonMenu
					contractName="Document Editor"
					viewMode="editor"
					btnDisabled={false}
					hideSave={false}
					enableNext={false}
					hideActionBtn={false}
					handleFinishInput={() => console.log('Handle finish input')}
					onFinish={() => console.log('Handle finish')}
				/>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-4">Input Mode</h2>
				<RibbonMenu
					contractName="Document Input"
					viewMode="input"
					btnDisabled={false}
					hideSave={false}
					enableNext={false}
					hideActionBtn={false}
					handleFinishInput={() => console.log('Handle finish input')}
					onFinish={() => console.log('Handle finish')}
				/>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-4">Sign Mode</h2>
				<RibbonMenu
					contractName="Document Signing"
					viewMode="sign"
					btnDisabled={false}
					hideSave={false}
					enableNext={false}
					hideActionBtn={false}
					handleFinishInput={() => console.log('Handle finish input')}
					onFinish={() => console.log('Handle finish')}
				/>
			</div>
		</div>
	),
};

export const DisabledStates: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-8 space-y-8">
			<div>
				<h2 className="text-lg font-semibold mb-4">Input Mode - Disabled</h2>
				<RibbonMenu
					contractName="Incomplete Document"
					viewMode="input"
					btnDisabled={true}
					hideSave={false}
					enableNext={false}
					hideActionBtn={false}
					handleFinishInput={() => console.log('Handle finish input')}
					onFinish={() => console.log('Handle finish')}
				/>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-4">Sign Mode - Disabled</h2>
				<RibbonMenu
					contractName="Incomplete Document"
					viewMode="sign"
					btnDisabled={true}
					hideSave={false}
					enableNext={false}
					hideActionBtn={false}
					handleFinishInput={() => console.log('Handle finish input')}
					onFinish={() => console.log('Handle finish')}
				/>
			</div>
		</div>
	),
};

export const CustomStyling: Story = {
	args: {
		...EditorMode.args,
		className: 'border-2 border-blue-500 bg-blue-50',
	},
};

export const InteractiveDemo: Story = {
	render: function InteractiveDemoRender() {
		const [viewMode, setViewMode] = React.useState('editor');
		const [btnDisabled, setBtnDisabled] = React.useState(false);
		const [hideSave, setHideSave] = React.useState(false);
		const [enableNext, setEnableNext] = React.useState(false);
		const [hideActionBtn, setHideActionBtn] = React.useState(false);
		const [contractName, setContractName] = React.useState('Interactive Demo Document');

		return (
			<div className="w-full min-h-screen bg-gray-100 p-8">
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="bg-white p-6 rounded-lg shadow-lg">
						<h2 className="text-xl font-bold mb-4">Interactive Ribbon Menu Demo</h2>

						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Document Name
								</label>
								<input
									type="text"
									value={contractName}
									onChange={(e) => setContractName(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-md text-sm"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
								<select
									value={viewMode}
									onChange={(e) => setViewMode(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-md text-sm"
								>
									<option value="editor">Editor</option>
									<option value="input">Input</option>
									<option value="sign">Sign</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-gray-700">Options</label>
								<div className="space-y-1">
									<label className="flex items-center text-sm">
										<input
											type="checkbox"
											checked={btnDisabled}
											onChange={(e) => setBtnDisabled(e.target.checked)}
											className="mr-2"
										/>
										Button Disabled
									</label>
									<label className="flex items-center text-sm">
										<input
											type="checkbox"
											checked={hideSave}
											onChange={(e) => setHideSave(e.target.checked)}
											className="mr-2"
										/>
										Hide Save
									</label>
									<label className="flex items-center text-sm">
										<input
											type="checkbox"
											checked={enableNext}
											onChange={(e) => setEnableNext(e.target.checked)}
											className="mr-2"
										/>
										Enable Next
									</label>
									<label className="flex items-center text-sm">
										<input
											type="checkbox"
											checked={hideActionBtn}
											onChange={(e) => setHideActionBtn(e.target.checked)}
											className="mr-2"
										/>
										Hide Actions
									</label>
								</div>
							</div>
						</div>
					</div>

					<RibbonMenu
						contractName={contractName}
						viewMode={viewMode}
						btnDisabled={btnDisabled}
						hideSave={hideSave}
						enableNext={enableNext}
						hideActionBtn={hideActionBtn}
						handleFinishInput={() => console.log('Handle finish input')}
						onFinish={() => console.log('Handle finish')}
					/>
				</div>
			</div>
		);
	},
};

export const WorkflowDemo: Story = {
	render: function WorkflowDemoRender() {
		const [currentStep, setCurrentStep] = React.useState(0);
		const [isCompleted, setIsCompleted] = React.useState(false);

		const steps = [
			{
				mode: 'editor',
				title: 'Document Creation',
				description: 'Create and design your document',
				btnDisabled: false,
			},
			{
				mode: 'input',
				title: 'Information Input',
				description: 'Fill in required information',
				btnDisabled: false,
			},
			{
				mode: 'sign',
				title: 'Document Signing',
				description: 'Sign the completed document',
				btnDisabled: false,
			},
		];

		const handleNext = () => {
			if (currentStep < steps.length - 1) {
				setCurrentStep(currentStep + 1);
			} else {
				setIsCompleted(true);
			}
		};

		const handleReset = () => {
			setCurrentStep(0);
			setIsCompleted(false);
		};

		if (isCompleted) {
			return (
				<div className="w-full min-h-screen bg-gray-100 p-8">
					<div className="max-w-4xl mx-auto">
						<div className="bg-white p-8 rounded-lg shadow-lg text-center">
							<div className="text-green-500 text-6xl mb-4">✓</div>
							<h2 className="text-2xl font-bold text-gray-800 mb-2">Document Complete!</h2>
							<p className="text-gray-600 mb-6">
								Your document has been successfully processed through all workflow steps.
							</p>
							<button
								onClick={handleReset}
								className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
							>
								Start New Document
							</button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="w-full min-h-screen bg-gray-100 p-8">
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="bg-white p-6 rounded-lg shadow-lg">
						<h2 className="text-xl font-bold mb-4">Document Workflow Demo</h2>

						<div className="flex items-center justify-between mb-6">
							{steps.map((step, index) => (
								<div
									key={index}
									className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											index === currentStep
												? 'bg-blue-500 text-white'
												: index < currentStep
													? 'bg-green-500 text-white'
													: 'bg-gray-200 text-gray-500'
										}`}
									>
										{index < currentStep ? '✓' : index + 1}
									</div>
									<div className="ml-3">
										<div className="text-sm font-medium">{step.title}</div>
										<div className="text-xs text-gray-500">{step.description}</div>
									</div>
									{index < steps.length - 1 && (
										<div
											className={`flex-1 h-0.5 mx-4 ${
												index < currentStep ? 'bg-green-500' : 'bg-gray-200'
											}`}
										/>
									)}
								</div>
							))}
						</div>
					</div>

					<RibbonMenu
						contractName={`Workflow Demo - ${steps[currentStep].title}`}
						viewMode={steps[currentStep].mode}
						btnDisabled={steps[currentStep].btnDisabled}
						hideSave={false}
						enableNext={false}
						hideActionBtn={false}
						handleFinishInput={handleNext}
						onFinish={handleNext}
					/>

					<div className="bg-white p-6 rounded-lg shadow-lg">
						<h3 className="text-lg font-semibold mb-2">Current Step: {steps[currentStep].title}</h3>
						<p className="text-gray-600 mb-4">{steps[currentStep].description}</p>
						<div className="text-sm text-gray-500">
							Step {currentStep + 1} of {steps.length}
						</div>
					</div>
				</div>
			</div>
		);
	},
};

export const ResponsiveDemo: Story = {
	render: () => (
		<div className="w-full min-h-screen bg-gray-100 p-4">
			<div className="space-y-8">
				<div>
					<h2 className="text-lg font-semibold mb-4">Desktop View</h2>
					<div className="max-w-6xl">
						<RibbonMenu
							contractName="Responsive Document Name That Might Be Long"
							viewMode="editor"
							btnDisabled={false}
							hideSave={false}
							enableNext={false}
							hideActionBtn={false}
							handleFinishInput={() => console.log('Handle finish input')}
							onFinish={() => console.log('Handle finish')}
						/>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-semibold mb-4">Tablet View</h2>
					<div className="max-w-3xl">
						<RibbonMenu
							contractName="Responsive Document Name That Might Be Long"
							viewMode="editor"
							btnDisabled={false}
							hideSave={false}
							enableNext={false}
							hideActionBtn={false}
							handleFinishInput={() => console.log('Handle finish input')}
							onFinish={() => console.log('Handle finish')}
						/>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-semibold mb-4">Mobile View</h2>
					<div className="max-w-sm">
						<RibbonMenu
							contractName="Responsive Document Name That Might Be Long"
							viewMode="editor"
							btnDisabled={false}
							hideSave={false}
							enableNext={false}
							hideActionBtn={false}
							handleFinishInput={() => console.log('Handle finish input')}
							onFinish={() => console.log('Handle finish')}
						/>
					</div>
				</div>
			</div>
		</div>
	),
};
