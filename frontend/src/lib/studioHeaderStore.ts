import { create } from 'zustand';

interface StudioHeaderState {
  pipelineName: string;
  isEditable: boolean;
  onRename?: (newName: string) => void;
  setStudioHeader: (params: {
    pipelineName: string;
    isEditable: boolean;
    onRename?: (newName: string) => void;
  }) => void;
  clearStudioHeader: () => void;
}

export const useStudioHeaderStore = create<StudioHeaderState>((set) => ({
  pipelineName: '',
  isEditable: false,
  onRename: undefined,
  setStudioHeader: (params) => set(params),
  clearStudioHeader: () => set({ pipelineName: '', isEditable: false, onRename: undefined }),
}));
