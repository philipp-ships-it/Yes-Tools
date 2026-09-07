import React, { useState } from 'react';
import { 
  Code2, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  Tag, 
  Folder, 
  Sparkles, 
  CheckSquare, 
  AlignLeft, 
  Monitor, 
  Smartphone, 
  Maximize2, 
  X,
  FileCode,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';
import { formatMsoHtml } from '../utils/msoFormatter';

export interface CodeSnippet {
  id: string;
  title: string;
  category: string;
  tags: string[];
  code: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SNIPPETS: CodeSnippet[] = [
  {
    id: 'mso-2col-table',
    title: 'Outlook (MSO) 2-Spalten Tabelle',
    category: 'Email / Outlook',
    tags: ['mso', 'outlook', 'table', 'responsive'],
    code: `<!--[if mso | IE]>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:100%;max-width:600px;" width="600">
<tr>
<td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
<![endif]-->
<div style="max-width:600px;margin:0 auto;background:#ffffff;padding:20px;font-family:Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="50%" valign="top" style="padding:10px;font-size:14px;color:#333333;">
        <h3 style="margin:0 0 10px 0;color:#0059FF;">Spalte 1</h3>
        <p style="margin:0;line-height:1.5;">Hochwertiger Inhalt für die erste Spalte im Newsletter.</p>
      </td>
      <td width="50%" valign="top" style="padding:10px;font-size:14px;color:#333333;">
        <h3 style="margin:0 0 10px 0;color:#6927FA;">Spalte 2</h3>
        <p style="margin:0;line-height:1.5;">Inhalt für die zweite Spalte mit voller Outlook-Kompatibilität.</p>
      </td>
    </tr>
  </table>
</div>
<!--[if mso | IE]>
</td>
</tr>
</table>
<![endif]-->`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mso-vml-button',
    title: 'Outlook Bulletproof VML Button',
    category: 'Buttons',
    tags: ['button', 'vml', 'mso', 'cta'],
    code: `<div>
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://example.com" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="15%" stroke="f" fillcolor="#0059FF">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Jetzt Bestellen</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="https://example.com" style="background-color:#0059FF;border-radius:8px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:220px;-webkit-text-size-adjust:none;">Jetzt Bestellen &rarr;</a>
  <!--<![endif]-->
</div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'newsletter-header',
    title: 'Newsletter Header mit Logo',
    category: 'Header / Footer',
    tags: ['header', 'logo', 'brand'],
    code: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;padding:24px 0;">
  <tr>
    <td align="center">
      <a href="https://example.com" target="_blank">
        <img src="https://via.placeholder.com/180x48/0059FF/FFFFFF?text=YES+NEWSLETTER" alt="Logo" width="180" height="48" style="display:block;border:0;outline:none;" />
      </a>
    </td>
  </tr>
</table>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'clean-footer',
    title: 'Clean Email Footer & Unsubscribe',
    category: 'Header / Footer',
    tags: ['footer', 'unsubscribe', 'impressum'],
    code: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0F172A;color:#94A3B8;font-family:Arial,sans-serif;font-size:12px;padding:32px 20px;">
  <tr>
    <td align="center" style="line-height:1.6;">
      <p style="margin:0 0 12px 0;">&copy; 2026 YES Media Group. Alle Rechte vorbehalten.</p>
      <p style="margin:0;">
        Du erhältst diese E-Mail, weil du für unseren Newsletter angemeldet bist.<br />
        <a href="#" style="color:#38BDF8;text-decoration:underline;">Abmelden</a> | <a href="#" style="color:#38BDF8;text-decoration:underline;">Impressum</a> | <a href="#" style="color:#38BDF8;text-decoration:underline;">Datenschutz</a>
      </p>
    </td>
  </tr>
</table>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const CATEGORIES = [
  'Alle',
  'Email / Outlook',
  'Buttons',
  'Layout & Grids',
  'Header / Footer',
  'Typography',
  'Custom'
];

export const ComponentStorage: React.FC = () => {
  useToolTracking('Component Storage');

  const [snippets, setSnippets] = useLocalStorage<CodeSnippet[]>('yes-component-storage-snippets', DEFAULT_SNIPPETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Email / Outlook');
  const [formTags, setFormTags] = useState('');
  const [formCode, setFormCode] = useState('');

  // Preview Modal
  const [previewSnippet, setPreviewSnippet] = useState<CodeSnippet | null>(null);
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');

  const handleOpenAddModal = () => {
    setEditingSnippet(null);
    setFormTitle('');
    setFormCategory('Email / Outlook');
    setFormTags('');
    setFormCode('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setFormTitle(snippet.title);
    setFormCategory(snippet.category);
    setFormTags(snippet.tags.join(', '));
    setFormCode(snippet.code);
    setIsModalOpen(true);
  };

  const handleSaveSnippet = () => {
    if (!formTitle.trim() || !formCode.trim()) {
      alert('Bitte gib einen Titel und Code ein.');
      return;
    }

    const tagArray = formTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const now = new Date().toISOString();

    if (editingSnippet) {
      setSnippets(prev => prev.map(s => s.id === editingSnippet.id ? {
        ...s,
        title: formTitle,
        category: formCategory,
        tags: tagArray,
        code: formCode,
        updatedAt: now
      } : s));
    } else {
      const newSnippet: CodeSnippet = {
        id: `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: formTitle,
        category: formCategory,
        tags: tagArray,
        code: formCode,
        createdAt: now,
        updatedAt: now
      };
      setSnippets(prev => [newSnippet, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteSnippet = (id: string) => {
    if (confirm('Möchtest du diesen Code-Block wirklich löschen?')) {
      setSnippets(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleCopyCode = async (snippet: CodeSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Kopieren fehlgeschlagen.');
    }
  };

  const handleFormatFormCode = () => {
    try {
      const formatted = formatMsoHtml(formCode, { indent_size: 2 });
      setFormCode(formatted);
    } catch {
      alert('Formatierung fehlgeschlagen.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snippets, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `yes_component_snippets_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setSnippets(imported);
          alert(`${imported.length} Snippets erfolgreich importiert!`);
        } else {
          alert('Ungültiges Format.');
        }
      } catch {
        alert('Fehler beim Lesen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  // Filter snippets
  const filteredSnippets = snippets.filter(s => {
    const matchesCategory = selectedCategory === 'Alle' || s.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch = s.title.toLowerCase().includes(query) ||
                          s.code.toLowerCase().includes(query) ||
                          s.tags.some(t => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Component Storage</h1>
              <p className="text-sm text-black/60 dark:text-white/60">
                Speichere, verwalte und teste wiederverwendbare HTML & Outlook Code-Bausteine mit Live-Vorschau.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJSON}
              className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
              title="Alle Snippets als JSON exportieren"
            >
              <Download size={16} /> Export
            </button>
            <label className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2 cursor-pointer">
              <Upload size={16} /> Import
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} /> Neuer Baustein
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          
          {/* Search Field */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Titel, Code oder Tags..." 
              className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Snippets Grid */}
        {filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-[#1A1A1A]/40 gap-4">
            <FileCode size={48} className="text-black/30 dark:text-white/30" />
            <div>
              <h3 className="text-lg font-bold">Keine Code-Bausteine gefunden</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                Versuche einen anderen Suchbegriff oder erstelle einen neuen Baustein.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Baustein anlegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnippets.map((snippet) => (
              <div 
                key={snippet.id}
                className="bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top Bar: Category & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs">
                      {snippet.category}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewSnippet(snippet)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                        title="Vorschau"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(snippet)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                        title="Bearbeiten"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(snippet.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-black dark:text-white line-clamp-1 mb-2" title={snippet.title}>
                    {snippet.title}
                  </h3>

                  {/* Code Snippet Box */}
                  <div className="relative bg-[#0F172A] text-slate-200 rounded-xl p-3 font-mono text-xs overflow-hidden max-h-36 border border-slate-800">
                    <pre className="overflow-x-auto custom-scrollbar">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>

                  {/* Tags */}
                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {snippet.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[11px] font-mono text-black/60 dark:text-white/60">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action: Copy Code */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-black/40 dark:text-white/40">
                    {new Date(snippet.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleCopyCode(snippet)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {copiedId === snippet.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedId === snippet.id ? 'Kopiert!' : 'Code kopieren'}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <h3 className="font-bold text-lg">
                  {editingSnippet ? 'Code-Baustein bearbeiten' : 'Neuen Code-Baustein anlegen'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-black/60 dark:text-white/60 mb-1">Titel</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="z.B. Outlook 2-Spalten Layout"
                    className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-black/60 dark:text-white/60 mb-1">Kategorie</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.filter(c => c !== 'Alle').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-black/60 dark:text-white/60 mb-1">Tags (kommagetrennt)</label>
                    <input 
                      type="text" 
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="mso, button, responsive"
                      className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-black/60 dark:text-white/60">HTML / CSS Code</label>
                    <button
                      type="button"
                      onClick={handleFormatFormCode}
                      className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      <AlignLeft size={12} /> Formatieren (MSO Support)
                    </button>
                  </div>
                  <textarea 
                    rows={8}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="<!--[if mso | IE]> ... <![endif]-->"
                    className="w-full p-3 bg-[#0F172A] text-slate-100 font-mono text-xs border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveSnippet}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md"
                >
                  {editingSnippet ? 'Änderungen speichern' : 'Baustein anlegen'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Live Preview Modal */}
        {previewSnippet && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewSnippet(null)}
          >
            <div 
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 flex flex-col gap-4 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-lg">{previewSnippet.title}</h3>
                  <span className="text-xs text-black/50 dark:text-white/50">{previewSnippet.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
                    <button
                      onClick={() => setPreviewWidth('desktop')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${previewWidth === 'desktop' ? 'bg-blue-500 text-white shadow-sm' : ''}`}
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewWidth('mobile')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${previewWidth === 'mobile' ? 'bg-blue-500 text-white shadow-sm' : ''}`}
                    >
                      <Smartphone size={14} /> Mobile (360px)
                    </button>
                  </div>

                  <button onClick={() => setPreviewSnippet(null)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Canvas */}
              <div className="flex-1 overflow-hidden bg-slate-200 dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-center">
                <iframe
                  title={previewSnippet.title}
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:16px;background:#ffffff;color:#000000;font-family:Arial,sans-serif;}</style></head><body>${previewSnippet.code}</body></html>`}
                  className={`bg-white transition-all duration-300 rounded-xl shadow-lg h-[60vh] border-0 ${
                    previewWidth === 'desktop' ? 'w-full' : 'w-[360px]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                <span className="text-xs font-mono text-black/50 dark:text-white/50">
                  Vorschau rendert HTML & MSO VML Fallbacks
                </span>
                <button
                  onClick={() => handleCopyCode(previewSnippet)}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center gap-2 hover:bg-blue-600"
                >
                  <Copy size={16} /> Code kopieren
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ComponentStorage;
