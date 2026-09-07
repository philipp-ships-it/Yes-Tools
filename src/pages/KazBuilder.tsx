import React, { useState, useRef, useEffect } from 'react';
import { Code2, Eye, Copy, Download, Wand2, Type, Image as ImageIcon, Layout, Undo, Redo, RefreshCw, Settings, ChevronRight, X } from 'lucide-react';
import beautify from 'js-beautify';
import DOMPurify from 'dompurify';
import { clientsConfig, getPresetHtml } from './kazConfig';

const defaultTemplate = `
<table width="100%" border="0" cellspacing="0" cellpadding="2" align="center" style="font-family: Arial, Calibri, sans-serif; font-size:14px; line-height:18px; background-color: #FFFFFF; color: #000000; text-align: left; max-width:600px;">
    <tbody>
        <tr>
            <td>
                <div align="center"><strong style="font-size: 16px; line-height: 22px;">Headline Here</strong></div>
                <br>
                <div>Start typing your text here...</div>
            </td>
        </tr>
    </tbody>
</table>
`;


const kazPresets = {
  table: `<table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="font-family:Arial, Calibri, sans-serif;font-size:13px;line-height:18px; background-color: #ffffff; color: #000000; max-width:600px; margin-bottom: 10px;">
  <tbody>
    <tr>
      <td>Your text here...</td>
    </tr>
  </tbody>
</table><br/>`,
  image: `<img src="https://via.placeholder.com/600x200" width="100%" style="max-width: 600px; display: block; border: 0; margin-bottom: 10px;" alt="Placeholder" /><br/>`,
  button: `<table border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 10px;">
  <tbody>
    <tr>
      <td align="center" style="border-radius: 4px; background-color: #0059FF;">
        <a href="#" target="_blank" style="font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 24px; display: inline-block; font-weight: bold;">Call to Action</a>
      </td>
    </tr>
  </tbody>
</table><br/>`,
  textBlock: `<div style="font-family: Arial, Calibri, sans-serif; font-size: 14px; line-height: 20px; color: #333333; padding: 10px 0;">
  <strong>Subtitle</strong><br/>
  This is a customizable text block preset.
</div><br/>`,
  link: `<a href="#" target="_blank" style="color: #0059FF; text-decoration: underline;">Text Link</a>&nbsp;`
};

export const KazBuilder: React.FC = () => {
  
  const [html, setHtml] = useState(defaultTemplate);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const [activeElementTag, setActiveElementTag] = useState<string | null>(null);
  const [activeStyles, setActiveStyles] = useState<Record<string, string>>({});
  const [activeAttributes, setActiveAttributes] = useState<Record<string, string>>({});
  const [presets, setPresets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('kazPresets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sidebarTab, setSidebarTab] = useState<'presets' | 'elements'>('presets');
  const [client, setClient] = useState('maxLQ');
  const [adType, setAdType] = useState('Textanzeige');
  const [breadcrumbs, setBreadcrumbs] = useState<{ tag: string, node: any }[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importHtmlValue, setImportHtmlValue] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  
  
  const updateHtmlFromVisual = () => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const body = iframeRef.current.contentDocument.body;
      let bodyHtml = body.innerHTML;
      bodyHtml = bodyHtml.replace(/ data-kaz-selected="true"/g, '');
      setHtml(bodyHtml);
    }
  };

  const handleStyleChange = (prop: string, value: string) => {
    if (activeElementRef.current) {
      (activeElementRef.current.style as any)[prop] = value;
      setActiveStyles(prev => ({ ...prev, [prop]: value }));
      updateHtmlFromVisual();
    }
  };

  const handleAttributeChange = (prop: string, value: string) => {
    if (activeElementRef.current) {
      if (value) {
        activeElementRef.current.setAttribute(prop, value);
      } else {
        activeElementRef.current.removeAttribute(prop);
      }
      setActiveAttributes(prev => ({ ...prev, [prop]: value }));
      updateHtmlFromVisual();
    }
  };

  const handleImportSubmit = () => {
    const cleanHtml = DOMPurify.sanitize(importHtmlValue, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });
    setHtml(cleanHtml);
    setIsImportModalOpen(false);
    if (viewMode === 'visual') {
      setViewMode('code');
      setTimeout(() => setViewMode('visual'), 50);
    }
  };

  const handleExportHtml = () => {
    setIsExportModalOpen(true);
  };

  const savePreset = () => {
    if (activeElementRef.current) {
      const outerHtml = activeElementRef.current.outerHTML;
      const name = prompt('Name for this preset?');
      if (name) {
        const newPreset = { name, html: outerHtml };
        const newPresets = [...presets, newPreset];
        setPresets(newPresets);
        localStorage.setItem('kazPresets', JSON.stringify(newPresets));
      }
    } else {
      alert('Select an element first.');
    }
  };

  const deletePreset = (idx: number) => {
    const newPresets = presets.filter((_, i) => i !== idx);
    setPresets(newPresets);
    localStorage.setItem('kazPresets', JSON.stringify(newPresets));
  };


  useEffect(() => {
    if (viewMode === 'visual' && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        
        doc.designMode = 'on';

        const style = doc.createElement('style');
        style.id = 'kaz-inspector-styles';
        style.innerHTML = `
          body { cursor: default !important; font-family: sans-serif; }
          * { transition: outline 0.1s; cursor: default !important; }
          *:hover { outline: 1px dashed rgba(0, 89, 255, 0.4); }
          [data-kaz-selected="true"] { outline: 2px solid #0059FF !important; outline-offset: -2px; }
          p, h1, h2, h3, h4, h5, h6, span, strong, em, td, th { cursor: text !important; }
        `;
        doc.head.appendChild(style);
        
        // Add listener for changes
        doc.body.addEventListener('input', updateHtmlFromVisual);
        doc.body.addEventListener('keyup', updateHtmlFromVisual);

        const handleSelection = (node: Node | null) => {
          if (node && node.nodeType === 3) { // Text node
            node = node.parentNode;
          }
          if (node && node instanceof doc.defaultView!.HTMLElement) {
            // Remove previous selection
            const prev = doc.querySelectorAll('[data-kaz-selected="true"]');
            prev.forEach(p => p.removeAttribute('data-kaz-selected'));
            
            node.setAttribute('data-kaz-selected', 'true');
            
            activeElementRef.current = node;
            setActiveElementTag(node.tagName.toLowerCase());

            const newBreadcrumbs = [];
            let curr = node;
            while (curr && curr !== doc.body && curr instanceof doc.defaultView!.HTMLElement) {
              newBreadcrumbs.unshift({ tag: curr.tagName.toLowerCase(), node: curr });
              curr = curr.parentNode as HTMLElement;
            }
            setBreadcrumbs(newBreadcrumbs);
            
            const computedStyle = doc.defaultView!.getComputedStyle(node);
            setActiveStyles({
              width: node.style.width || computedStyle.width,
              height: node.style.height || computedStyle.height,
              backgroundColor: node.style.backgroundColor || computedStyle.backgroundColor,
              color: node.style.color || computedStyle.color,
              fontSize: node.style.fontSize || computedStyle.fontSize,
              fontFamily: node.style.fontFamily || computedStyle.fontFamily,
              textAlign: node.style.textAlign || computedStyle.textAlign,
              padding: node.style.padding || computedStyle.padding,
              margin: node.style.margin || computedStyle.margin,
            });

            setActiveAttributes({
              id: node.getAttribute('id') || '',
              class: node.getAttribute('class') || '',
              src: node.getAttribute('src') || '',
              href: node.getAttribute('href') || '',
              alt: node.getAttribute('alt') || '',
              target: node.getAttribute('target') || '',
              rel: node.getAttribute('rel') || '',
            });
          } else {
            const prev = doc.querySelectorAll('[data-kaz-selected="true"]');
            prev.forEach(p => p.removeAttribute('data-kaz-selected'));
            activeElementRef.current = null;
            setActiveElementTag(null);
          }
        };
        
        doc.addEventListener('selectionchange', () => {
          const selection = doc.getSelection();
          if (selection && selection.rangeCount > 0) {
            handleSelection(selection.anchorNode);
          }
        });

        doc.addEventListener('click', (e) => {
           handleSelection(e.target as Node);
        });
        
        doc.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (activeElementRef.current) {
              const clone = activeElementRef.current.cloneNode(true);
              activeElementRef.current.parentNode?.insertBefore(clone, activeElementRef.current.nextSibling);
              updateHtmlFromVisual();
            }
          }
        });
        
        // Add basic styles to iframe body to match email clients
        doc.body.style.margin = '0';
        doc.body.style.padding = '20px';
        doc.body.style.backgroundColor = '#f4f4f4';
      }
    }
  }, [viewMode]);

  const insertHtml = (htmlStr: string) => {
    if (viewMode === 'visual' && iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.execCommand('insertHTML', false, htmlStr);
      updateHtmlFromVisual();
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (viewMode === 'visual' && iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.execCommand(command, false, value);
      updateHtmlFromVisual();
    }
  };

  const handleCopyCode = () => {
    const cleanHtml = beautify.html(html, { indent_size: 2 });
    navigator.clipboard.writeText(cleanHtml);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#111111]">
        <div>
          <h1 className="text-2xl font-bold text-tg-light-text dark:text-tg-dark-text flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-500" />
            KAZ / Email Builder
          </h1>
          <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint mt-1">
            WYSIWYG Editor for Email and Ad Templates with 1:1 Code Output
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button
              onClick={() => {
                if (viewMode === 'code') setViewMode('visual');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 \${
                viewMode === 'visual'
                  ? 'bg-white dark:bg-[#222222] text-black dark:text-white shadow-sm'
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-black dark:hover:text-white'
              }`}
            >
              <Eye size={16} />
              Visual Editor
            </button>
            <button
              onClick={() => {
                if (viewMode === 'visual') {
                  updateHtmlFromVisual();
                  setViewMode('code');
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 \${
                viewMode === 'code'
                  ? 'bg-white dark:bg-[#222222] text-black dark:text-white shadow-sm'
                  : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-black dark:hover:text-white'
              }`}
            >
              <Code2 size={16} />
              Code View
            </button>
          </div>
          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 hover:bg-white dark:hover:bg-[#222] text-tg-light-hint dark:text-tg-dark-hint hover:text-black dark:hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Import HTML
            </button>
            <button 
              onClick={handleExportHtml}
              className="px-4 py-2 hover:bg-white dark:hover:bg-[#222] text-tg-light-hint dark:text-tg-dark-hint hover:text-black dark:hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Export HTML
            </button>
          </div>
          <button 
            onClick={handleCopyCode}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Copy size={16} />
            Copy HTML
          </button>
        </div>
      </div>

      {viewMode === 'visual' && (
        <div className="flex-none p-3 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => execCommand('bold')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Bold">
            <b className="font-serif">B</b>
          </button>
          <button onClick={() => execCommand('italic')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Italic">
            <i className="font-serif">I</i>
          </button>
          <button onClick={() => execCommand('underline')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Underline">
            <u className="font-serif">U</u>
          </button>
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />
          <button onClick={() => execCommand('justifyLeft')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Align Left">
            Left
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Align Center">
            Center
          </button>
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />
          <button onClick={() => execCommand('undo')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Undo">
            <Undo size={16} />
          </button>
          <button onClick={() => execCommand('redo')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Redo">
            <Redo size={16} />
          </button>
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />
          <button 
            onClick={() => {
              const url = prompt('Enter image URL:');
              if (url) execCommand('insertImage', url);
            }} 
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 text-sm"
          >
            <ImageIcon size={16} /> Image
          </button>
          <button 
            onClick={() => {
              const url = prompt('Enter link URL:');
              if (url) execCommand('createLink', url);
            }} 
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm"
          >
            Link
          </button>
        </div>
      )}

      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Presets */}
        {viewMode === 'visual' && (
          <div className="w-64 flex-none bg-[#F9F9F9] dark:bg-[#1A1A1A] border-r border-black/5 dark:border-white/5 flex flex-col overflow-hidden">
            <div className="flex border-b border-black/5 dark:border-white/5 flex-none">
              <button 
                onClick={() => setSidebarTab('presets')}
                className={`flex-1 py-3 text-sm font-semibold ${sidebarTab === 'presets' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-black/60 dark:text-white/60'}`}
              >
                Presets
              </button>
              <button 
                onClick={() => setSidebarTab('elements')}
                className={`flex-1 py-3 text-sm font-semibold ${sidebarTab === 'elements' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-black/60 dark:text-white/60'}`}
              >
                Elements
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {sidebarTab === 'presets' && (
                <>
                  <div className="flex flex-col gap-2 mb-2">
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60">Kunde (Client)</label>
                    <select value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm">
                      <option value="maxLQ">maxLQ</option>
                      <option value="gevestor">Gevestor/Investor</option>
                      <option value="mediaforwork">mediaforwork</option>
                    </select>

                    <label className="text-xs font-semibold text-black/60 dark:text-white/60 mt-2">Anzeigentyp</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Textanzeige', 'Bildanzeige', 'Redlink', 'Linktipp'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setAdType(type)}
                          className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${adType === type ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-black/10 text-black/70 dark:bg-[#222] dark:border-white/10 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => insertHtml(getPresetHtml(client, adType))}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1 text-blue-800 dark:text-blue-300">Insert Standard</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Fügt das ausgewählte Preset basierend auf Kunde und Typ ein.</div>
                  </button>
                  
                  {presets.length > 0 && (
                    <>
                      <h3 className="font-bold text-sm text-black/70 dark:text-white/70 uppercase tracking-wider mt-4">Custom Presets</h3>
                      {presets.map((preset, idx) => (
                        <div key={idx} className="group relative">
                          <button 
                            onClick={() => insertHtml(preset.html)}
                            className="w-full p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                          >
                            <div className="font-bold text-sm mb-1">{preset.name}</div>
                            <div className="text-xs text-black/50 dark:text-white/50 truncate">Custom saved block.</div>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deletePreset(idx); }}
                            className="absolute top-2 right-2 p-1 bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            Del
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
              
              {sidebarTab === 'elements' && (
                <>
                  <button 
                    onClick={() => insertHtml(kazPresets.table)}
                    className="p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1">Standard Table</div>
                    <div className="text-xs text-black/50 dark:text-white/50">100% width container.</div>
                  </button>
                  
                  <button 
                    onClick={() => insertHtml(kazPresets.image)}
                    className="p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1">Fluid Image</div>
                    <div className="text-xs text-black/50 dark:text-white/50">Responsive image block.</div>
                  </button>

                  <button 
                    onClick={() => insertHtml(kazPresets.textBlock)}
                    className="p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1">Text Block</div>
                    <div className="text-xs text-black/50 dark:text-white/50">Formatted generic text block.</div>
                  </button>
                  
                  <button 
                    onClick={() => insertHtml(kazPresets.button)}
                    className="p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1">CTA Button</div>
                    <div className="text-xs text-black/50 dark:text-white/50">Centered, table-based button.</div>
                  </button>
                  
                  <button 
                    onClick={() => insertHtml(kazPresets.link)}
                    className="p-3 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl text-left hover:border-blue-500 transition-colors shadow-sm"
                  >
                    <div className="font-bold text-sm mb-1">Text Link</div>
                    <div className="text-xs text-black/50 dark:text-white/50">Inline link with underline.</div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#F9F9F9] dark:bg-[#0A0A0A]">
          {viewMode === 'visual' && breadcrumbs.length > 0 && (
            <div className="flex-none bg-white dark:bg-[#1A1A1A] border-b border-black/5 dark:border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto text-sm">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  <button 
                    onClick={() => {
                      if (iframeRef.current?.contentDocument) {
                        const doc = iframeRef.current.contentDocument;
                        const prev = doc.querySelectorAll('[data-kaz-selected="true"]');
                        prev.forEach(p => p.removeAttribute('data-kaz-selected'));
                        b.node.setAttribute('data-kaz-selected', 'true');
                        activeElementRef.current = b.node;
                        setActiveElementTag(b.tag);
                      }
                    }}
                    className={`hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded ${i === breadcrumbs.length - 1 ? 'font-bold text-blue-600' : 'text-black/60 dark:text-white/60'}`}
                  >
                    {b.tag}
                  </button>
                  {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-black/30 dark:text-white/30" />}
                </React.Fragment>
              ))}
            </div>
          )}

        {viewMode === 'visual' ? (
          <iframe
            ref={iframeRef}
            className="flex-1 w-full border-none bg-white"
            title="WYSIWYG Editor"
          />
        ) : (
          <textarea
            value={beautify.html(html, { indent_size: 2 })}
            onChange={(e) => setHtml(e.target.value)}
            className="flex-1 w-full p-6 font-mono text-sm bg-transparent outline-none resize-none custom-scrollbar text-tg-light-text dark:text-tg-dark-text"
            spellCheck={false}
          />
        )}
      </div>

        {/* Right Sidebar - Properties */}
        {viewMode === 'visual' && (
          <div className="w-72 flex-none bg-[#F9F9F9] dark:bg-[#1A1A1A] border-l border-black/5 dark:border-white/5 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-black/70 dark:text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Settings size={16} /> Properties
              </h3>
              {activeElementTag && (
                <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded font-mono">
                  &lt;{activeElementTag}&gt;
                </div>
              )}
            </div>
            
            {activeElementTag && (
              <div className="flex gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg justify-center mt-2">
                <button onClick={() => iframeRef.current?.contentDocument?.execCommand('bold')} className="p-1.5 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm text-sm font-bold w-10 flex justify-center text-black dark:text-white" title="Bold">B</button>
                <button onClick={() => iframeRef.current?.contentDocument?.execCommand('italic')} className="p-1.5 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm text-sm italic w-10 flex justify-center text-black dark:text-white" title="Italic">I</button>
                <button onClick={() => iframeRef.current?.contentDocument?.execCommand('underline')} className="p-1.5 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm text-sm underline w-10 flex justify-center text-black dark:text-white" title="Underline">U</button>
                <button onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) iframeRef.current?.contentDocument?.execCommand('createLink', false, url);
                }} className="p-1.5 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm text-sm font-semibold w-10 flex justify-center text-blue-500" title="Link">Link</button>
                <button onClick={() => iframeRef.current?.contentDocument?.execCommand('unlink')} className="p-1.5 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm text-xs font-semibold w-12 flex justify-center text-red-500" title="Remove Link">Unlink</button>
              </div>
            )}

            {!activeElementTag ? (
              <div className="text-sm text-black/50 dark:text-white/50 text-center py-8">
                Select an element in the editor to modify its properties.
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">ID</label>
                    <input 
                      type="text" 
                      value={activeAttributes.id || ''} 
                      onChange={(e) => handleAttributeChange('id', e.target.value)}
                      className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Class</label>
                    <input 
                      type="text" 
                      value={activeAttributes.class || ''} 
                      onChange={(e) => handleAttributeChange('class', e.target.value)}
                      className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                {activeElementTag === 'img' && (
                  <>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-2">
                      <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 block">Image Source URL (src)</label>
                      <input 
                        type="text" 
                        value={activeAttributes.src || ''} 
                        onChange={(e) => handleAttributeChange('src', e.target.value)}
                        className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-2">
                      <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 block">Alt Text</label>
                      <input 
                        type="text" 
                        value={activeAttributes.alt || ''} 
                        onChange={(e) => handleAttributeChange('alt', e.target.value)}
                        className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="Description..."
                      />
                    </div>
                  </>
                )}
                {activeElementTag === 'a' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-2">
                    <label className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1 block">Link URL (href)</label>
                    <input 
                      type="text" 
                      value={activeAttributes.href || ''} 
                      onChange={(e) => handleAttributeChange('href', e.target.value)}
                      className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Width</label>
                  <input 
                    type="text" 
                    value={activeStyles.width || ''} 
                    onChange={(e) => handleStyleChange('width', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Height</label>
                  <input 
                    type="text" 
                    value={activeStyles.height || ''} 
                    onChange={(e) => handleStyleChange('height', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Background Color</label>
                  <input 
                    type="text" 
                    value={activeStyles.backgroundColor || ''} 
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Text Color</label>
                  <input 
                    type="text" 
                    value={activeStyles.color || ''} 
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Font Size</label>
                  <input 
                    type="text" 
                    value={activeStyles.fontSize || ''} 
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Font Family</label>
                  <input 
                    type="text" 
                    value={activeStyles.fontFamily || ''} 
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Text Align</label>
                  <select 
                    value={activeStyles.textAlign || ''} 
                    onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="">Default</option>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">Padding</label>
                  <input 
                    type="text" 
                    value={activeStyles.padding || ''} 
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    className="w-full bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <button
                    onClick={() => {
                      if (activeElementRef.current) {
                        const clone = activeElementRef.current.cloneNode(true);
                        activeElementRef.current.parentNode?.insertBefore(clone, activeElementRef.current.nextSibling);
                        updateHtmlFromVisual();
                      }
                    }}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      if (activeElementRef.current) {
                        activeElementRef.current.remove();
                        setActiveElementTag(null);
                        activeElementRef.current = null;
                        updateHtmlFromVisual();
                      }
                    }}
                    className="flex-1 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <button
                    onClick={savePreset}
                    className="w-full py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save as Custom Preset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-2xl rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Import HTML</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <textarea 
              value={importHtmlValue}
              onChange={(e) => setImportHtmlValue(e.target.value)}
              className="w-full h-64 p-4 font-mono text-sm bg-[#F9F9F9] dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-xl outline-none resize-none mb-4"
              placeholder="Paste raw HTML here..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">Cancel</button>
              <button onClick={handleImportSubmit} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Import</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-2xl rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Export HTML</h2>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <textarea 
              readOnly
              value={beautify.html(html, { indent_size: 2 })}
              className="w-full h-64 p-4 font-mono text-sm bg-[#F9F9F9] dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-xl outline-none resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">Close</button>
              <button onClick={handleCopyCode} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Copy size={16} /> Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};