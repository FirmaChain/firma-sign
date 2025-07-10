import React, { createContext, useCallback, useContext, useState } from 'react';
import { FloatingPanelPosition, PanelPosition } from './FloatingPanel';

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
}

const getDefaultPanelState = (): PanelManagerState => ({
  leftPanel: {
    position: 'floating',
    floatingPosition: { x: 20, y: 100 },
    isPinned: false,
    isVisible: true,
    width: 260,
    height: 600
  },
  rightPanel: {
    position: 'floating',
    floatingPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 340 : 1000, y: 100 },
    isPinned: false,
    isVisible: true,
    width: 320,
    height: 600
  }
});

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export const usePanelManager = (): PanelManagerContextType => {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager must be used within a PanelManagerProvider');
  }
  return context;
};

export interface PanelManagerProviderProps {
  children: React.ReactNode;
  initialState?: Partial<PanelManagerState>;
}

export const PanelManagerProvider: React.FC<PanelManagerProviderProps> = ({
  children,
  initialState
}) => {
  const [state, setState] = useState<PanelManagerState>(() => ({
    ...getDefaultPanelState(),
    ...initialState
  }));

  const updateLeftPanel = useCallback((updates: Partial<PanelState>) => {
    setState(prev => ({
      ...prev,
      leftPanel: { ...prev.leftPanel, ...updates }
    }));
  }, []);

  const updateRightPanel = useCallback((updates: Partial<PanelState>) => {
    setState(prev => ({
      ...prev,
      rightPanel: { ...prev.rightPanel, ...updates }
    }));
  }, []);

  const toggleLeftPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      leftPanel: { ...prev.leftPanel, isVisible: !prev.leftPanel.isVisible }
    }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      rightPanel: { ...prev.rightPanel, isVisible: !prev.rightPanel.isVisible }
    }));
  }, []);

  const resetPanels = useCallback(() => {
    setState(getDefaultPanelState());
  }, []);

  const value: PanelManagerContextType = {
    state,
    updateLeftPanel,
    updateRightPanel,
    toggleLeftPanel,
    toggleRightPanel,
    resetPanels
  };

  return (
    <PanelManagerContext.Provider value={value}>
      {children}
    </PanelManagerContext.Provider>
  );
};