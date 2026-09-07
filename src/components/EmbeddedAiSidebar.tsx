import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Code2,
  Copy,
  Check,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
  FileCode,
  Tag,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Bookmark,
  Layers,
  Wand2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  History,
  Download,
  MessageSquare,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  getOpenRouterApiKey,
  getOpenRouterModel,
  getOpenRouterLimits,
  getOpenRouterUsageStats
} from '../services/openrouterService';
import { useCrossToolStore, SharedSnippet, SharedTemplate } from '../store/crossToolStore';
import { runAgentTurn } from '../lib/ai/agent';
import { buildSystemPrompt } from '../lib/ai/systemPrompt';
import { ToolCallBubble } from './ui/ToolCallBubble';
import type { ToolCallDisplay } from '../lib/ai/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolContext?: string;
  hasCode?: boolean;
  toolCalls?: ToolCallDisplay[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  toolName?: string;
}

const STORAGE_CHAT_SESSIONS_KEY = 'yes_ai_chat_sessions_v1';

interface EmbeddedAiSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  hideFloatingButton?: boolean;
}

export const EmbeddedAiSidebar: React.FC<EmbeddedAiSidebarProps> = ({
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  hideFloatingButton = false
}) => {
  const location = useLocation();
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    if (typeof open === 'function') {
      const nextVal = open(isOpen);
      if (externalSetIsOpen) externalSetIsOpen(nextVal);
      else setInternalIsOpen(nextVal);
    } else {
      if (externalSetIsOpen) externalSetIsOpen(open);
      else setInternalIsOpen(open);
    }
  };
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'crosstool'>('chat');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [includeCodeContext, setIncludeCodeContext] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [injectedId, setInjectedId] = useState<string | null>(null);

  // Chat Sessions Storage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_CHAT_SESSIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return 'session-' + Date.now();
  });

  // Cross Tool Store State
  const {
    activeToolContext,
    snippets,
    templates,
    metadataTags,
    addSnippet,
    removeSnippet,
    setMetadataTag,
    removeMetadataTag,
    injectCodeToActiveTool
  } = useCrossToolStore();

  // Chat History Messages for active session
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Hallo! Ich bin dein eingebetteter YES OpenRouter KI-Assistent. Ich kenne deinen aktuellen Projekt-Kontext und kann Code generieren, Fehler erklären oder Snippets direkt in deine Werkzeuge injizieren.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Save current chat session whenever messages update
  useEffect(() => {
    if (messages.length <= 1 && messages[0]?.id === 'welcome-msg') return;

    setSessions((prevSessions) => {
      const firstUserMsg = messages.find((m) => m.role === 'user')?.content || 'Neuer Chat';
      const title = firstUserMsg.length > 35 ? firstUserMsg.slice(0, 35) + '...' : firstUserMsg;

      const updatedSession: ChatSession = {
        id: currentSessionId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages,
        toolName: activeToolContext?.toolName || 'Studio'
      };

      const existingIndex = prevSessions.findIndex((s) => s.id === currentSessionId);
      let next: ChatSession[];
      if (existingIndex >= 0) {
        next = [...prevSessions];
        next[existingIndex] = updatedSession;
      } else {
        next = [updatedSession, ...prevSessions];
      }

      try {
        window.localStorage.setItem(STORAGE_CHAT_SESSIONS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chat sessions:', e);
      }
      return next;
    });
  }, [messages, currentSessionId, activeToolContext?.toolName]);

  // BACKGROUND OBSERVER: Automatically maps active metadata tags & template tags from CrossToolStore
  useEffect(() => {
    if (!templates || templates.length === 0) return;
    
    // Extract unique tags and template titles from active templates
    const autoTags: Record<string, string> = {};
    templates.slice(0, 5).forEach((tpl, idx) => {
      autoTags[`active_template_${idx + 1}`] = `${tpl.title} [${tpl.category}] (${tpl.tags.join(', ')})`;
    });

    if (Object.keys(autoTags).length > 0) {
      Object.entries(autoTags).forEach(([k, v]) => {
        if (!metadataTags[k]) {
          setMetadataTag(k, v);
        }
      });
    }
  }, [templates, metadataTags, setMetadataTag]);

  // Usage Limits Banner Check
  const limits = getOpenRouterLimits();
  const usageStats = getOpenRouterUsageStats();
  const isSoftLimitReached =
    limits.enforceLimits &&
    (usageStats.totalTokens >= limits.softTokenLimit * 0.8 ||
      usageStats.estimatedCost >= limits.softCostLimit * 0.8);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeModel = getOpenRouterModel();
  const currentRouteName = location.pathname === '/' ? 'Home Dashboard' : location.pathname.replace('/', '').toUpperCase();

  const handleStartNewChat = () => {
    const newId = 'session-' + Date.now();
    setCurrentSessionId(newId);
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        role: 'assistant',
        content: 'Neuer Chat gestartet! Wie kann ich dir im aktuellen Werkzeug helfen?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveTab('chat');
  };

  const handleLoadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setActiveTab('chat');
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    try {
      window.localStorage.setItem(STORAGE_CHAT_SESSIONS_KEY, JSON.stringify(filtered));
    } catch (_) {}

    if (sessionId === currentSessionId) {
      handleStartNewChat();
    }
  };

  const handleExportChatJson = (sessionToExport?: ChatSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const session = sessionToExport || sessions.find((s) => s.id === currentSessionId) || {
      id: currentSessionId,
      title: 'Active Chat Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages,
      toolName: activeToolContext?.toolName || 'Studio'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chat-log-${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || inputMessage).trim();
    if (!msgText || isLoading) return;

    const userMsgId = 'usr-' + Date.now();
    const userMessageObj: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolContext: activeToolContext ? `${activeToolContext.toolName} (${activeToolContext.activeFileName || 'Buffer'})` : undefined
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        throw new Error('Kein OpenRouter API Key hinterlegt. Bitte trage deinen Key in den KI-Einstellungen ein.');
      }

      // System-Prompt inkl. Tool-Beschreibungen + optionalem Code-Kontext
      // (siehe src/lib/ai/systemPrompt.ts für die Best-Practice-Begründung).
      const systemPrompt = buildSystemPrompt({
        activeToolName: activeToolContext?.toolName || currentRouteName,
        activeFileName: activeToolContext?.activeFileName,
        activeCode: includeCodeContext ? activeToolContext?.activeCode : undefined,
        language: activeToolContext?.language,
        metadataTags,
      });

      const formattedApiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: msgText }
      ];

      // Platzhalter-Nachricht, die Tool-Aufrufe live aktualisiert, während der
      // Agent-Loop läuft (siehe onToolCall unten) — der Nutzer sieht so in
      // Echtzeit, welches Werkzeug die KI gerade benutzt.
      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolCalls: [],
        },
      ]);

      const updateToolCall = (call: ToolCallDisplay) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== aiMsgId) return m;
            const existing = m.toolCalls || [];
            const idx = existing.findIndex((c) => c.id === call.id);
            const nextCalls = idx >= 0
              ? existing.map((c, i) => (i === idx ? call : c))
              : [...existing, call];
            return { ...m, toolCalls: nextCalls };
          })
        );
      };

      const { finalMessage } = await runAgentTurn({
        messages: formattedApiMessages,
        model: activeModel,
        ctx: {
          getActiveCode: () => activeToolContext?.activeCode || '',
          setActiveCode: (code) => injectCodeToActiveTool(code),
          activeToolName: activeToolContext?.toolName || currentRouteName,
        },
        onToolCall: updateToolCall,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: finalMessage || 'Keine Antwort erhalten.', hasCode: finalMessage.includes('```') }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `❌ **Fehler:** ${err.message || 'Unbekannter API Fehler.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInjectCode = (code: string, id: string) => {
    injectCodeToActiveTool(code);
    setInjectedId(id);
    setTimeout(() => setInjectedId(null), 2000);
  };

  const handleSaveAsSnippet = (code: string) => {
    const name = prompt('Name für das neue Snippet eingeben:', 'KI Snippet ' + new Date().toLocaleDateString());
    if (name) {
      addSnippet({
        name,
        code,
        type: 'html',
        tags: ['ki', activeToolContext?.toolName?.toLowerCase() || 'general'],
        sourceTool: activeToolContext?.toolName || 'AI Sidebar'
      });
      alert('✓ Snippet im Cross-Tool Store gespeichert!');
    }
  };

  // Helper to extract code blocks from markdown
  const extractCodeBlocks = (text: string) => {
    const regex = /```(?:[a-z]+)?\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push(match[1].trim());
    }
    return blocks;
  };

  return (
    <>
      {/* Floating Toggle Button on Right Edge */}
      {!isOpen && !hideFloatingButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-[10px] top-1/2 -translate-y-1/2 z-[2500] group flex items-center gap-2 pl-3 pr-2.5 py-3 rounded-l-2xl bg-gradient-to-l from-purple-600 via-indigo-600 to-blue-600 text-white shadow-2xl hover:pr-4 transition-all duration-300 hover:scale-105"
          title="YES AI Sidebar öffnen (Strg+Umschalt+A)"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-purple-900" />
          </div>
          <span className="text-xs font-black tracking-wide uppercase hidden sm:inline-block">
            YES AI
          </span>
          <ChevronLeft className="w-4 h-4 text-white/80 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Slide-over Right Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-[10px] top-[34px] bottom-[10px] z-[2500] w-full sm:w-[420px] max-w-[calc(100vw-20px)] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-2xl border-l border-t border-b border-black/15 dark:border-white/15 rounded-l-2xl shadow-2xl flex flex-col font-sans overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                      <span>YES AI Assistant</span>
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300">
                        OpenRouter
                      </span>
                    </h3>
                    <p className="text-[11px] text-black/60 dark:text-white/60 truncate max-w-[220px]">
                      Modell: <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeModel}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60 transition-all"
                    title="Sidebar Schließen (Strg+Umschalt+A)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Tool Context Pill */}
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="font-bold text-black dark:text-white truncate">
                    {activeToolContext ? activeToolContext.toolName : currentRouteName}
                  </span>
                  {activeToolContext?.activeCode && (
                    <span className="text-[10px] font-mono text-black/50 dark:text-white/50 shrink-0">
                      ({(activeToolContext.activeCode.length / 1024).toFixed(1)} kB)
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-purple-600 dark:text-purple-300 shrink-0">
                  <input
                    type="checkbox"
                    checked={includeCodeContext}
                    onChange={(e) => setIncludeCodeContext(e.target.checked)}
                    className="rounded accent-purple-600 text-xs"
                  />
                  <span>Code mitsenden</span>
                </label>
              </div>

              {/* Soft Limit Warning Banner */}
              {isSoftLimitReached && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Achtung: Du hast 80%+ deines festgelegten OpenRouter Token-/Kosten-Limits erreicht.
                  </span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 gap-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'bg-white dark:bg-[#252528] text-purple-600 dark:text-purple-300 shadow-sm'
                      : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Chat
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-[#252528] text-purple-600 dark:text-purple-300 shadow-sm'
                      : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Verlauf
                  {sessions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[9px]">
                      {sessions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('crosstool')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'crosstool'
                      ? 'bg-white dark:bg-[#252528] text-purple-600 dark:text-purple-300 shadow-sm'
                      : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Hub
                  {snippets.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[9px]">
                      {snippets.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                  {messages.map((m) => {
                    const isUser = m.role === 'user';
                    const codeBlocks = !isUser ? extractCodeBlocks(m.content) : [];

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center gap-2 text-[10px] text-black/40 dark:text-white/40">
                          <span>{isUser ? 'Du' : 'YES KI Assistant'}</span>
                          <span>•</span>
                          <span>{m.timestamp}</span>
                          {m.toolContext && <span className="font-mono">({m.toolContext})</span>}
                        </div>

                        {!isUser && m.toolCalls && m.toolCalls.length > 0 && (
                          <div className="w-full max-w-[90%] space-y-0.5">
                            {m.toolCalls.map((call) => (
                              <ToolCallBubble key={call.id} call={call} />
                            ))}
                          </div>
                        )}

                        {(isUser || m.content) && (
                          <div
                            className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                                : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white rounded-bl-none whitespace-pre-wrap font-sans'
                            }`}
                          >
                            {m.content}
                          </div>
                        )}

                        {/* If AI message contains code blocks, show quick action bar below message */}
                        {codeBlocks.length > 0 && (
                          <div className="mt-2 space-y-2 w-full max-w-[90%]">
                            {codeBlocks.map((codeStr, idx) => {
                              const blockId = `${m.id}-code-${idx}`;
                              return (
                                <div
                                  key={blockId}
                                  className="p-2.5 bg-[#1E1E22] border border-white/10 rounded-xl text-white space-y-2"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-1.5">
                                    <span className="font-mono flex items-center gap-1">
                                      <Code2 className="w-3 h-3 text-purple-400" /> Generierter Code-Block ({codeStr.length} Chars)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                      onClick={() => handleInjectCode(codeStr, blockId)}
                                      className="flex-1 py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                                      title="Direkt in das aktive Werkzeug injizieren"
                                    >
                                      <Wand2 className="w-3 h-3" />
                                      {injectedId === blockId ? '✓ Injiziert!' : 'Injektieren'}
                                    </button>
                                    <button
                                      onClick={() => handleCopyCode(codeStr, blockId)}
                                      className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                                    >
                                      {copiedId === blockId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <button
                                      onClick={() => handleSaveAsSnippet(codeStr)}
                                      className="py-1 px-2.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-bold transition-all flex items-center gap-1"
                                      title="Im Cross-Tool Store speichern"
                                    >
                                      <Bookmark className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-purple-600 dark:text-purple-300">
                      <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
                      <span>Generiere Antwort über OpenRouter...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Prompt Chips */}
                <div className="p-2 border-t border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                  <button
                    onClick={() => handleSendMessage('Analysiere meinen aktuellen Code auf Fehler, Accessibility & Performance.')}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-purple-500/10 text-[11px] font-medium text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 whitespace-nowrap border border-black/5 dark:border-white/5"
                  >
                    🔍 Fehler & A11y Audit
                  </button>
                  <button
                    onClick={() => handleSendMessage('Optimiere diesen Code mit sauberem Tailwind CSS & Prettify.')}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-purple-500/10 text-[11px] font-medium text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 whitespace-nowrap border border-black/5 dark:border-white/5"
                  >
                    ⚡ Prettify & Refactor
                  </button>
                  <button
                    onClick={() => handleSendMessage('Wandle diesen HTML-Code in MSO-kompatibles Outlook Email Layout um.')}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-purple-500/10 text-[11px] font-medium text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 whitespace-nowrap border border-black/5 dark:border-white/5"
                  >
                    ✉️ MSO Outlook Fix
                  </button>
                </div>

                {/* Input Form */}
                <div className="p-3 border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#121214] shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Frage zu Code, Snippets oder Änderungen..."
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputMessage.trim()}
                      className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl disabled:opacity-40 transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : activeTab === 'history' ? (
              /* CHAT HISTORY TAB */
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {/* Header Action Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-500" />
                    <h4 className="text-xs font-bold text-black dark:text-white">
                      Gespeicherte Chat-Verläufe
                    </h4>
                  </div>
                  <button
                    onClick={handleStartNewChat}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Neuer Chat
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <MessageSquare className="w-8 h-8 text-black/30 dark:text-white/30 mx-auto" />
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Noch keine vergangenen Chats gespeichert.
                    </p>
                    <p className="text-[11px] text-black/40 dark:text-white/40">
                      Deine Unterhaltungen werden automatisch lokal gesichert.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map((sess) => {
                      const isActive = sess.id === currentSessionId;
                      const msgCount = sess.messages.length;
                      const dateStr = new Date(sess.updatedAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={sess.id}
                          onClick={() => handleLoadSession(sess)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isActive
                              ? 'bg-purple-500/15 border-purple-500/40 shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-purple-500/30 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-black dark:text-white truncate">
                                {sess.title}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-black/50 dark:text-white/50 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {dateStr}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-purple-600 dark:text-purple-300">
                                  {msgCount} Nachrichten
                                </span>
                                {sess.toolName && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded">
                                      {sess.toolName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {isActive && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500 text-white shrink-0">
                                Aktiv
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                            <button
                              onClick={(e) => handleExportChatJson(sess, e)}
                              className="px-2.5 py-1 bg-black/10 dark:bg-white/10 hover:bg-purple-500/20 text-black dark:text-white rounded-lg text-[11px] font-medium transition-all flex items-center gap-1"
                              title="Chat-Log als JSON exportieren"
                            >
                              <Download className="w-3 h-3 text-purple-500" /> Export JSON
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(sess.id, e)}
                              className="p-1 hover:bg-red-500/20 text-black/50 dark:text-white/50 hover:text-red-500 rounded-lg transition-all"
                              title="Chat-Verlauf löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* CROSS-TOOL HUB TAB */
              <div className="flex-1 p-4 overflow-y-auto space-y-5 custom-scrollbar">
                {/* Active Tool Code Buffer Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-black/5 dark:to-white/5 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-500" />
                      Aktives Werkzeug Puffer
                    </span>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                      {activeToolContext?.toolName || 'Kein Puffer'}
                    </span>
                  </div>
                  {activeToolContext?.activeCode ? (
                    <div className="space-y-2">
                      <pre className="p-2.5 bg-[#1A1A1E] text-slate-200 text-[10px] font-mono rounded-xl max-h-24 overflow-hidden text-ellipsis leading-relaxed border border-white/10">
                        {activeToolContext.activeCode.slice(0, 300)}...
                      </pre>
                      <button
                        onClick={() => {
                          addSnippet({
                            name: `Puffer (${activeToolContext.toolName})`,
                            code: activeToolContext.activeCode,
                            type: (activeToolContext.language as any) || 'html',
                            tags: ['buffer', activeToolContext.toolName.toLowerCase()],
                            sourceTool: activeToolContext.toolName
                          });
                          alert('✓ Aktueller Puffer als Snippet gespeichert!');
                        }}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <Bookmark className="w-3.5 h-3.5" /> Als Snippet im Store speichern
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-black/50 dark:text-white/50">
                      Öffne ein Werkzeug (z.B. WYSIWYG Studio, WordToHtml oder DataTransformer), um den Code-Puffer zu laden.
                    </p>
                  )}
                </div>

                {/* Shared Snippets Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-500" /> Reusable Snippets ({snippets.length})
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {snippets.map((snip) => (
                      <div
                        key={snip.id}
                        className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-black dark:text-white">{snip.name}</span>
                          <button
                            onClick={() => removeSnippet(snip.id)}
                            className="text-red-500 hover:text-red-600 p-1"
                            title="Löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {snip.tags.map((t) => (
                            <span key={t} className="text-[9px] font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-black/70 dark:text-white/70">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => injectCodeToActiveTool(snip.code)}
                            className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" /> In Werkzeug injizieren
                          </button>
                          <button
                            onClick={() => handleCopyCode(snip.code, snip.id)}
                            className="px-2 py-1 bg-black/10 dark:bg-white/10 text-black dark:text-white text-[11px] font-bold rounded-lg"
                          >
                            {copiedId === snip.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Metadata Tags */}
                <div className="space-y-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <h4 className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-500" /> Metadata Tags (Global)
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(metadataTags).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-300">{k}:</span>
                        <span className="font-mono text-black/70 dark:text-white/70 truncate max-w-[160px]">{v}</span>
                        <button onClick={() => removeMetadataTag(k)} className="text-red-500 hover:text-red-600 p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const k = prompt('Tag Key (z.B. brand_color):');
                      if (k) {
                        const v = prompt(`Wert für ${k}:`);
                        if (v) setMetadataTag(k, v);
                      }
                    }}
                    className="w-full py-1.5 border border-dashed border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-black/70 dark:text-white/70 font-semibold rounded-xl flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Neuen Tag hinzufügen
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
