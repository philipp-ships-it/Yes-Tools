import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  // Text Compare
  compareText1: string;
  compareText2: string;
  compareAutoAlign: boolean;
  setCompareState: (updates: Partial<Pick<AppState, 'compareText1' | 'compareText2' | 'compareAutoAlign'>>) => void;

  // Dev Tools
  devActiveTab: 'format' | 'encode' | 'comments' | 'outlook' | 'typography' | 'obfuscate';
  devFmInput: string;
  devFmLanguage: 'html' | 'css' | 'js';
  devEdInput: string;
  devEdType: 'base64' | 'url' | 'hex' | 'html';
  devEdAction: 'encode' | 'decode';
  devOutlookType: 'vml-bg' | 'vml-button' | 'ghost-table';
  devTypoInput: string;
  devObfuscateInput: string;
  setDevState: (updates: Partial<Pick<AppState, 'devActiveTab' | 'devFmInput' | 'devFmLanguage' | 'devEdInput' | 'devEdType' | 'devEdAction' | 'devOutlookType' | 'devTypoInput' | 'devObfuscateInput'>>) => void;

  // Word to HTML
  wordHtmlOutput: string;
  wordEmbedImages: boolean;
  setWordState: (updates: Partial<Pick<AppState, 'wordHtmlOutput' | 'wordEmbedImages'>>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Text Compare
      compareText1: '',
      compareText2: '',
      compareAutoAlign: true,
      setCompareState: (updates) => set((state) => ({ ...state, ...updates })),

      // Dev Tools
      devActiveTab: 'format',
      devFmInput: '',
      devFmLanguage: 'html',
      devEdInput: '',
      devEdType: 'base64',
      devEdAction: 'encode',
      devOutlookType: 'vml-bg',
      devTypoInput: '',
      devObfuscateInput: '',
      setDevState: (updates) => set((state) => ({ ...state, ...updates })),

      // Word to HTML
      wordHtmlOutput: '',
      wordEmbedImages: false,
      setWordState: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'yes-app-storage',
    }
  )
);
