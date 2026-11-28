import { create } from 'zustand';

interface StudioHeaderState {
  pipelineName: string;
  isEditable: boolean;
  onRename?: (newName: string) => void;
  activeAutomationName: string;
  setStudioHeader: (params: {
    pipelineName: string;
    isEditable: boolean;
    onRename?: (newName: string) => void;
  }) => void;
  clearStudioHeader: () => void;
  setActiveAutomationHeader: (name: string) => void;
  clearActiveAutomationHeader: () => void;
}

export const useStudioHeaderStore = create<StudioHeaderState>((set) => ({
  pipelineName: '',
  isEditable: false,
  onRename: undefined,
  activeAutomationName: '',
  setStudioHeader: (params) => set(params),
  clearStudioHeader: () => set({ pipelineName: '', isEditable: false, onRename: undefined }),
  setActiveAutomationHeader: (activeAutomationName) => set({ activeAutomationName }),
  clearActiveAutomationHeader: () => set({ activeAutomationName: '' }),
}));
