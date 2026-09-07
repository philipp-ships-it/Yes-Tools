import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SharedTemplate {
  id: string;
  title: string;
  category: 'Mailing' | 'LandingPage' | 'Component' | 'DataSchema' | 'Snippet' | 'Other';
  code: string;
  tags: string[];
  createdAt: string;
  sourceTool?: string;
}

export interface SharedSnippet {
  id: string;
  name: string;
  code: string;
  type: 'html' | 'css' | 'json' | 'text';
  tags: string[];
  createdAt: string;
  sourceTool?: string;
}

export interface ActiveToolContext {
  toolId: string; // e.g. 'wysiwyg', 'wordtohtml', 'datatransformer', 'cocreator', 'devtools'
  toolName: string;
  activeCode: string;
  activeFileName?: string;
  language: string;
  metadata?: Record<string, any>;
  lastUpdated: string;
}

export interface CrossToolState {
  templates: SharedTemplate[];
  snippets: SharedSnippet[];
  metadataTags: Record<string, string>;
  activeToolContext: ActiveToolContext | null;

  // Actions
  addTemplate: (template: Omit<SharedTemplate, 'id' | 'createdAt'>) => void;
  removeTemplate: (id: string) => void;
  addSnippet: (snippet: Omit<SharedSnippet, 'id' | 'createdAt'>) => void;
  removeSnippet: (id: string) => void;
  setMetadataTag: (key: string, value: string) => void;
  removeMetadataTag: (key: string) => void;
  setActiveToolContext: (context: Partial<ActiveToolContext> & { toolId: string; toolName: string }) => void;
  injectCodeToActiveTool: (code: string, targetToolId?: string) => void;
}

const DEFAULT_SNIPPETS: SharedSnippet[] = [
  {
    id: 'snip-mso-btn',
    name: '✉️ MSO Outlook VML Button',
    type: 'html',
    code: `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://example.com" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="18%" stroke="f" fillcolor="#2563eb">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">JETZT BESTELLEN</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="https://example.com" style="background-color:#2563eb;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:14px;font-weight:bold;line-height:44px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;border-radius:8px;">JETZT BESTELLEN</a>
<!--<![endif]-->`,
    tags: ['email', 'outlook', 'mso', 'button'],
    createdAt: new Date().toISOString(),
    sourceTool: 'DevTools'
  },
  {
    id: 'snip-email-600',
    name: '📬 Responsive Email Wrapper (600px)',
    type: 'html',
    code: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 20px 0;">
  <tr>
    <td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: Arial, sans-serif;">
        <tr>
          <td style="padding: 32px; color: #1e293b;">
            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #0f172a;">Willkommen</h1>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">Füge hier deinen Mail-Inhalt ein.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
    tags: ['email', '600px', 'table'],
    createdAt: new Date().toISOString(),
    sourceTool: 'WYSIWYG Studio'
  }
];

export const useCrossToolStore = create<CrossToolState>()(
  persist(
    (set, get) => ({
      templates: [],
      snippets: DEFAULT_SNIPPETS,
      metadataTags: {
        'project': 'Newsletter Campaign 2026',
        'brand_primary': '#2563eb',
        'encoding': 'UTF-8'
      },
      activeToolContext: null,

      addTemplate: (tpl) => {
        const newTpl: SharedTemplate = {
          ...tpl,
          id: 'tpl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          createdAt: new Date().toISOString()
        };
        set((state) => ({ templates: [newTpl, ...state.templates] }));
      },

      removeTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      addSnippet: (snip) => {
        const newSnip: SharedSnippet = {
          ...snip,
          id: 'snip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          createdAt: new Date().toISOString()
        };
        set((state) => ({ snippets: [newSnip, ...state.snippets] }));
      },

      removeSnippet: (id) => {
        set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) }));
      },

      setMetadataTag: (key, value) => {
        set((state) => ({
          metadataTags: { ...state.metadataTags, [key.trim()]: value }
        }));
      },

      removeMetadataTag: (key) => {
        set((state) => {
          const next = { ...state.metadataTags };
          delete next[key];
          return { metadataTags: next };
        });
      },

      setActiveToolContext: (context) => {
        set((state) => ({
          activeToolContext: {
            ...state.activeToolContext,
            activeCode: context.activeCode ?? state.activeToolContext?.activeCode ?? '',
            language: context.language ?? state.activeToolContext?.language ?? 'html',
            ...context,
            lastUpdated: new Date().toISOString()
          }
        }));
      },

      injectCodeToActiveTool: (code, targetToolId) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('yes-inject-code', {
              detail: {
                code,
                toolId: targetToolId || get().activeToolContext?.toolId
              }
            })
          );
        }
      }
    }),
    {
      name: 'yes-cross-tool-storage'
    }
  )
);
