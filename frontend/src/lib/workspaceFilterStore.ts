'use client';

import { create } from 'zustand';

export type StudioStatusFilter = 'ALL' | 'DRAFTS' | 'ACTIVE' | 'ARCHIVED';
export type ActiveStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'SETUP' | 'PENDING' | 'ARCHIVED';
export type LogsStatusFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'SKIPPED' | 'UNVERIFIED';

interface WorkspaceFilterState {
  studioSearch: string;
  studioStatus: StudioStatusFilter;
  activeSearch: string;
  activeStatus: ActiveStatusFilter;
  templatesSearch: string;
  templatesCategory: string;
  logsSearch: string;
  logsStatus: LogsStatusFilter;
  setStudioSearch: (studioSearch: string) => void;
  setStudioStatus: (studioStatus: StudioStatusFilter) => void;
  resetStudioFilters: () => void;
  setActiveSearch: (activeSearch: string) => void;
  setActiveStatus: (activeStatus: ActiveStatusFilter) => void;
  setTemplatesSearch: (templatesSearch: string) => void;
  setTemplatesCategory: (templatesCategory: string) => void;
  setLogsSearch: (logsSearch: string) => void;
  setLogsStatus: (logsStatus: LogsStatusFilter) => void;
}

export const useWorkspaceFilterStore = create<WorkspaceFilterState>((set) => ({
  studioSearch: '',
  studioStatus: 'ALL',
  activeSearch: '',
  activeStatus: 'ALL',
  templatesSearch: '',
  templatesCategory: 'all',
  logsSearch: '',
  logsStatus: 'ALL',
  setStudioSearch: (studioSearch) => set({ studioSearch }),
  setStudioStatus: (studioStatus) => set({ studioStatus }),
  resetStudioFilters: () => set({ studioSearch: '', studioStatus: 'ALL' }),
  setActiveSearch: (activeSearch) => set({ activeSearch }),
  setActiveStatus: (activeStatus) => set({ activeStatus }),
  setTemplatesSearch: (templatesSearch) => set({ templatesSearch }),
  setTemplatesCategory: (templatesCategory) => set({ templatesCategory }),
  setLogsSearch: (logsSearch) => set({ logsSearch }),
  setLogsStatus: (logsStatus) => set({ logsStatus }),
}));
