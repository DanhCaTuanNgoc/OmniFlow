export type CopilotDraft = {
  template: 'stop-loss' | 'take-profit';
  thresholdUsd: string;
  sellPercent: number | null;
};
