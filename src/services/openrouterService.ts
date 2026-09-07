// OpenRouter Central Integration Service
// Serves as the universal AI provider across all YES XLPM Studio modules

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  context_length?: number;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  isFree?: boolean;
}

export interface OpenRouterKeyAuthInfo {
  valid: boolean;
  label?: string;
  usage?: number;
  limit?: number | null;
  is_free_tier?: boolean;
  rate_limit?: {
    requests: number;
    interval: string;
  };
  error?: string;
}

// Cookie Helper Functions
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

// OpenRouter Settings Accessors with Dual-Storage (LocalStorage + Cookies)
export const getOpenRouterApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  
  // 1. Check Cookie
  const cookieKey = getCookie('openrouter_api_key');
  if (cookieKey && cookieKey.trim()) {
    // Sync to localStorage
    try { window.localStorage.setItem('openrouter-api-key', JSON.stringify(cookieKey)); } catch (_) {}
    return cookieKey.trim();
  }

  // 2. Check LocalStorage
  try {
    const lsItem = window.localStorage.getItem('openrouter-api-key');
    if (lsItem) {
      let parsed = lsItem;
      try { parsed = JSON.parse(lsItem); } catch (_) {}
      if (typeof parsed === 'string' && parsed.trim()) {
        // Sync to cookie
        setCookie('openrouter_api_key', parsed.trim());
        return parsed.trim();
      }
    }
  } catch (_) {}

  // 3. Fallback to Environment Variable
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  return envKey ? envKey.trim() : '';
};

export const setOpenRouterApiKey = (key: string) => {
  const trimmedKey = key.trim();
  if (typeof window !== 'undefined') {
    try {
      if (trimmedKey) {
        window.localStorage.setItem('openrouter-api-key', JSON.stringify(trimmedKey));
        setCookie('openrouter_api_key', trimmedKey);
      } else {
        window.localStorage.removeItem('openrouter-api-key');
        deleteCookie('openrouter_api_key');
      }
    } catch (err) {
      console.error('Error persisting OpenRouter API key:', err);
    }
  }
};

export const getOpenRouterModel = (): string => {
  const DEFAULT_MODEL = 'openrouter/auto';
  if (typeof window === 'undefined') return DEFAULT_MODEL;

  const cookieModel = getCookie('openrouter_selected_model');
  if (cookieModel && cookieModel.trim()) return cookieModel.trim();

  try {
    const lsItem = window.localStorage.getItem('cocreator-model') || window.localStorage.getItem('yes-ai-assistant-model');
    if (lsItem) {
      let parsed = lsItem;
      try { parsed = JSON.parse(lsItem); } catch (_) {}
      if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
    }
  } catch (_) {}

  return DEFAULT_MODEL;
};

export const setOpenRouterModel = (model: string) => {
  const trimmed = model.trim() || 'openrouter/auto';
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('cocreator-model', JSON.stringify(trimmed));
      window.localStorage.setItem('yes-ai-assistant-model', JSON.stringify(trimmed));
      setCookie('openrouter_selected_model', trimmed);
    } catch (err) {
      console.error('Error persisting OpenRouter model selection:', err);
    }
  }
};

// Curated Fallback Model List
export const POPULAR_OPENROUTER_MODELS: OpenRouterModelInfo[] = [
  {
    id: 'openrouter/auto',
    name: '⚡ OpenRouter Auto (Standard & Empfohlen)',
    description: 'Routet Anfragen automatisch zum besten verfügbaren Provider mit optimalem Preis-/Leistungsverhältnis.',
    isFree: false
  },
  {
    id: 'openrouter/free',
    name: '🆓 OpenRouter Free Router',
    description: 'Nutzt ausschließlich kostenfreie OpenRouter KI-Modelle ohne Guthaben-Verbrauch.',
    isFree: true
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: '🧠 Anthropic Claude 3.7 Sonnet',
    description: 'Neuestes hybrides Reasoning-Modell für exzellenten Code, Architektur & komplexe Logik.',
    context_length: 200000
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: '🎨 Anthropic Claude 3.5 Sonnet',
    description: 'Goldstandard für präzisen HTML, CSS, Email & Frontend Code.',
    context_length: 200000
  },
  {
    id: 'openai/gpt-4o',
    name: '🚀 OpenAI GPT-4o',
    description: 'Schnelles, intelligentes Allround-Modell für Text-, Bild- & Codeanalyse.',
    context_length: 128000
  },
  {
    id: 'openai/gpt-4o-mini',
    name: '⚡ OpenAI GPT-4o-mini',
    description: 'Sehr günstiges & blitzschnelles Modell für Alltagsaufgaben.',
    context_length: 128000
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: '✨ Google Gemini 2.0 Flash',
    description: 'Next-Gen Gemini 2.0 Modell mit riesigem Kontextfenster & minimaler Latenz.',
    context_length: 1048576
  },
  {
    id: 'google/gemini-2.0-pro-exp-02-05:free',
    name: '💎 Google Gemini 2.0 Pro (Free)',
    description: 'Leistungsstarkes experimentelles Pro-Modell kostenfrei über OpenRouter.',
    isFree: true,
    context_length: 2000000
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: '⚡ Google Gemini 2.0 Flash (Free)',
    description: 'Schnelles Gemini 2.0 Flash Modell kostenfrei über OpenRouter.',
    isFree: true,
    context_length: 1048576
  },
  {
    id: 'deepseek/deepseek-r1',
    name: '🧪 DeepSeek R1 (Reasoning)',
    description: 'Spezialisiertes Open-Source Denkmodell für tiefgehende Code-Refactorings.',
    context_length: 128000
  },
  {
    id: 'deepseek/deepseek-chat',
    name: '🤖 DeepSeek V3 (Chat)',
    description: 'Hervorragendes Preis-Leistungs-Verhältnis für allgemeine Programmierung.',
    context_length: 64000
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: '🦙 Meta Llama 3.3 70B Instruct',
    description: 'Erstklassiges Open-Source Modell von Meta mit 70 Milliarden Parametern.',
    context_length: 128000
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: '💻 Qwen 2.5 Coder 32B Instruct',
    description: 'Spezifisch auf Software-Entwicklung & HTML-Synthese trainiertes Modell.',
    context_length: 32768
  }
];

// Live Key Verification
export const verifyOpenRouterKey = async (apiKey?: string): Promise<OpenRouterKeyAuthInfo> => {
  const keyToTest = apiKey !== undefined ? apiKey.trim() : getOpenRouterApiKey();
  if (!keyToTest) {
    return { valid: false, error: 'Kein OpenRouter API Key angegeben.' };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${keyToTest}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { valid: false, error: 'Ungültiger OpenRouter API Key (401 Unauthorized).' };
      }
      return { valid: false, error: `OpenRouter Key-Prüfung fehlgeschlagen (HTTP Status ${res.status}).` };
    }

    const data = await res.json();
    return {
      valid: true,
      label: data.data?.label || 'Aktiviert',
      usage: data.data?.usage || 0,
      limit: data.data?.limit ?? null,
      is_free_tier: data.data?.is_free_tier ?? false,
      rate_limit: data.data?.rate_limit
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Netzwerkfehler bei der Key-Verifizierung.' };
  }
};

// Fetch Live Models List from OpenRouter
export const fetchOpenRouterModels = async (): Promise<OpenRouterModelInfo[]> => {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) return POPULAR_OPENROUTER_MODELS;

    const body = await res.json();
    if (!body.data || !Array.isArray(body.data)) return POPULAR_OPENROUTER_MODELS;

    const fetchedModels: OpenRouterModelInfo[] = body.data.map((m: any) => ({
      id: m.id,
      name: m.name || m.id,
      context_length: m.context_length,
      description: m.description,
      pricing: m.pricing ? {
        prompt: m.pricing.prompt,
        completion: m.pricing.completion
      } : undefined,
      isFree: m.id.endsWith(':free') || m.pricing?.prompt === '0'
    }));

    // Put openrouter/auto at top if present or prepend
    const hasAuto = fetchedModels.some(m => m.id === 'openrouter/auto');
    if (!hasAuto) {
      fetchedModels.unshift(POPULAR_OPENROUTER_MODELS[0]);
    } else {
      // Move auto to front
      const autoIdx = fetchedModels.findIndex(m => m.id === 'openrouter/auto');
      const [autoObj] = fetchedModels.splice(autoIdx, 1);
      fetchedModels.unshift(autoObj);
    }

    return fetchedModels;
  } catch (err) {
    console.warn('Fallback to popular models due to network issue:', err);
    return POPULAR_OPENROUTER_MODELS;
  }
};

// Universal Chat Completion Function with Usage Limits & Budget Control
export interface OpenRouterUsageLimits {
  enforceLimits: boolean;
  softTokenLimit: number;
  hardTokenLimit: number;
  softCostLimit: number;
  hardCostLimit: number;
  maxTokensPerRequest: number;
}

export interface OpenRouterUsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestCount: number;
  lastRequestAt?: string;
}

export const DEFAULT_USAGE_LIMITS: OpenRouterUsageLimits = {
  enforceLimits: true,
  softTokenLimit: 100000,
  hardTokenLimit: 500000,
  softCostLimit: 2.00,
  hardCostLimit: 10.00,
  maxTokensPerRequest: 4096
};

export const getOpenRouterLimits = (): OpenRouterUsageLimits => {
  if (typeof window === 'undefined') return DEFAULT_USAGE_LIMITS;
  try {
    const raw = window.localStorage.getItem('openrouter_usage_limits');
    if (raw) return { ...DEFAULT_USAGE_LIMITS, ...JSON.parse(raw) };
  } catch (_) {}
  return DEFAULT_USAGE_LIMITS;
};

export const setOpenRouterLimits = (limits: Partial<OpenRouterUsageLimits>) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getOpenRouterLimits();
    const updated = { ...current, ...limits };
    window.localStorage.setItem('openrouter_usage_limits', JSON.stringify(updated));
    setCookie('openrouter_limits_ver', Date.now().toString());
  } catch (e) {
    console.error('Failed to save OpenRouter limits:', e);
  }
};

export const getOpenRouterUsageStats = (): OpenRouterUsageStats => {
  const emptyStats: OpenRouterUsageStats = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    requestCount: 0
  };
  if (typeof window === 'undefined') return emptyStats;
  try {
    const raw = window.localStorage.getItem('openrouter_usage_stats');
    if (raw) return { ...emptyStats, ...JSON.parse(raw) };
  } catch (_) {}
  return emptyStats;
};

export interface LatencyRecord {
  id: string;
  timestamp: string;
  durationMs: number;
  model: string;
  status: 'success' | 'error';
  promptTokens?: number;
  completionTokens?: number;
}

export const getOpenRouterLatencyHistory = (): LatencyRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('openrouter_latency_history');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
};

export const recordOpenRouterLatency = (record: Omit<LatencyRecord, 'id' | 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  try {
    const history = getOpenRouterLatencyHistory();
    const newEntry: LatencyRecord = {
      ...record,
      id: 'lat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString()
    };
    // Keep last 30 requests
    const updated = [newEntry, ...history].slice(0, 30);
    window.localStorage.setItem('openrouter_latency_history', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record OpenRouter latency:', err);
  }
};

export const clearOpenRouterLatencyHistory = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('openrouter_latency_history');
  } catch (_) {}
};

export const recordOpenRouterUsage = (promptTok: number, compTok: number, costEstimate?: number) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getOpenRouterUsageStats();
    const p = promptTok || 0;
    const c = compTok || 0;
    const total = p + c;
    const estCost = costEstimate !== undefined ? costEstimate : (total * 0.0000025);

    const updated: OpenRouterUsageStats = {
      promptTokens: current.promptTokens + p,
      completionTokens: current.completionTokens + c,
      totalTokens: current.totalTokens + total,
      estimatedCost: current.estimatedCost + estCost,
      requestCount: current.requestCount + 1,
      lastRequestAt: new Date().toISOString()
    };
    window.localStorage.setItem('openrouter_usage_stats', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record OpenRouter usage stats:', err);
  }
};

export const resetOpenRouterUsageStats = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('openrouter_usage_stats');
  } catch (_) {}
};

export const callOpenRouterChat = async (options: {
  messages: Array<{ role: string; content: string; name?: string; tool_calls?: any[]; tool_call_id?: string }>;
  model?: string;
  temperature?: number;
  tools?: any[];
  apiKey?: string;
  fallbackModels?: string[];
  maxTokens?: number;
}) => {
  const apiKey = options.apiKey || getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('Kein OpenRouter API Key vorhanden. Bitte speichere deinen API Key in den Einstellungen.');
  }

  // Check Usage Limits Enforcement
  const limits = getOpenRouterLimits();
  const stats = getOpenRouterUsageStats();

  if (limits.enforceLimits) {
    if (stats.totalTokens >= limits.hardTokenLimit) {
      throw new Error(`🚫 Hard Token-Limit erreicht! Du hast ${stats.totalTokens.toLocaleString('de-DE')} / ${limits.hardTokenLimit.toLocaleString('de-DE')} Tokens verbraucht. Bitte erhöhe das Hard-Limit in den KI-Einstellungen oder setze den Zähler zurück.`);
    }
    if (stats.estimatedCost >= limits.hardCostLimit) {
      throw new Error(`🚫 Hard Kosten-Limit erreicht! Geschätzter Verbrauch: $${stats.estimatedCost.toFixed(3)} / Max $${limits.hardCostLimit.toFixed(2)}. Bitte passe das Budget-Limit in den KI-Einstellungen an.`);
    }
  }

  const selectedModel = options.model || getOpenRouterModel() || 'openrouter/auto';
  const fallbacks = options.fallbackModels || [];
  const allModels = [selectedModel, ...fallbacks.map(f => f.trim()).filter(Boolean)];

  const payload: any = {
    messages: options.messages,
    temperature: options.temperature ?? 0.7
  };

  const reqMaxTokens = options.maxTokens || limits.maxTokensPerRequest;
  if (reqMaxTokens && reqMaxTokens > 0) {
    payload.max_tokens = reqMaxTokens;
  }

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
  }

  if (allModels.length > 1) {
    payload.models = allModels;
  } else {
    payload.model = selectedModel;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ai.studio',
    'X-Title': 'YES XLPM Studio AI Engine',
    'Content-Type': 'application/json'
  };

  const startTime = performance.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      recordOpenRouterLatency({
        durationMs,
        model: selectedModel,
        status: 'error'
      });

      if (response.status === 401) {
        throw new Error('401 Unauthorized: Dein OpenRouter API Key ist ungültig oder abgelaufen.');
      }
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenRouter API Fehler (Status Code: ${response.status})`);
    }

    const resJson = await response.json();

    const promptTokens = resJson?.usage?.prompt_tokens || 0;
    const completionTokens = resJson?.usage?.completion_tokens || 0;

    // Record latency metrics
    recordOpenRouterLatency({
      durationMs,
      model: selectedModel,
      status: 'success',
      promptTokens,
      completionTokens
    });

    // Record usage metrics
    if (resJson && resJson.usage) {
      recordOpenRouterUsage(promptTokens, completionTokens);
    }

    return resJson;
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    recordOpenRouterLatency({
      durationMs,
      model: selectedModel,
      status: 'error'
    });
    throw err;
  }
};
