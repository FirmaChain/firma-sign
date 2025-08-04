import { createContext, useCallback, useContext, useState, type FC, type ReactNode } from 'react';
import { FloatingPanelPosition, PanelPosition } from './FloatingPanel';

// Calculate smart default positions that work within typical container sizes
const calculateDefaultPositions = () => {
	// Assume a reasonable container size (most containers will be at least this wide)
	const assumedContainerWidth = Math.max(
		800,
		typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1200,
	);
	const leftPanelWidth = 260;
	const rightPanelWidth = 320;
	const gap = 20;

	return {
		left: { x: gap, y: 100 },
		right: {
			x: Math.max(leftPanelWidth + gap * 2, assumedContainerWidth - rightPanelWidth - gap),
			y: 100,
		},
	};
};

export interface PanelState {
	position: PanelPosition;
	floatingPosition: FloatingPanelPosition;
	isPinned: boolean;
	isVisible: boolean;
	width: number;
	height: number;
}

export interface PanelManagerState {
	leftPanel: PanelState;
	rightPanel: PanelState;
}

export interface PanelManagerContextType {
	state: PanelManagerState;
	updateLeftPanel: (updates: Partial<PanelState>) => void;
	updateRightPanel: (updates: Partial<PanelState>) => void;
	toggleLeftPanel: () => void;
	toggleRightPanel: () => void;
	resetPanels: () => void;
	adjustPanelsToContainer: (containerWidth: number, containerHeight: number) => void;
}

const getDefaultPanelState = (): PanelManagerState => {
	const positions = calculateDefaultPositions();

	return {
		leftPanel: {
			position: 'floating',
			floatingPosition: positions.left,
			isPinned: false,
			isVisible: true,
			width: 260,
			height: 600,
		},
		rightPanel: {
			position: 'floating',
			floatingPosition: positions.right,
			isPinned: false,
			isVisible: true,
			width: 320,
			height: 600,
		},
	};
};

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export const usePanelManager = (): PanelManagerContextType => {
	const context = useContext(PanelManagerContext);
	if (!context) {
		throw new Error('usePanelManager must be used within a PanelManagerProvider');
	}
	return context;
};

export interface PanelManagerProviderProps {
	children: ReactNode;
	initialState?: Partial<PanelManagerState>;
}

export const PanelManagerProvider: FC<PanelManagerProviderProps> = ({
	children,
	initialState,
}) => {
	const [state, setState] = useState<PanelManagerState>(() => ({
		...getDefaultPanelState(),
		...initialState,
	}));

	const updateLeftPanel = useCallback((updates: Partial<PanelState>) => {
		setState((prev) => ({
			...prev,
			leftPanel: { ...prev.leftPanel, ...updates },
		}));
	}, []);

	const updateRightPanel = useCallback((updates: Partial<PanelState>) => {
		setState((prev) => ({
			...prev,
			rightPanel: { ...prev.rightPanel, ...updates },
		}));
	}, []);

	const toggleLeftPanel = useCallback(() => {
		setState((prev) => ({
			...prev,
			leftPanel: { ...prev.leftPanel, isVisible: !prev.leftPanel.isVisible },
		}));
	}, []);

	const toggleRightPanel = useCallback(() => {
		setState((prev) => ({
			...prev,
			rightPanel: { ...prev.rightPanel, isVisible: !prev.rightPanel.isVisible },
		}));
	}, []);

	const resetPanels = useCallback(() => {
		setState(getDefaultPanelState());
	}, []);

	const adjustPanelsToContainer = useCallback((containerWidth: number, containerHeight: number) => {
		setState((prev) => {
			const gap = 20;
			const leftPanelWidth = prev.leftPanel.width;
			const rightPanelWidth = prev.rightPanel.width;

			// Calculate new positions based on actual container dimensions
			const newLeftPosition = {
				x: gap,
				y: Math.min(
					prev.leftPanel.floatingPosition.y,
					containerHeight - prev.leftPanel.height - gap,
				),
			};

			const newRightPosition = {
				x: Math.max(
					leftPanelWidth + gap * 2, // Don't overlap with left panel
					Math.min(
						prev.rightPanel.floatingPosition.x, // Keep current position if it fits
						containerWidth - rightPanelWidth - gap, // Or move it to fit within container
					),
				),
				y: Math.min(
					prev.rightPanel.floatingPosition.y,
					containerHeight - prev.rightPanel.height - gap,
				),
			};

			return {
				...prev,
				leftPanel: {
					...prev.leftPanel,
					floatingPosition: newLeftPosition,
				},
				rightPanel: {
					...prev.rightPanel,
					floatingPosition: newRightPosition,
				},
			};
		});
	}, []);

	const value: PanelManagerContextType = {
		state,
		updateLeftPanel,
		updateRightPanel,
		toggleLeftPanel,
		toggleRightPanel,
		resetPanels,
		adjustPanelsToContainer,
	};

	return <PanelManagerContext.Provider value={value}>{children}</PanelManagerContext.Provider>;
};
