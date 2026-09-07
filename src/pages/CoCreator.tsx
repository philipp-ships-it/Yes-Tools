import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Wrench, Code2, Paintbrush, FileText, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLocation, useNavigate } from 'react-router-dom';
import { AIInput } from '@/components/ui/ai-input';
import { cocreatorTools, executeTool } from '../utils/aiTools';
import { TextShimmer } from '@/components/core/TextShimmer';
import { callOpenRouterChat, getOpenRouterApiKey, getOpenRouterModel } from '../services/openrouterService';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

const quickStarts = [
  {
    icon: Code2,
    title: 'HTML optimieren',
    description: 'Bereinige mein HTML',
    prompt: 'Bitte optimiere den folgenden HTML-Code, entferne überflüssige Tags und verbessere die Semantik: \n',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    icon: Paintbrush,
    title: 'CSS anpassen',
    description: 'Tailwind Styling',
    prompt: 'Bitte füge Tailwind CSS Klassen zu folgendem HTML hinzu, um es modern und responsive zu gestalten: \n',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    icon: FileText,
    title: 'Struktur prüfen',
    description: 'Prüfe auf a11y',
    prompt: 'Bitte überprüfe mein HTML auf Barrierefreiheit (Accessibility) und Semantik. Zeige mir Verbesserungsvorschläge: \n',
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  {
    icon: Zap,
    title: 'Boilerplate',
    description: 'Neues Grundgerüst',
    prompt: 'Erstelle ein modernes HTML5-Grundgerüst inkl. Tailwind CDN, Meta-Tags für Responsive Design und Dark Mode Vorbereitung.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  }
];

export const CoCreator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = location.state?.initialPrompt as string | undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Settings
  const [temperature] = useLocalStorage('cocreator-temp', 0.7);
  const [systemPrompt] = useLocalStorage('cocreator-system', 'Du bist YES KI, ein hilfreicher Coding-Assistent für XLPM Tools. Antworte immer auf Deutsch, sei freundlich und professionell. Denke Schritt für Schritt und erkläre deine Überlegungen verständlich.');
  const [model] = useLocalStorage('cocreator-model', 'openrouter/auto');
  const [fallbackModels] = useLocalStorage('cocreator-fallback-models', 'google/gemini-2.0-flash-exp:free,openrouter/free');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Track if we've already auto-submitted to avoid loops on remount
  const hasAutoSubmitted = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && !hasAutoSubmitted.current && messages.length === 0) {
      hasAutoSubmitted.current = true;
      // Small delay to let initial render happen before triggering fetch
      setTimeout(() => {
        processInput(initialPrompt);
      }, 100);
    }
  }, [initialPrompt, messages.length]);

  const processInput = async (val: string) => {
    if (!val.trim() || isLoading) return;

    const userMessage = val.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        throw new Error('Kein OpenRouter API Key gefunden. Bitte füge deinen Key in den Einstellungen hinzu oder setze VITE_OPENROUTER_API_KEY.');
      }

      const activeModel = getOpenRouterModel() || model || 'openrouter/auto';

      const apiMessages: any[] = [];
      if (systemPrompt.trim()) {
        apiMessages.push({ role: 'system', content: systemPrompt.trim() });
      }
      // Pass existing messages, but map to openrouter expected format
      const formattedHistory = messages.map(m => {
        const msg: any = { role: m.role, content: m.content || '' };
        if (m.name) msg.name = m.name;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        return msg;
      });
      apiMessages.push(...formattedHistory, { role: 'user', content: userMessage });

      const fallbacks = fallbackModels.split(',').map(s => s.trim()).filter(Boolean);

      const makeRequest = async (currentMessages: any[]): Promise<any> => {
        return await callOpenRouterChat({
          messages: currentMessages,
          model: activeModel,
          temperature,
          tools: cocreatorTools,
          apiKey,
          fallbackModels: fallbacks
        });
      };

      let currentMsgs = [...apiMessages];
      let maxIterations = 5;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;
        const data = await makeRequest(currentMsgs);
        const choice = data.choices[0];
        const message = choice.message;

        if (message.tool_calls && message.tool_calls.length > 0) {
          // Add assistant message with tool calls
          currentMsgs.push(message);
          
          // Inform UI conceptually (optional, but good for UX)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '', 
            tool_calls: message.tool_calls 
          }]);

          for (const toolCall of message.tool_calls) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const result = await executeTool(toolCall.function.name, args, navigate);
              
              currentMsgs.push({
                role: 'tool',
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                content: result
              });
              
              // Also update local state for debugging/history
              setMessages(prev => [...prev, {
                role: 'tool',
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                content: result
              }]);
            } catch (err: any) {
              const errorResult = JSON.stringify({ error: err.message });
              currentMsgs.push({
                role: 'tool',
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                content: errorResult
              });
              setMessages(prev => [...prev, {
                role: 'tool',
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                content: errorResult
              }]);
            }
          }
        } else {
          // Final text response
          const assistantContent = message.content || 'No response generated.';
          setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
          break;
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">YES KI</h1>
            <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">Powered by OpenRouter</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-6 custom-scrollbar pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-tg-light-text dark:text-tg-dark-text tracking-tight">YES KI</h2>
              <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint max-w-sm mx-auto">
                Wähle eine Aktion aus oder tippe einen Prompt, um zu starten.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {quickStarts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(item.prompt)}
                  className="flex items-start gap-4 p-4 text-left rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all group"
                >
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-tg-light-text dark:text-tg-dark-text mb-1 group-hover:text-blue-500 transition-colors">{item.title}</h3>
                    <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint leading-relaxed">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {(msg.role === 'assistant' || msg.role === 'tool') && (
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white flex-shrink-0 mt-1">
                  {msg.role === 'tool' ? <Wrench size={14} /> : <Sparkles size={14} />}
                </div>
              )}
              
              <div className={`max-w-[85%] px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-black dark:bg-white text-white dark:text-black rounded-3xl rounded-tr-sm' 
                  : msg.role === 'tool'
                  ? 'bg-gray-100 dark:bg-gray-800 border border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 rounded-3xl rounded-tl-sm shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-black dark:text-white rounded-3xl rounded-tl-sm shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
                ) : msg.role === 'tool' ? (
                  <div className="text-[13px] font-mono opacity-80 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {msg.name} returned: {msg.content.substring(0, 200)}{msg.content.length > 200 ? '...' : ''}
                  </div>
                ) : (
                  <div className="markdown-body text-[15px] leading-relaxed prose dark:prose-invert max-w-none">
                    {msg.tool_calls && msg.tool_calls.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                         <TextShimmer duration={1.2} className='text-sm font-medium [--base-color:#2563eb] [--base-gradient-color:#bfdbfe] dark:[--base-color:#1d4ed8] dark:[--base-gradient-color:#60a5fa]'>
                            {tc.function.name === 'compare_text' ? 'Text-Vergleich wird ausgeführt...' : `${tc.function.name} wird verwendet...`}
                         </TextShimmer>
                      </div>
                    ))}
                    {msg.content && <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white flex-shrink-0 mt-1">
              <Sparkles size={14} />
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-black/50 dark:text-white/50" />
              <TextShimmer duration={1.2} className='text-sm font-medium [--base-color:#2563eb] [--base-gradient-color:#bfdbfe] dark:[--base-color:#1d4ed8] dark:[--base-gradient-color:#60a5fa]'>
                Denkt nach...
              </TextShimmer>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative w-full max-w-2xl mx-auto mt-4">
        <AIInput 
          onSubmit={(val) => {
            if (!val.trim() || isLoading) return;
            processInput(val);
          }} 
          placeholder="Ask anything..." 
        />
        <div className="text-center mt-2">
          <span className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint">
            AI can make mistakes. Consider verifying important information.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoCreator;
