import { EscapeMode, EscapeSettings } from '../types';

// 1. Basic HTML Characters (Risk of breaking code structure)
const HTML_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

// 2. German Umlauts
const UMLAUT_MAP: Record<string, string> = {
  "ä": "&auml;",
  "ö": "&ouml;",
  "ü": "&uuml;",
  "Ä": "&Auml;",
  "Ö": "&Ouml;",
  "Ü": "&Uuml;",
  "ß": "&szlig;"
};

// 3. Special Symbols (Currencies, punctuation)
const SYMBOL_MAP: Record<string, string> = {
  "€": "&euro;",
  "…": "&hellip;",
  "–": "&ndash;",
  "—": "&mdash;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "„": "&bdquo;",
  "“": "&ldquo;"
};

/**
 * helper to merge maps based on settings
 */
const getActiveMap = (settings: EscapeSettings): Record<string, string> => {
  let map: Record<string, string> = {};
  
  if (settings.htmlChars) {
    map = { ...map, ...HTML_MAP };
  }
  if (settings.umlauts) {
    map = { ...map, ...UMLAUT_MAP };
  }
  if (settings.symbols) {
    map = { ...map, ...SYMBOL_MAP };
  }
  
  return map;
};

/**
 * Dynamic escape function based on settings
 */
export const escapeWithSettings = (str: string, settings: EscapeSettings): string => {
  let result = str;
  const activeMap = getActiveMap(settings);
  const keys = Object.keys(activeMap);
  
  if (keys.length > 0) {
    // Create a regex that matches any of the keys
    // We escape special regex characters in the keys to be safe
    const pattern = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    result = result.replace(pattern, (s) => activeMap[s] || s);
  }

  // Handle Emoji Encoding
  if (settings.emojis) {
    // \p{Extended_Pictographic} matches most emojis. 
    // We use the 'u' flag for unicode property escapes.
    const emojiRegex = /\p{Extended_Pictographic}/gu;
    result = result.replace(emojiRegex, (match) => {
      const codePoint = match.codePointAt(0);
      if (!codePoint) return match;
      
      if (settings.encodingFormat === 'hex') {
        return `&#x${codePoint.toString(16).toUpperCase()};`;
      } else {
        return `&#${codePoint};`;
      }
    });
  }
  
  return result;
};

/**
 * Standard unescape function
 * Decodes all HTML entities using the browser's built-in decoder
 */
export const unescapeStandard = (str: string): string => {
  if (typeof document === 'undefined') {
    // Fallback for SSR if needed, though this app is client-side
    return str;
  }
  
  const textArea = document.createElement('textarea');
  return String(str).replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    textArea.innerHTML = entity;
    return textArea.value;
  });
};

/**
 * Smart escape: Splits the string by HTML tags. 
 * Keeps tags intact, escapes text content between them based on settings.
 */
export const escapeContentOnly = (str: string, settings: EscapeSettings): string => {
  const parts = str.split(/(<[^>]*>)/g);

  return parts.map(part => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return part;
    }
    return escapeWithSettings(part, settings);
  }).join('');
};

/**
 * Main processor function
 */
export const processText = (
  text: string, 
  action: 'ESCAPE' | 'UNESCAPE', 
  mode: EscapeMode,
  settings: EscapeSettings
): string => {
  if (!text) return '';

  if (action === 'UNESCAPE') {
    return unescapeStandard(text);
  }

  // Action is ESCAPE
  if (mode === EscapeMode.FULL) {
    return escapeWithSettings(text, settings);
  } else {
    return escapeContentOnly(text, settings);
  }
};