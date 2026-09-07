import React from 'react';
import { EscapeSettings, EscapeMode } from '@/types';

interface SettingsPanelProps {
  settings: EscapeSettings;
  onUpdate: (key: keyof EscapeSettings, value: any) => void;
  mode: EscapeMode;
  onModeChange: (mode: EscapeMode) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, mode, onModeChange }) => {
  const toggle = (key: keyof EscapeSettings) => onUpdate(key, !settings[key]);

  const ToggleSwitch = ({ checked }: { checked: boolean }) => (
    <div className={`
      w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out
      ${checked ? 'bg-tg-light-primary dark:bg-tg-dark-primary' : 'bg-gray-300 dark:bg-gray-600'}
    `}>
      <div className={`
        w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-4' : 'translate-x-0'}
      `} />
    </div>
  );

  const Item = ({ 
    settingKey, 
    label, 
    sub 
  }: { 
    settingKey: keyof EscapeSettings; 
    label: string; 
    sub: string 
  }) => (
    <div 
      onClick={() => toggle(settingKey)}
      className="flex items-center justify-between py-3 cursor-pointer group"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text">
            {label}
        </span>
        <span className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
            {sub}
        </span>
      </div>
      
      <ToggleSwitch checked={settings[settingKey] as boolean} />
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-tg-light-border dark:divide-tg-dark-border">
        {/* Mode Selector */}
        <div className="py-3 flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text">
                Escape Mode
            </span>
            <span className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                {mode === EscapeMode.CONTENT_ONLY ? 'Preserves HTML tags' : 'Escapes everything'}
            </span>
          </div>
          <div className="flex bg-tg-light-secondary dark:bg-tg-dark-secondary rounded-lg p-1">
            <button
              onClick={() => onModeChange(EscapeMode.CONTENT_ONLY)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === EscapeMode.CONTENT_ONLY 
                  ? 'bg-white dark:bg-tg-dark-surface text-tg-light-primary dark:text-tg-dark-primary shadow-sm' 
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              Smart
            </button>
            <button
              onClick={() => onModeChange(EscapeMode.FULL)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === EscapeMode.FULL 
                  ? 'bg-white dark:bg-tg-dark-surface text-tg-light-primary dark:text-tg-dark-primary shadow-sm' 
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              Full
            </button>
          </div>
        </div>

        <Item 
          settingKey="autoFixEncoding"
          label="Auto-Fix Encoding"
          sub="Fix corrupted characters (e.g., fÃ¼r -> für)"
        />
        <Item 
          settingKey="umlauts" 
          label="German Umlauts" 
          sub="Convert ä, ö, ü, ß..." 
        />
        <Item 
          settingKey="symbols" 
          label="Special Symbols" 
          sub="Convert €, ©, ™..." 
        />
        <Item 
          settingKey="htmlChars" 
          label="HTML Structure" 
          sub="Convert <, >, &, '..." 
        />
        <Item 
          settingKey="emojis" 
          label="Emojis" 
          sub="Convert 🚀, 🌟, 😊..." 
        />
        
        {/* Encoding Format Selector */}
        <div className="py-3 flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text">
                Encoding Format
            </span>
            <span className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                Decimal (&#128640;) vs Hex (&#x1F680;)
            </span>
          </div>
          <div className="flex bg-tg-light-secondary dark:bg-tg-dark-secondary rounded-lg p-1">
            <button
              onClick={() => onUpdate('encodingFormat', 'decimal')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                settings.encodingFormat === 'decimal' 
                  ? 'bg-white dark:bg-tg-dark-surface text-tg-light-primary dark:text-tg-dark-primary shadow-sm' 
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              Decimal
            </button>
            <button
              onClick={() => onUpdate('encodingFormat', 'hex')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                settings.encodingFormat === 'hex' 
                  ? 'bg-white dark:bg-tg-dark-surface text-tg-light-primary dark:text-tg-dark-primary shadow-sm' 
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              Hexadecimal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};