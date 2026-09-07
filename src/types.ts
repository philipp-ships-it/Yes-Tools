export enum EscapeMode {
  FULL = 'FULL',
  CONTENT_ONLY = 'CONTENT_ONLY'
}

export type ActionType = 'ESCAPE' | 'UNESCAPE';

export interface EscapeSettings {
  htmlChars: boolean; // < > " ' & /
  umlauts: boolean;   // ä ö ü Ä Ö Ü ß
  symbols: boolean;   // € …
  emojis: boolean;    // 🚀 🌟
  encodingFormat: 'decimal' | 'hex';
  autoFixEncoding: boolean;
}

export interface ToastState {
  show: boolean;
  message: string;
}