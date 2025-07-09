import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from './Editor';
import { SAMPLE_PDF_BASE64, MULTI_PAGE_PDF_BASE64 } from './pdf-utils';
import { AssignedUser, DocumentComponent, ComponentType } from './types';
import { USER_COLORS } from './constants';

const meta: Meta<typeof Editor> = {
  title: 'Components/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    viewMode: {
      control: { type: 'select' },
      options: ['editor', 'input', 'sign', 'preview', 'viewer'],
    },
    preview: {
      control: { type: 'boolean' },
    },
    hideActionBtn: {
      control: { type: 'boolean' },
    },
    hideSave: {
      control: { type: 'boolean' },
    },
    enableNext: {
      control: { type: 'boolean' },
    },
    fileUrl: {
      control: { type: 'text' },
      description: 'URL of the PDF file to display',
    },
    fileId: {
      control: { type: 'text' },
      description: 'File ID for the PDF document',
    },
    contractId: {
      control: { type: 'text' },
      description: 'Contract ID for the document',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample users for testing
const sampleSigners: AssignedUser[] = [
  {
    userId: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    color: USER_COLORS[0]
  },
  {
    userId: '2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    color: USER_COLORS[1]
  },
  {
    userId: '3',
    email: 'mike.wilson@example.com',
    name: 'Mike Wilson',
    color: USER_COLORS[2]
  }
];

// Sample components for testing
const sampleComponents: DocumentComponent[] = [
  {
    id: 'comp-1',
    type: ComponentType.SIGNATURE,
    pageNumber: 0,
    position: { x: 100, y: 200 },
    size: { width: 150, height: 60 },
    assigned: sampleSigners[0],
    config: { required: true, backgroundColor: '#f8f9ff', borderColor: '#3b82f6' },
    created: Date.now() - 1000
  },
  {
    id: 'comp-2',
    type: ComponentType.TEXT,
    pageNumber: 0,
    position: { x: 300, y: 150 },
    size: { width: 120, height: 30 },
    assigned: sampleSigners[1],
    config: { fontSize: 14, placeholder: 'Enter name...' },
    value: 'John Doe',
    created: Date.now() - 500
  },
  {
    id: 'comp-3',
    type: ComponentType.CHECKBOX,
    pageNumber: 0,
    position: { x: 200, y: 300 },
    size: { width: 20, height: 20 },
    assigned: sampleSigners[2],
    config: { required: true },
    created: Date.now()
  }
];

export const Default: Story = {
  args: {
    viewMode: 'editor',
    preview: false,
    hideActionBtn: false,
    hideSave: false,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
    signers: sampleSigners,
    components: [],
  },
};

export const InputMode: Story = {
  args: {
    viewMode: 'input',
    preview: false,
    hideActionBtn: false,
    hideSave: true,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
  },
};

export const SignMode: Story = {
  args: {
    viewMode: 'sign',
    preview: false,
    hideActionBtn: false,
    hideSave: true,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
  },
};

export const PreviewMode: Story = {
  args: {
    viewMode: 'preview',
    preview: true,
    hideActionBtn: true,
    hideSave: true,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
  },
};

export const ViewerMode: Story = {
  args: {
    viewMode: 'viewer',
    preview: false,
    hideActionBtn: true,
    hideSave: true,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
  },
};

export const WithNextButton: Story = {
  args: {
    viewMode: 'input',
    preview: false,
    hideActionBtn: false,
    hideSave: true,
    enableNext: true,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
  },
};

export const WithMultiPagePDF: Story = {
  args: {
    viewMode: 'editor',
    preview: false,
    hideActionBtn: false,
    hideSave: false,
    enableNext: false,
    fileUrl: MULTI_PAGE_PDF_BASE64,
    fileId: 'multi-page-test',
    contractId: 'contract-multi',
    signers: sampleSigners,
    components: [],
  },
};

export const WithExistingComponents: Story = {
  args: {
    viewMode: 'editor',
    preview: false,
    hideActionBtn: false,
    hideSave: false,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
    signers: sampleSigners,
    components: sampleComponents,
  },
};

export const InputModeWithComponents: Story = {
  args: {
    viewMode: 'input',
    preview: false,
    hideActionBtn: false,
    hideSave: true,
    enableNext: false,
    fileUrl: SAMPLE_PDF_BASE64,
    fileId: 'sample-file-1',
    contractId: 'contract-123',
    signers: sampleSigners,
    components: sampleComponents,
  },
};