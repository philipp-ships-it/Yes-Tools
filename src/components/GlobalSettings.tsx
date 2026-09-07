import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Moon, Sun, X, Cpu, Lock, BarChart3, Palette, LayoutGrid, Keyboard, Code2, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Sparkles, ExternalLink, Gauge, HardDrive, Activity, Clock, Zap } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ToolUsageDashboard } from './ToolUsageDashboard';
import {
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getOpenRouterModel,
  setOpenRouterModel,
  verifyOpenRouterKey,
  fetchOpenRouterModels,
  POPULAR_OPENROUTER_MODELS,
  OpenRouterModelInfo,
  OpenRouterKeyAuthInfo,
  getOpenRouterLimits,
  setOpenRouterLimits,
  getOpenRouterUsageStats,
  resetOpenRouterUsageStats,
  getOpenRouterLatencyHistory,
  clearOpenRouterLatencyHistory,
  OpenRouterUsageLimits,
  OpenRouterUsageStats,
  LatencyRecord
} from '../services/openrouterService';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

type TabKey = 'general' | 'appearance' | 'ai' | 'performance' | 'shortcuts' | 'stats' | 'html-tools' | 'image-tools';

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ isOpen, onClose, isDarkMode, setIsDarkMode }) => {
  const [temperature, setTemperature] = useLocalStorage('cocreator-temp', 0.7);
  const [systemPrompt, setSystemPrompt] = useLocalStorage('cocreator-system', 'Du bist YES KI, ein hilfreicher Coding-Assistent für XLPM Tools. Antworte immer auf Deutsch, sei freundlich und professionell. Denke Schritt für Schritt und erkläre deine Überlegungen verständlich.');
  const [fallbackModels, setFallbackModels] = useLocalStorage('cocreator-fallback-models', 'google/gemini-2.0-flash-exp:free,openrouter/free');
  
  // OpenRouter Key & Model state initialized from openrouterService
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [keyAuthInfo, setKeyAuthInfo] = useState<OpenRouterKeyAuthInfo | null>(null);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);

  const [selectedModel, setSelectedModel] = useState<string>('openrouter/auto');
  const [availableModels, setAvailableModels] = useState<OpenRouterModelInfo[]>(POPULAR_OPENROUTER_MODELS);
  const [modelSearch, setModelSearch] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Usage Limits & Budget Control State
  const [usageLimits, setUsageLimitsState] = useState<OpenRouterUsageLimits>(getOpenRouterLimits());
  const [usageStats, setUsageStatsState] = useState<OpenRouterUsageStats>(getOpenRouterUsageStats());

  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Tool-specific mock states for settings
  const [htmlDefaultMode, setHtmlDefaultMode] = useLocalStorage('settings-html-mode', 'CONTENT_ONLY');
  const [imageDefaultQuality, setImageDefaultQuality] = useLocalStorage('settings-image-quality', 80);

  // Initialize values when component mounts or opens
  useEffect(() => {
    if (isOpen) {
      setUsageLimitsState(getOpenRouterLimits());
      setUsageStatsState(getOpenRouterUsageStats());

      const currentKey = getOpenRouterApiKey();
      setApiKeyInput(currentKey);

      const currentModel = getOpenRouterModel();
      setSelectedModel(currentModel || 'openrouter/auto');

      // Auto-test key status if key exists
      if (currentKey) {
        testKeyStatus(currentKey);
      }

      // Fetch live models
      loadModels();
    }
  }, [isOpen]);

  const testKeyStatus = async (keyToTest: string) => {
    setIsTestingKey(true);
    const info = await verifyOpenRouterKey(keyToTest);
    setKeyAuthInfo(info);
    setIsTestingKey(false);
  };

  const handleApiKeyChange = (val: string) => {
    setApiKeyInput(val);
    setOpenRouterApiKey(val);
    setKeyAuthInfo(null);
  };

  const handleModelSelect = (mId: string) => {
    setSelectedModel(mId);
    setOpenRouterModel(mId);
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    const models = await fetchOpenRouterModels();
    setAvailableModels(models);
    setIsLoadingModels(false);
  };

  const handleUpdateLimit = (updates: Partial<OpenRouterUsageLimits>) => {
    const updated = { ...usageLimits, ...updates };
    setUsageLimitsState(updated);
    setOpenRouterLimits(updated);
  };

  const handleResetUsage = () => {
    if (confirm('Möchtest du den gesamten Token- und Verbrauchs-Zähler wirklich zurücksetzen?')) {
      resetOpenRouterUsageStats();
      setUsageStatsState(getOpenRouterUsageStats());
    }
  };

  const navGroups = [
    {
      title: 'App',
      items: [
        { id: 'general', label: 'Allgemein', icon: Settings },
        { id: 'appearance', label: 'Personalisierung', icon: Palette },
        { id: 'ai', label: 'YES KI', icon: Cpu },
        { id: 'performance', label: 'Tool Performance', icon: Gauge },
        { id: 'shortcuts', label: 'Tastenkürzel', icon: Keyboard },
        { id: 'stats', label: 'Statistiken', icon: BarChart3 }
      ]
    },
    {
      title: 'Tools',
      items: [
        { id: 'html-tools', label: 'HTML Tools', icon: Code2 },
        { id: 'image-tools', label: 'Image Tools', icon: ImageIcon }
      ]
    }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'general':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 text-center">
              <LayoutGrid className="w-12 h-12 mx-auto text-black/20 dark:text-white/20 mb-4" />
              <h4 className="font-medium text-black dark:text-white mb-2">YES Tools Suite</h4>
              <p className="text-sm text-black/60 dark:text-white/60 max-w-sm mx-auto">
                Willkommen in den globalen Einstellungen. Konfiguriere die Umgebung nach deinen Bedürfnissen.
              </p>
            </div>
          </section>
        );
      case 'appearance':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-black dark:text-white text-[15px]">Erscheinungsbild</h4>
                <p className="text-sm text-black/60 dark:text-white/60 mt-0.5">Wechsel zwischen hellem und dunklem Design.</p>
              </div>
              <div className="flex bg-black/10 dark:bg-white/10 rounded-xl p-1 shrink-0 w-full md:w-auto">
                <button 
                  onClick={() => setIsDarkMode(false)}
                  className={`flex-1 md:flex-none flex justify-center p-2 rounded-lg transition-colors ${!isDarkMode ? 'bg-white text-black shadow-sm' : 'text-black/50 dark:text-white/50 hover:bg-white/5'}`}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsDarkMode(true)}
                  className={`flex-1 md:flex-none flex justify-center p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-black text-white shadow-sm' : 'text-black/50 dark:text-white/50 hover:bg-black/5'}`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        );
      case 'ai':
        const filteredModels = availableModels.filter(m => 
          m.id.toLowerCase().includes(modelSearch.toLowerCase()) || 
          m.name.toLowerCase().includes(modelSearch.toLowerCase())
        );

        const activeModelObj = availableModels.find(m => m.id === selectedModel) || {
          id: selectedModel,
          name: selectedModel === 'openrouter/auto' ? '⚡ OpenRouter Auto Router' : selectedModel,
          description: 'Custom oder automatisch ausgewähltes Modell'
        };

        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* OpenRouter API Key Panel */}
            <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-black/5 dark:to-white/5 rounded-2xl p-5 border border-purple-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                      <span>OpenRouter API Key Integration</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                        Cookie &amp; LocalStorage
                      </span>
                    </h4>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Zentraler Schlüssel für alle KI-Features (CoCreator, WYSIWYG Assistant, Prettify &amp; Audits).
                    </p>
                  </div>
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  Key holen <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input 
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-black/15 dark:border-white/15 rounded-xl py-2.5 pl-3.5 pr-20 text-xs font-mono text-black dark:text-white focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                    placeholder="sk-or-v1-..."
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                      title={showKey ? 'Verbergen' : 'Anzeigen'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => testKeyStatus(apiKeyInput)}
                      disabled={isTestingKey || !apiKeyInput.trim()}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold shadow transition-all flex items-center gap-1"
                    >
                      {isTestingKey ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Prüfen'}
                    </button>
                  </div>
                </div>

                {/* Validation Status Badge */}
                {keyAuthInfo && (
                  <div className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
                    keyAuthInfo.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {keyAuthInfo.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span>
                        {keyAuthInfo.valid 
                          ? `✓ Key Gültig (${keyAuthInfo.label || 'Aktiv'}). ${keyAuthInfo.is_free_tier ? 'Free Tier' : 'Guthaben/Limit OK'}` 
                          : keyAuthInfo.error}
                      </span>
                    </div>
                    {keyAuthInfo.usage !== undefined && (
                      <span className="font-mono text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded">
                        Verbrauch: ${keyAuthInfo.usage.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* OpenRouter Model Picker Engine */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 space-y-4 border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <span>OpenRouter Modell Auswahl</span>
                  </h4>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Standardmäßig auf <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">openrouter/auto</code> eingestellt.
                  </p>
                </div>
                <button
                  onClick={loadModels}
                  disabled={isLoadingModels}
                  className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold text-black/80 dark:text-white/80 transition-all flex items-center gap-1.5"
                  title="Modellkatalog von OpenRouter neu laden"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  <span>Katalog Laden</span>
                </button>
              </div>

              {/* Model Search & Dropdown */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Suche Modell (z.B. auto, sonnet, gemini, r1, free)..."
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  {modelSearch && (
                    <button
                      onClick={() => setModelSearch('')}
                      className="px-2 py-2 text-xs font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto custom-scrollbar border border-black/10 dark:border-white/10 rounded-xl divide-y divide-black/5 dark:divide-white/5 bg-white dark:bg-[#1A1A1A]">
                  {filteredModels.length === 0 ? (
                    <div className="p-4 text-center text-xs text-black/50 dark:text-white/50">
                      Keine Modelle gefunden für "{modelSearch}". Du kannst den Modell-Slug oben manuell eingeben.
                    </div>
                  ) : (
                    filteredModels.map(m => {
                      const isSelected = selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleModelSelect(m.id)}
                          className={`w-full p-3 text-left flex items-start justify-between gap-3 transition-colors ${
                            isSelected 
                              ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold' 
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">{m.name}</span>
                              {m.id === 'openrouter/auto' && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white text-[9px] font-mono uppercase font-black">
                                  Default
                                </span>
                              )}
                              {m.isFree && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                                  Free
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-0.5 truncate">
                              {m.id}
                            </p>
                          </div>
                          {m.context_length && (
                            <span className="text-[10px] font-mono text-black/40 dark:text-white/40 shrink-0 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                              {(m.context_length / 1000).toFixed(0)}k ctx
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selected Model Active Details Badge */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      Aktives Modell: {activeModelObj.name}
                    </span>
                    <span className="font-mono text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">
                      {selectedModel}
                    </span>
                  </div>
                  {activeModelObj.description && (
                    <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">
                      {activeModelObj.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Fallback Models Chaining */}
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                  Fallback Modelle (Komma-getrennt)
                </label>
                <input 
                  type="text"
                  value={fallbackModels}
                  onChange={(e) => setFallbackModels(e.target.value)}
                  placeholder="google/gemini-2.0-flash-exp:free,openrouter/free"
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-xs font-mono text-black dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-black/50 dark:text-white/50 mt-1">
                  Werden automatisch der Reihe nach genutzt, falls das Primärmodell ein Rate-Limit erreicht.
                </p>
              </div>

              {/* Temperature & System Prompt */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-3">
                <div>
                  <label className="block font-medium text-xs text-black dark:text-white mb-2">
                    Temperatur ({temperature})
                  </label>
                  <input 
                    type="range" 
                    min="0" max="2" step="0.1" 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-black/50 dark:text-white/50 mt-1 font-medium">
                    <span>Präzise (0)</span>
                    <span>Kreativ (2)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-xs text-black dark:text-white mb-1">
                    System Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-xs text-black dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

            {/* Usage Limits & Budget Control Section */}
            <div className="bg-gradient-to-br from-[#121215] to-[#1a1a22] text-white rounded-2xl p-5 border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Usage Limits &amp; Budget Control</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Kosten-Schutz
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Vermeide unerwartete API-Kosten durch automatische Soft-/Hard Token &amp; Budget-Limits.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all">
                  <span className="text-xs font-bold text-slate-300">Limits Erzwingen</span>
                  <input
                    type="checkbox"
                    checked={usageLimits.enforceLimits}
                    onChange={(e) => handleUpdateLimit({ enforceLimits: e.target.checked })}
                    className="accent-purple-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Tokens Progress Bar */}
                <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Token Verbrauch</span>
                    <span className="font-mono font-bold text-purple-300">
                      {usageStats.totalTokens.toLocaleString('de-DE')} / {usageLimits.hardTokenLimit.toLocaleString('de-DE')}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        usageStats.totalTokens >= usageLimits.hardTokenLimit
                          ? 'bg-red-500'
                          : usageStats.totalTokens >= usageLimits.softTokenLimit
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (usageStats.totalTokens / (usageLimits.hardTokenLimit || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Soft Warnung: {usageLimits.softTokenLimit.toLocaleString('de-DE')}</span>
                    <span>Hard Stop: {usageLimits.hardTokenLimit.toLocaleString('de-DE')}</span>
                  </div>
                </div>

                {/* Cost Progress Bar */}
                <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Geschätzte Kosten ($)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${usageStats.estimatedCost.toFixed(3)} / Max ${usageLimits.hardCostLimit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        usageStats.estimatedCost >= usageLimits.hardCostLimit
                          ? 'bg-red-500'
                          : usageStats.estimatedCost >= usageLimits.softCostLimit
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{
                        width: `${Math.min(100, (usageStats.estimatedCost / (usageLimits.hardCostLimit || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Soft Warnung: ${usageLimits.softCostLimit.toFixed(2)}</span>
                    <span>Hard Stop: ${usageLimits.hardCostLimit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Editable Limit Inputs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Soft Token Limit
                  </label>
                  <input
                    type="number"
                    value={usageLimits.softTokenLimit}
                    onChange={(e) => handleUpdateLimit({ softTokenLimit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Hard Token Limit
                  </label>
                  <input
                    type="number"
                    value={usageLimits.hardTokenLimit}
                    onChange={(e) => handleUpdateLimit({ hardTokenLimit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Soft Cost Limit ($)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={usageLimits.softCostLimit}
                    onChange={(e) => handleUpdateLimit({ softCostLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Hard Cost Limit ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={usageLimits.hardCostLimit}
                    onChange={(e) => handleUpdateLimit({ hardCostLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Max Tokens Per Request Slider & Reset Counters */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
                <div className="w-full md:w-2/3 space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>Max. Output Tokens pro Anfrage</span>
                    <span className="font-mono text-purple-400 font-bold">{usageLimits.maxTokensPerRequest} Tokens</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="16384"
                    step="512"
                    value={usageLimits.maxTokensPerRequest}
                    onChange={(e) => handleUpdateLimit({ maxTokensPerRequest: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetUsage}
                  className="w-full md:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Zähler Zurücksetzen
                </button>
              </div>
            </div>
            </div>
          </section>
        );
      case 'performance': {
        const latHistory = getOpenRouterLatencyHistory();
        const validLatencies = latHistory.filter((l) => l.durationMs > 0);
        const avgLat = validLatencies.length
          ? Math.round(validLatencies.reduce((acc, curr) => acc + curr.durationMs, 0) / validLatencies.length)
          : 0;
        const minLat = validLatencies.length
          ? Math.min(...validLatencies.map((l) => l.durationMs))
          : 0;
        const maxLat = validLatencies.length
          ? Math.max(...validLatencies.map((l) => l.durationMs))
          : 0;
        const errRate = latHistory.length
          ? Math.round((latHistory.filter((l) => l.status === 'error').length / latHistory.length) * 100)
          : 0;

        // LocalStorage Memory Usage
        let lsTotalBytes = 0;
        const lsItems: { key: string; bytes: number; kb: number }[] = [];
        if (typeof window !== 'undefined') {
          try {
            for (let i = 0; i < window.localStorage.length; i++) {
              const k = window.localStorage.key(i);
              if (k) {
                const val = window.localStorage.getItem(k) || '';
                const b = (k.length + val.length) * 2;
                lsTotalBytes += b;
                lsItems.push({ key: k, bytes: b, kb: parseFloat((b / 1024).toFixed(1)) });
              }
            }
          } catch (_) {}
        }
        lsItems.sort((a, b) => b.bytes - a.bytes);
        const totalKb = (lsTotalBytes / 1024).toFixed(1);
        const maxStorageKb = 5120; // 5 MB typical limit
        const storagePercent = Math.min(100, (parseFloat(totalKb) / maxStorageKb) * 100);

        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-black dark:text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-purple-500" />
                  Tool Performance &amp; System Analytics
                </h3>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Echtzeit-Latenzmessung für OpenRouter API Anfragen &amp; LocalStorage Speicher-Analyse.
                </p>
              </div>

              <button
                onClick={() => {
                  clearOpenRouterLatencyHistory();
                  setUsageStatsState(getOpenRouterUsageStats());
                }}
                className="px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white rounded-xl text-xs font-bold transition-all border border-black/10 dark:border-white/10 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Latenz-Logs Leeren
              </button>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Ø Latenz (Anfragen)
                </span>
                <p className="text-xl font-mono font-extrabold text-black dark:text-white">
                  {avgLat > 0 ? `${avgLat} ms` : '—'}
                </p>
                <p className="text-[10px] text-black/50 dark:text-white/50">
                  Min: {minLat}ms | Max: {maxLat}ms
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Erfolgsquote
                </span>
                <p className="text-xl font-mono font-extrabold text-black dark:text-white">
                  {100 - errRate}%
                </p>
                <p className="text-[10px] text-black/50 dark:text-white/50">
                  {latHistory.length} Messungen protokolliert
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-300 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> LocalStorage
                </span>
                <p className="text-xl font-mono font-extrabold text-black dark:text-white">
                  {totalKb} KB
                </p>
                <p className="text-[10px] text-black/50 dark:text-white/50">
                  {storagePercent.toFixed(1)}% von ~5MB belegt
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Gespeicherte Keys
                </span>
                <p className="text-xl font-mono font-extrabold text-black dark:text-white">
                  {lsItems.length} Keys
                </p>
                <p className="text-[10px] text-black/50 dark:text-white/50">
                  Lokaler Browser-Cache
                </p>
              </div>
            </div>

            {/* OpenRouter Latency Log Visualizer */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-black dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  OpenRouter API Request Latency Timeline
                </h4>
                <span className="text-[10px] font-mono text-black/50 dark:text-white/50">
                  Letzte {latHistory.length} Anfragen
                </span>
              </div>

              {latHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-black/50 dark:text-white/50">
                  Noch keine API-Anfragen im Latenz-Protokoll gespeichert.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {latHistory.map((rec) => {
                    const durationRatio = Math.min(100, (rec.durationMs / (maxLat || 1)) * 100);
                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                rec.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="font-mono font-bold text-black dark:text-white">
                              {rec.model}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                              {rec.durationMs} ms
                            </span>
                            <span className="text-[10px] text-black/40 dark:text-white/40">
                              {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              rec.status === 'error'
                                ? 'bg-red-500'
                                : rec.durationMs > 3000
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.max(5, durationRatio)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LocalStorage Memory Usage Breakdown */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-black dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  LocalStorage Speicherbelegung
                </h4>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300">
                  {totalKb} KB ({storagePercent.toFixed(1)}%)
                </span>
              </div>

              <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {lsItems.slice(0, 10).map((item) => (
                  <div
                    key={item.key}
                    className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-[11px] text-black/80 dark:text-white/80 truncate max-w-[220px]">
                      {item.key}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-300">
                      {item.kb} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }
      case 'shortcuts':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black dark:text-white">Globale Suche</span>
                <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-xs font-mono text-black/70 dark:text-white/70">Strg + K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black dark:text-white">Einstellungen öffnen</span>
                <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-xs font-mono text-black/70 dark:text-white/70">Strg + ,</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black dark:text-white">YES KI Chat</span>
                <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-xs font-mono text-black/70 dark:text-white/70">Strg + J</kbd>
              </div>
            </div>
          </section>
        );
      case 'stats':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-black/60 dark:text-white/60 mb-6">
              Hier siehst du, welche Tools du am häufigsten benutzt hast.
            </p>
            <ToolUsageDashboard />
          </section>
        );
      case 'html-tools':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5">
               <h4 className="font-medium text-black dark:text-white mb-4">Standard-Modus</h4>
               <select 
                 value={htmlDefaultMode}
                 onChange={(e) => setHtmlDefaultMode(e.target.value)}
                 className="w-full bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white focus:outline-none"
               >
                 <option value="CONTENT_ONLY">Smart (HTML-Tags beibehalten)</option>
                 <option value="FULL">Full (Alles escapen)</option>
               </select>
            </div>
          </section>
        );
      case 'image-tools':
        return (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5">
               <h4 className="font-medium text-black dark:text-white mb-2">Standard Qualität ({imageDefaultQuality}%)</h4>
               <input 
                  type="range" 
                  min="1" max="100" step="1" 
                  value={imageDefaultQuality} 
                  onChange={(e) => setImageDefaultQuality(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const getTabLabel = (id: string) => {
    for (const group of navGroups) {
      const found = group.items.find(i => i.id === id);
      if (found) return found.label;
    }
    return '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm sm:backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:w-[90vw] max-w-[1100px] h-[90vh] sm:h-[85vh] bg-white dark:bg-[#111111] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-black/5 dark:border-white/5"
          >
            {/* Sidebar */}
            <div className="md:w-[260px] lg:w-[280px] bg-[#F9F9F9] dark:bg-[#1A1A1A] border-r border-black/5 dark:border-white/5 flex flex-col shrink-0">
              <div className="flex items-center justify-between px-6 py-6 border-b md:border-b-0 border-black/5 dark:border-white/5">
                <h2 className="text-xl font-bold text-black dark:text-white">Einstellungen</h2>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors md:hidden">
                  <X className="w-5 h-5 text-black/50 dark:text-white/50" />
                </button>
              </div>

              <div className="flex overflow-x-auto md:flex-col md:overflow-y-auto px-4 pb-6 gap-6 custom-scrollbar h-full">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="flex flex-col gap-1 shrink-0">
                    <h3 className="hidden md:block text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider px-3 mb-1">{group.title}</h3>
                    <div className="flex md:flex-col gap-1">
                      {group.items.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabKey)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all whitespace-nowrap ${
                              isActive 
                                ? 'bg-white dark:bg-[#2A2A2A] text-black dark:text-white shadow-sm border border-black/5 dark:border-white/5' 
                                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white border border-transparent'
                            }`}
                          >
                            <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-black/40 dark:text-white/40'}`} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111111] relative">
              <div className="absolute top-4 right-4 hidden md:block">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-black/50 dark:text-white/50" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:px-12 md:py-10">
                <div className="max-w-2xl">
                  <div className="mb-8">
                     <h1 className="text-2xl font-bold text-black dark:text-white">
                        {getTabLabel(activeTab)}
                     </h1>
                  </div>
                  {renderContent()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
