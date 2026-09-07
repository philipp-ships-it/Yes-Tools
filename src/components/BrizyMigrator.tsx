import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileCode, 
  Download, 
  Sparkles, 
  Layers, 
  Zap, 
  Code2, 
  Check, 
  Copy, 
  Trash2, 
  Archive, 
  ChevronRight, 
  ChevronDown, 
  FileJson,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Settings,
  Image as ImageIcon,
  Columns,
  Eye,
  Sliders,
  Plus,
  RefreshCw,
  Globe,
  Link,
  Play,
  Film,
  Map,
  Compass,
  FileText,
  LayoutGrid,
  FolderTree
} from 'lucide-react';
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import { 
  parseBrizyToIR, 
  BrizyParseResult, 
  BrizyIRNode, 
  BrizyIRTree, 
  renderIRTreeToOutput, 
  BrizyAsset,
  BrizyMultiPageProject,
  BrizyAnimation,
  transpileBrizyAnimations,
  rewriteBrizyInternalLinks,
  parseBrizyMultiPageZip
} from '../lib/brizyParser';

const DEFAULT_BRIZY_SAMPLE = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Brizy Multi-Page Demo Website</title>
  <style>
    .brz-reset-all { margin: 0; padding: 0; }
    .brz-css-hero { background-color: #0f172a; color: #ffffff; padding: 90px 20px; text-align: center; }
    .brz-css-title { font-size: 48px; font-weight: 800; color: #38bdf8; margin-bottom: 20px; }
    .brz-css-subtitle { font-size: 20px; color: #94a3b8; max-width: 600px; margin: 0 auto 30px auto; }
    .brz-css-btn { background-color: #38bdf8; color: #0f172a; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; }
    .brz-css-feature-sec { padding: 80px 20px; background-color: #f8fafc; }
    .brz-css-card { background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <!-- Brizy Header Navigation with WP permalinks -->
  <header class="brz-section brz-header p-4 bg-slate-900 text-white">
    <div class="brz-container">
      <div class="brz-row items-center justify-between">
        <div class="brz-column col-4">
          <h2>BrizyMigrator</h2>
        </div>
        <div class="brz-column col-8 text-right">
          <nav>
            <a href="/" class="btn mr-2 text-sky-400">Home</a>
            <a href="/leistungen/" class="btn mr-2 text-sky-400">Leistungen</a>
            <a href="https://mywebsite.com/uber-uns/" class="btn mr-2 text-sky-400">Über Uns</a>
            <a href="http://mywebsite.com/kontakt/" class="btn text-sky-400">Kontakt</a>
          </nav>
        </div>
      </div>
    </div>
  </header>

  <!-- Brizy Header/Hero Section with Scroll Animation -->
  <div class="brz-section brz-section__header brz-css-hero" data-brz-id="sec-101" data-uid="u9x8a1" data-brz-animate="fadeInUp" data-brz-anim-duration="1s" data-brz-anim-delay="0.2s">
    <div class="brz-section__content">
      <div class="brz-container">
        <div class="brz-row">
          <div class="brz-column brz-col-lg-12">
            <div class="brz-column__content">
              <div class="brz-wrapper">
                <div class="brz-text">
                  <h1 class="brz-css-title" data-node-id="h1-1" data-brz-animate="zoomIn" data-brz-anim-duration="0.8s">Willkommen auf unserer Brizy Migration Page</h1>
                </div>
              </div>
              <div class="brz-wrapper">
                <div class="brz-text">
                  <p class="brz-css-subtitle" data-brz-animate="fadeIn" data-brz-anim-delay="0.4s">
                    Automatisierte Konvertierung von verschachteltem Page-Builder Code in performantes, semantisches HTML5 & CSS3.
                  </p>
                </div>
              </div>
              <div class="brz-wrapper">
                <div class="brz-button">
                  <a href="/kontakt/" class="brz-btn brz-css-btn" data-brz-animate="slideInRight">Jetzt Projekt Starten</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Brizy Feature Section with Animations -->
  <div class="brz-section brz-css-feature-sec" data-brz-id="sec-102" data-uid="u9x8a2">
    <div class="brz-section__content">
      <div class="brz-container">
        <div class="brz-row">
          <div class="brz-column brz-col-lg-4" data-brz-animate="slideInLeft" data-brz-anim-delay="0.1s">
            <div class="brz-wrapper brz-css-card">
              <div class="brz-text">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400" alt="Sitemap Migrator" class="mb-3 rounded" />
                <h3>Multi-Page &amp; Sitemap</h3>
                <p>Verarbeitet ganze Websites und wandelt WP Permalinks in saubere relative HTML-Links um.</p>
                <a href="/leistungen/" class="text-purple-600 font-bold mt-2 inline-block">Mehr erfahren &rarr;</a>
              </div>
            </div>
          </div>
          <div class="brz-column brz-col-lg-4" data-brz-animate="slideInUp" data-brz-anim-delay="0.3s">
            <div class="brz-wrapper brz-css-card">
              <div class="brz-text">
                <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400" alt="Motion Transpiler" class="mb-3 rounded" />
                <h3>Motion Presets Transpiler</h3>
                <p>Übersetzt Brizy Scroll-Animationen (data-brz-animate) in saubere Framer Motion &amp; CSS @keyframes.</p>
                <a href="/uber-uns/" class="text-purple-600 font-bold mt-2 inline-block">Über uns &rarr;</a>
              </div>
            </div>
          </div>
          <div class="brz-column brz-col-lg-4" data-brz-animate="slideInRight" data-brz-anim-delay="0.5s">
            <div class="brz-wrapper brz-css-card">
              <div class="brz-text">
                <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400" alt="Asset Resolver" class="mb-3 rounded" />
                <h3>Asset &amp; Link Resolver</h3>
                <p>Extrahiert alle Bilder und wandelt externe URLs in lokale relative Speicherpfade um.</p>
                <a href="/kontakt/" class="text-purple-600 font-bold mt-2 inline-block">Kontakt aufnehmen &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

export const BrizyMigrator: React.FC = () => {
  const [rawHtml, setRawHtml] = useState<string>(DEFAULT_BRIZY_SAMPLE);
  const [rawCss, setRawCss] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('sample_brizy_export.html');

  const [parseResult, setParseResult] = useState<BrizyParseResult | null>(null);
  const [editableIr, setEditableIr] = useState<BrizyIRTree | null>(null);

  // Multi-Page & Animation Transpiler State
  const [multiPageProject, setMultiPageProject] = useState<BrizyMultiPageProject | null>(null);
  const [activePageFilename, setActivePageFilename] = useState<string>('index.html');
  const [detectedAnimations, setDetectedAnimations] = useState<BrizyAnimation[]>([]);
  const [animationCss, setAnimationCss] = useState<string>('');
  const [rewrittenLinksCount, setRewrittenLinksCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'ir' | 'html' | 'css' | 'diff' | 'assets' | 'sitemap' | 'animations'>('ir');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Config Panel & Decompiler Regelsatz state
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [customMappings, setCustomMappings] = useState<Array<{ pattern: string; role: any }>>([
    { pattern: 'brz-css-hero', role: 'hero' },
    { pattern: 'feature-sec', role: 'features' },
  ]);
  const [newPattern, setNewPattern] = useState('');
  const [newRole, setNewRole] = useState<'hero' | 'header' | 'footer' | 'features' | 'cta' | 'content' | 'gallery' | 'navigation'>('content');

  // Decompiler Regelsatz module toggles
  const [optResolveAssets, setOptResolveAssets] = useState(true);
  const [optTranspileAnims, setOptTranspileAnims] = useState(true);
  const [optRewriteLinks, setOptRewriteLinks] = useState(true);
  const [optClassMappings, setOptClassMappings] = useState(true);

  // Diff Inspector state
  const [diffSliderPos, setDiffSliderPos] = useState<number>(50);
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'side-by-side' | 'clean-only' | 'original-only'>('split');

  // Trigger parsing pipeline
  const handleCleanAndExport = useCallback(() => {
    try {
      const mappingObj: Record<string, any> = {};
      if (optClassMappings) {
        customMappings.forEach((m) => {
          if (m.pattern.trim()) {
            mappingObj[m.pattern.trim()] = m.role;
          }
        });
      }

      const res = parseBrizyToIR(rawHtml, rawCss ? [rawCss] : [], {
        customClassMappings: mappingObj,
        resolveAssets: optResolveAssets,
        transpileAnimations: optTranspileAnims,
      });

      if (optRewriteLinks) {
        const { rewrittenHtml, rewrittenCount } = rewriteBrizyInternalLinks(res.cleanHtml);
        res.cleanHtml = rewrittenHtml;
        setRewrittenLinksCount(rewrittenCount);
      } else {
        setRewrittenLinksCount(0);
      }

      if (optTranspileAnims) {
        const { cleanHtml: animHtml, animations, animationCss: animCss } = transpileBrizyAnimations(res.cleanHtml);
        res.cleanHtml = animHtml;
        setDetectedAnimations(animations);
        setAnimationCss(animCss);
      } else {
        setDetectedAnimations([]);
        setAnimationCss('');
      }

      setParseResult(res);
      setEditableIr(res.ir);
    } catch (err) {
      console.error('Brizy parsing error:', err);
      alert('Fehler beim Parsen der Brizy-Dateien!');
    }
  }, [rawHtml, rawCss, customMappings, optResolveAssets, optTranspileAnims, optRewriteLinks, optClassMappings]);

  // Initial parse on load
  useEffect(() => {
    handleCleanAndExport();
  }, []);

  // Page Switcher handler for multi-page projects
  const handleSelectPage = (filename: string) => {
    setActivePageFilename(filename);
    if (multiPageProject) {
      const page = multiPageProject.pages.find((p) => p.filename === filename);
      if (page) {
        setRawHtml(page.originalHtml);
        setParseResult(page.parseResult);
        setEditableIr(page.parseResult.ir);
        setDetectedAnimations(page.detectedAnimations);
        setRewrittenLinksCount(page.rewrittenLinksCount);
      }
    }
  };

  // Re-orderer actions for IR Tree
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!editableIr) return;
    const newSections = [...editableIr.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    const updatedIr: BrizyIRTree = {
      ...editableIr,
      sections: newSections,
    };

    setEditableIr(updatedIr);
    rebuildFromIr(updatedIr);
  };

  const handleRoleChange = (index: number, newRole: any) => {
    if (!editableIr) return;
    const newSections = [...editableIr.sections];
    newSections[index] = {
      ...newSections[index],
      semanticRole: newRole,
    };

    const updatedIr: BrizyIRTree = {
      ...editableIr,
      sections: newSections,
    };

    setEditableIr(updatedIr);
    rebuildFromIr(updatedIr);
  };

  const handleDeleteSection = (index: number) => {
    if (!editableIr) return;
    const newSections = editableIr.sections.filter((_, i) => i !== index);

    const updatedIr: BrizyIRTree = {
      ...editableIr,
      sections: newSections,
      meta: {
        ...editableIr.meta,
        parsedSectionsCount: newSections.length,
      },
    };

    setEditableIr(updatedIr);
    rebuildFromIr(updatedIr);
  };

  const rebuildFromIr = (ir: BrizyIRTree) => {
    if (!parseResult) return;
    const { cleanHtml, cleanCss } = renderIRTreeToOutput(ir);
    const cleanedDomCount = (cleanHtml.match(/<[a-z1-6]+/gi) || []).length;

    setParseResult({
      ...parseResult,
      ir,
      cleanHtml,
      cleanCss,
      stats: {
        ...parseResult.stats,
        cleanedDomCount,
      },
    });
  };

  // Add Custom Mapping Rule
  const handleAddCustomMapping = () => {
    if (!newPattern.trim()) return;
    setCustomMappings((prev) => [...prev, { pattern: newPattern.trim(), role: newRole }]);
    setNewPattern('');
  };

  const handleRemoveCustomMapping = (idx: number) => {
    setCustomMappings((prev) => prev.filter((_, i) => i !== idx));
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setFileName(file.name);
    if (file.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const htmlFilesMap: Record<string, string> = {};
        const cssStrings: string[] = [];

        for (const relativePath of Object.keys(zip.files)) {
          if (relativePath.endsWith('.html') && !relativePath.startsWith('__MACOSX')) {
            const baseName = relativePath.split('/').pop() || relativePath;
            htmlFilesMap[baseName] = await zip.files[relativePath].async('string');
          } else if (relativePath.endsWith('.css') && !relativePath.startsWith('__MACOSX')) {
            const cssContent = await zip.files[relativePath].async('string');
            cssStrings.push(cssContent);
          }
        }

        const htmlKeys = Object.keys(htmlFilesMap);
        if (htmlKeys.length > 0) {
          const mappingObj: Record<string, any> = {};
          customMappings.forEach((m) => {
            if (m.pattern.trim()) mappingObj[m.pattern.trim()] = m.role;
          });

          // Process multi-page project
          const project = parseBrizyMultiPageZip(htmlFilesMap, cssStrings, {
            customClassMappings: mappingObj,
            resolveAssets: true,
          });

          setMultiPageProject(project);

          // Find index.html or first page
          const mainPage = project.pages.find((p) => p.filename === 'index.html') || project.pages[0];
          if (mainPage) {
            setActivePageFilename(mainPage.filename);
            setRawHtml(mainPage.originalHtml);
            setParseResult(mainPage.parseResult);
            setEditableIr(mainPage.parseResult.ir);
            setDetectedAnimations(mainPage.detectedAnimations);
            setRewrittenLinksCount(mainPage.rewrittenLinksCount);
          }
        } else {
          alert('Keine HTML-Datei im ZIP-Archiv gefunden!');
        }
      } catch (err) {
        console.error('ZIP Error:', err);
        alert('Fehler beim Entpacken der ZIP-Datei!');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          if (file.name.endsWith('.css')) {
            setRawCss(e.target.result);
          } else {
            setRawHtml(e.target.result);
            setMultiPageProject(null);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadZip = async () => {
    if (!parseResult) return;
    const zip = new JSZip();

    if (multiPageProject && multiPageProject.pages.length > 0) {
      // Export multi-page project
      multiPageProject.pages.forEach((page) => {
        zip.file(page.filename, page.parseResult.cleanHtml);
      });
      const cssFolder = zip.folder('css');
      cssFolder?.file('style.css', multiPageProject.sharedCss);

      if (multiPageProject.allAssets.length > 0) {
        const imgFolder = zip.folder('assets/images');
        for (const asset of multiPageProject.allAssets) {
          try {
            const resp = await fetch(asset.originalUrl, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              imgFolder?.file(asset.filename, blob);
            } else {
              imgFolder?.file(asset.filename, `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">${asset.filename}</text></svg>`);
            }
          } catch {
            imgFolder?.file(asset.filename, `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#475569">${asset.filename}</text></svg>`);
          }
        }
      }
    } else {
      // Export single-page project
      zip.file(activePageFilename || 'index.html', parseResult.cleanHtml);
      const cssFolder = zip.folder('css');
      cssFolder?.file('style.css', parseResult.cleanCss);

      if (parseResult.ir.resolvedAssets && parseResult.ir.resolvedAssets.length > 0) {
        const imgFolder = zip.folder('assets/images');
        for (const asset of parseResult.ir.resolvedAssets) {
          try {
            const resp = await fetch(asset.originalUrl, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              imgFolder?.file(asset.filename, blob);
            } else {
              imgFolder?.file(asset.filename, `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">${asset.filename}</text></svg>`);
            }
          } catch {
            imgFolder?.file(asset.filename, `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#475569">${asset.filename}</text></svg>`);
          }
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migrated_${fileName.replace(/\.[^/.]+$/, '')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Construct iframe srcDoc for Clean HTML with style embedded for previewing
  const cleanPreviewSrcDoc = parseResult
    ? parseResult.cleanHtml.replace(
        '</head>',
        `<style>${parseResult.cleanCss}</style></head>`
      )
    : '';

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-tg-light-border dark:border-tg-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
              <Zap className="text-purple-500" size={22} />
              Brizy Migration &amp; IR Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Cheerio AST Parser
            </span>
          </div>
          <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-1">
            Importiere ein Brizy-ZIP oder HTML/CSS. Generiere saubere IR-Trees, ordne Sections um und vergleiche das Ergebnis A/B.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showConfigPanel
                ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'bg-white dark:bg-[#1A1A1E] border-tg-light-border dark:border-tg-dark-border text-tg-light-text dark:text-tg-dark-text hover:border-purple-500/50'
            }`}
          >
            <Sliders size={15} />
            <span>Class Mappings ({customMappings.length})</span>
          </button>

          <button
            onClick={handleCleanAndExport}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Clean &amp; Export ausführen</span>
          </button>
        </div>
      </div>

      {/* Interactive Custom Class Mapping Configuration Panel */}
      {showConfigPanel && (
        <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Settings size={14} />
              Benutzerdefinierte Klassen-Regeln (Custom Brizy Class Mappings)
            </span>
            <span className="text-[11px] text-tg-light-hint">
              Klassenmuster auf spezifische semantische Section-Rollen abbilden
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="z.B. .custom-header-sec oder brz-css-hero"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="md:col-span-6 p-2 rounded-lg bg-white dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="md:col-span-4 p-2 rounded-lg bg-white dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 capitalize"
            >
              <option value="hero">Hero Section</option>
              <option value="header">Header Navigation</option>
              <option value="features">Features Grid</option>
              <option value="cta">Call to Action (CTA)</option>
              <option value="footer">Footer</option>
              <option value="content">Content</option>
              <option value="gallery">Gallery</option>
            </select>
            <button
              onClick={handleAddCustomMapping}
              className="md:col-span-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Hinzufügen</span>
            </button>
          </div>

          {customMappings.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {customMappings.map((m, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border text-xs flex items-center gap-2"
                >
                  <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">{m.pattern}</code>
                  <span className="text-tg-light-hint">→</span>
                  <span className="capitalize font-semibold text-xs">{m.role}</span>
                  <button
                    onClick={() => handleRemoveCustomMapping(idx)}
                    className="text-red-500 hover:text-red-600 ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drag and Drop File Import Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-tg-light-border dark:border-tg-dark-border bg-white dark:bg-[#1A1A1E] hover:border-purple-500/50'
        }`}
      >
        <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Upload size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text">
            Brizy ZIP-Archiv oder HTML/CSS Dateien hierher ziehen
          </p>
          <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint">
            Unterstützt <code className="font-mono">.zip</code>, <code className="font-mono">.html</code> &amp; <code className="font-mono">.css</code> Exporte
          </p>
        </div>

        <label className="mt-0.5 px-3 py-1 rounded-xl bg-tg-light-bg dark:bg-[#111111] hover:bg-black/5 dark:hover:bg-white/10 border border-tg-light-border dark:border-tg-dark-border text-xs font-semibold cursor-pointer transition-colors">
          Datei auswählen
          <input type="file" accept=".zip,.html,.htm,.css" onChange={handleFileInput} className="hidden" />
        </label>

        {fileName && (
          <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md flex items-center gap-1 mt-1">
            <CheckCircle2 size={12} />
            Geladen: {fileName}
          </span>
        )}
      </div>

      {/* Input Code Editors (HTML & Raw CSS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border">
          <span className="text-xs font-semibold text-tg-light-text dark:text-tg-dark-text flex items-center gap-1.5">
            <FileCode size={14} className="text-purple-500" />
            Brizy HTML Input
          </span>
          <textarea
            value={rawHtml}
            onChange={(e) => setRawHtml(e.target.value)}
            placeholder="Brizy HTML Quellcode..."
            className="w-full h-32 p-2.5 rounded-lg bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none custom-scrollbar"
          />
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border">
          <span className="text-xs font-semibold text-tg-light-text dark:text-tg-dark-text flex items-center gap-1.5">
            <Code2 size={14} className="text-blue-500" />
            Zusätzliches Brizy CSS (Optional)
          </span>
          <textarea
            value={rawCss}
            onChange={(e) => setRawCss(e.target.value)}
            placeholder="Ggf. externes Brizy CSS hier einfügen..."
            className="w-full h-32 p-2.5 rounded-lg bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none custom-scrollbar"
          />
        </div>
      </div>

      {/* Decompiler Regelsatz Control & Execution Trigger Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/10 via-purple-600/10 to-indigo-900/10 border border-purple-500/30 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Settings className="text-purple-500 shrink-0" size={18} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider flex items-center gap-2">
                Decompiler Regelsatz &amp; Konfiguration
              </span>
              <span className="text-[11px] text-tg-light-hint">
                Wähle die aktiven Decompiler-Regeln für das Parsen des oben eingegebenen Quellcodes:
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 self-start sm:self-auto bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 transition-all"
          >
            <Sliders size={13} />
            <span>Class Mappings anpassen ({customMappings.length})</span>
          </button>
        </div>

        {/* Rule Module Selector Badges / Checkboxes */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            optClassMappings 
              ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold' 
              : 'bg-white/50 dark:bg-[#111111]/50 border-tg-light-border dark:border-tg-dark-border text-tg-light-hint opacity-60'
          }`}>
            <input 
              type="checkbox" 
              checked={optClassMappings} 
              onChange={(e) => setOptClassMappings(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>Custom Class Mappings ({customMappings.length} Regeln)</span>
          </label>

          <label className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            optResolveAssets 
              ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold' 
              : 'bg-white/50 dark:bg-[#111111]/50 border-tg-light-border dark:border-tg-dark-border text-tg-light-hint opacity-60'
          }`}>
            <input 
              type="checkbox" 
              checked={optResolveAssets} 
              onChange={(e) => setOptResolveAssets(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>Image Asset Resolver</span>
          </label>

          <label className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            optTranspileAnims 
              ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold' 
              : 'bg-white/50 dark:bg-[#111111]/50 border-tg-light-border dark:border-tg-dark-border text-tg-light-hint opacity-60'
          }`}>
            <input 
              type="checkbox" 
              checked={optTranspileAnims} 
              onChange={(e) => setOptTranspileAnims(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>Motion Presets Transpiler</span>
          </label>

          <label className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            optRewriteLinks 
              ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold' 
              : 'bg-white/50 dark:bg-[#111111]/50 border-tg-light-border dark:border-tg-dark-border text-tg-light-hint opacity-60'
          }`}>
            <input 
              type="checkbox" 
              checked={optRewriteLinks} 
              onChange={(e) => setOptRewriteLinks(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>WP Permalinks Rewriter</span>
          </label>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCleanAndExport}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.99] transition-all cursor-pointer border border-purple-400/30"
          >
            <Play size={18} className="fill-white" />
            <span>Prozess auf Basis des Decompiler-Regelsatzes starten</span>
          </button>

          <span className="text-[11px] font-mono text-tg-light-hint text-center sm:text-right">
            Cheerio AST Pipeline &bull; Bereinigt Brizy Wrapper &amp; generiert IR
          </span>
        </div>
      </div>

      {/* Output & IR Inspection Studio */}
      {parseResult && editableIr && (
        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border shadow-sm">
          
          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-tg-light-hint">Erkannte Sections</span>
              <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                {editableIr.sections.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-tg-light-hint">Gereinigte DOM-Knoten</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {parseResult.stats.cleanedDomCount} <span className="text-xs font-normal text-tg-light-hint">(vs {parseResult.stats.originalDomCount})</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-tg-light-hint">Gelöschte brz-* Klassen</span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                {parseResult.stats.purgedClassesCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-tg-light-hint">Unwrapped Containers</span>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {parseResult.stats.unwrappedContainersCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-tg-light-hint">Lokale Image Assets</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                {parseResult.stats.resolvedAssetsCount}
              </span>
            </div>
          </div>

          {/* Multi-Page Toolbar / Page Switcher (if multi-page ZIP loaded) */}
          {multiPageProject && multiPageProject.pages.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text flex items-center gap-1.5">
                    Multi-Page Projekt ({multiPageProject.pages.length} Seiten)
                  </span>
                  <span className="text-[11px] text-tg-light-hint">
                    Shared CSS &amp; globale WP Link-Umschreibung aktiv
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {multiPageProject.pages.map((p) => (
                  <button
                    key={p.filename}
                    onClick={() => handleSelectPage(p.filename)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                      activePageFilename === p.filename
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'bg-white dark:bg-[#111111] text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text border border-tg-light-border dark:border-tg-dark-border'
                    }`}
                  >
                    <FileText size={12} />
                    <span>{p.filename}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs for Output */}
          <div className="flex flex-wrap items-center justify-between border-b border-tg-light-border dark:border-tg-dark-border pb-3 gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('ir')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'ir'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <FileJson size={14} />
                <span>IR Tree &amp; Re-Orderer</span>
              </button>

              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'diff'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <Columns size={14} />
                <span>A/B Diff &amp; Live Preview</span>
              </button>

              <button
                onClick={() => setActiveTab('html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'html'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <FileCode size={14} />
                <span>Clean HTML5</span>
              </button>

              <button
                onClick={() => setActiveTab('css')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'css'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <Code2 size={14} />
                <span>Refactored style.css</span>
              </button>

              <button
                onClick={() => setActiveTab('sitemap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'sitemap'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <Globe size={14} />
                <span>Sitemap &amp; Links ({multiPageProject ? multiPageProject.pages.length : 1})</span>
              </button>

              <button
                onClick={() => setActiveTab('animations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'animations'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <Film size={14} />
                <span>Motion Presets ({detectedAnimations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('assets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'assets'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                }`}
              >
                <ImageIcon size={14} />
                <span>Assets ({parseResult.stats.resolvedAssetsCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopy(
                    activeTab === 'ir'
                      ? JSON.stringify(editableIr, null, 2)
                      : activeTab === 'html'
                      ? parseResult.cleanHtml
                      : parseResult.cleanCss,
                    activeTab
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-xs font-semibold flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {copiedType === activeTab ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Kopieren</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadZip}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Archive size={14} />
                <span>ZIP Export</span>
              </button>
            </div>
          </div>

          {/* TAB 1: IR TREE & INTERACTIVE RE-ORDERER */}
          {activeTab === 'ir' && (
            <div className="flex flex-col gap-4">
              
              {/* Interactive Section Re-Orderer List */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border">
                <div className="flex items-center justify-between pb-2 border-b border-tg-light-border dark:border-tg-dark-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Layers size={14} />
                    Interaktiver IR Section &amp; Component Re-Orderer
                  </span>
                  <span className="text-[11px] text-tg-light-hint">
                    Sections umordnen, Rollen ändern oder löschen — HTML wird in Echtzeit aktualisiert.
                  </span>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  {editableIr.sections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>

                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text flex items-center gap-2">
                            {sec.content ? `"${sec.content.substring(0, 35)}..."` : `Section <${sec.tag}>`}
                          </span>
                          <span className="text-[10px] text-tg-light-hint">
                            Klassen: {sec.cleanClasses.join(', ') || 'keine'} | Kinder: {sec.children.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Selector */}
                        <select
                          value={sec.semanticRole || 'content'}
                          onChange={(e) => handleRoleChange(idx, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-xs font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="hero">Hero</option>
                          <option value="header">Header</option>
                          <option value="features">Features</option>
                          <option value="cta">CTA</option>
                          <option value="footer">Footer</option>
                          <option value="content">Content</option>
                          <option value="gallery">Gallery</option>
                        </select>

                        {/* Move Up/Down */}
                        <button
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-tg-light-hint hover:text-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Nach oben verschieben"
                        >
                          <ArrowUp size={13} />
                        </button>

                        <button
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === editableIr.sections.length - 1}
                          className="p-1.5 rounded-lg bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border text-tg-light-hint hover:text-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Nach unten verschieben"
                        >
                          <ArrowDown size={13} />
                        </button>

                        {/* Delete Section */}
                        <button
                          onClick={() => handleDeleteSection(idx)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title="Section löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Monaco Editor */}
              <div className="rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border h-72">
                <Editor
                  height="100%"
                  language="json"
                  value={JSON.stringify(editableIr, null, 2)}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: A/B DIFF & VISUAL REGRESSION INSPECTOR */}
          {activeTab === 'diff' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text">Ansichts-Modus:</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border">
                    <button
                      onClick={() => setDiffViewMode('split')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        diffViewMode === 'split' ? 'bg-purple-600 text-white' : 'text-tg-light-hint'
                      }`}
                    >
                      Split Slider
                    </button>
                    <button
                      onClick={() => setDiffViewMode('side-by-side')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        diffViewMode === 'side-by-side' ? 'bg-purple-600 text-white' : 'text-tg-light-hint'
                      }`}
                    >
                      Nebeneinander
                    </button>
                    <button
                      onClick={() => setDiffViewMode('clean-only')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        diffViewMode === 'clean-only' ? 'bg-purple-600 text-white' : 'text-tg-light-hint'
                      }`}
                    >
                      Nur Clean Output
                    </button>
                  </div>
                </div>

                {diffViewMode === 'split' && (
                  <div className="flex items-center gap-2 w-full sm:w-64">
                    <span className="text-[11px] text-tg-light-hint font-mono">0% (Orig)</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={diffSliderPos}
                      onChange={(e) => setDiffSliderPos(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <span className="text-[11px] text-tg-light-hint font-mono">100% (Clean)</span>
                  </div>
                )}
              </div>

              {/* Render Area */}
              {diffViewMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                  <div className="flex flex-col rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border bg-white dark:bg-[#111111]">
                    <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs border-b border-red-500/20 flex justify-between">
                      <span>Original Brizy Layout</span>
                      <span className="font-mono text-[10px]">{parseResult.stats.originalDomCount} DOM Knoten</span>
                    </div>
                    <iframe
                      title="Original Brizy"
                      srcDoc={rawHtml}
                      className="w-full h-full border-none"
                    />
                  </div>

                  <div className="flex flex-col rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border bg-white dark:bg-[#111111]">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border-b border-emerald-500/20 flex justify-between">
                      <span>Bereinigter HTML5 Output</span>
                      <span className="font-mono text-[10px]">{parseResult.stats.cleanedDomCount} DOM Knoten (-{parseResult.stats.sizeReductionPercent}%)</span>
                    </div>
                    <iframe
                      title="Clean HTML5"
                      srcDoc={cleanPreviewSrcDoc}
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              ) : diffViewMode === 'split' ? (
                <div className="relative h-[500px] rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border bg-white dark:bg-[#111111]">
                  {/* Clean Output Layer */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${diffSliderPos}%` }}
                  >
                    <iframe
                      title="Clean HTML5 Split"
                      srcDoc={cleanPreviewSrcDoc}
                      className="w-[1000px] h-[500px] border-none"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-purple-600 text-white font-bold text-[10px] shadow-md">
                      Clean Output ({diffSliderPos}%)
                    </div>
                  </div>

                  {/* Original Brizy Layer */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ left: `${diffSliderPos}%`, width: `${100 - diffSliderPos}%` }}
                  >
                    <div className="w-[1000px] h-[500px] relative" style={{ marginLeft: `-${diffSliderPos}%` }}>
                      <iframe
                        title="Original Brizy Split"
                        srcDoc={rawHtml}
                        className="w-full h-full border-none pointer-events-auto"
                      />
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 text-white font-bold text-[10px] shadow-md">
                      Original Brizy
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-purple-500 shadow-lg pointer-events-none"
                    style={{ left: `${diffSliderPos}%` }}
                  />
                </div>
              ) : (
                <div className="h-[500px] rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border">
                  <iframe
                    title="Clean Output Only"
                    srcDoc={cleanPreviewSrcDoc}
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLEAN HTML VIEW */}
          {activeTab === 'html' && (
            <div className="rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border h-96">
              <Editor
                height="100%"
                language="html"
                value={parseResult.cleanHtml}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  wordWrap: 'on',
                }}
              />
            </div>
          )}

          {/* TAB 4: REFACTORED CSS VIEW */}
          {activeTab === 'css' && (
            <div className="rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border h-96">
              <Editor
                height="100%"
                language="css"
                value={parseResult.cleanCss}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  wordWrap: 'on',
                }}
              />
            </div>
          )}

          {/* TAB 5: RESOLVED ASSETS LIST */}
          {activeTab === 'assets' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-tg-light-hint">
                Erkannte externe Bildquellen, die in lokale relative Pfade (<code className="font-mono">./assets/images/...</code>) umgewandelt wurden:
              </span>

              {parseResult.ir.resolvedAssets && parseResult.ir.resolvedAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {parseResult.ir.resolvedAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-2"
                    >
                      <div className="w-full h-28 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <img
                          src={asset.originalUrl}
                          alt={asset.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono truncate">
                          {asset.filename}
                        </span>
                        <span className="text-[10px] text-tg-light-hint font-mono truncate" title={asset.originalUrl}>
                          Original: {asset.originalUrl}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          Mapped to: {asset.localPath}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-tg-light-hint rounded-xl bg-tg-light-bg dark:bg-[#111111]">
                  Keine externen Bild-URLs im HTML-Quellcode gefunden.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: MULTI-PAGE SITEMAP & LINK REWRITER */}
          {activeTab === 'sitemap' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Globe size={14} />
                  Multi-Page &amp; Sitemap Navigation Migrator
                </span>
                <p className="text-xs text-tg-light-hint">
                  Liest mehrseitige Brizy-Projekte aus ZIP-Archiven, generiert eine gemeinsame globale <code className="font-mono text-purple-500">style.css</code> und wandelt interne WordPress/Brizy-Verlinkungen in saubere relative Pfade um.
                </p>
              </div>

              {multiPageProject ? (
                <div className="flex flex-col gap-4">
                  {/* Pages Table */}
                  <div className="p-4 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-tg-light-hint flex items-center gap-1.5">
                      <FolderTree size={14} />
                      Erkannte Unterseiten im ZIP-Projekt ({multiPageProject.pages.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {multiPageProject.pages.map((page) => (
                        <div
                          key={page.filename}
                          className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                            activePageFilename === page.filename
                              ? 'bg-purple-500/10 border-purple-500/50 shadow-sm'
                              : 'bg-white dark:bg-[#1A1A1E] border-tg-light-border dark:border-tg-dark-border hover:border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                              <FileText size={14} />
                              {page.filename}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              {page.slug}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-tg-light-hint font-mono">
                            <span>DOM: {page.parseResult.stats.cleanedDomCount} Knoten</span>
                            <span>Links umgeschrieben: {page.rewrittenLinksCount}</span>
                            <span>Assets: {page.parseResult.stats.resolvedAssetsCount}</span>
                          </div>

                          <button
                            onClick={() => handleSelectPage(page.filename)}
                            className="mt-1 w-full py-1.5 rounded-lg bg-tg-light-bg dark:bg-[#111111] hover:bg-purple-600 hover:text-white border border-tg-light-border dark:border-tg-dark-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Eye size={12} />
                            <span>Im Editor &amp; Diff laden</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-2">
                    <span className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text flex items-center gap-1.5">
                      <Link size={14} className="text-purple-500" />
                      Interne WordPress / Brizy Link-Umschreibung (Aktuelle Seite)
                    </span>
                    <span className="text-xs text-tg-light-hint">
                      In dieser Datei wurden <strong className="text-purple-600 dark:text-purple-400">{rewrittenLinksCount}</strong> WordPress/Brizy Permalinks (z.B. <code className="font-mono text-purple-500">/kontakt/</code> oder <code className="font-mono text-purple-500">http://domain.com/uber-uns/</code>) in saubere relative Pfade (<code className="font-mono text-emerald-500">kontakt.html</code>) konvertiert.
                    </span>
                  </div>

                  <div className="p-6 text-center text-xs text-tg-light-hint rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col items-center gap-2">
                    <FolderTree size={28} className="text-purple-500 opacity-60" />
                    <span>Lade ein ZIP-Archiv mit mehreren <code className="font-mono">.html</code> Dateien hoch, um das vollständige Multi-Page Sitemap Projekt zu analysieren.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: MOTION PRESETS TRANSPILER */}
          {activeTab === 'animations' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Film size={14} />
                  Brizy Motion Presets &amp; Framer Motion Transpiler
                </span>
                <p className="text-xs text-tg-light-hint">
                  Erkennt schwere Brizy-Scrollanimationen (<code className="font-mono text-purple-500">data-brz-animate</code>) und wandelt sie automatisch in native CSS3 Keyframes oder Framer Motion React-Presets um. Beseitigt bis zu 180 KB Builder-JavaScript!
                </p>
              </div>

              {/* Animation Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-tg-light-hint">Erkannte Scroll-Animationen</span>
                  <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Play size={16} />
                    {detectedAnimations.length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-tg-light-hint">Eingespartes Brizy JS Bundle</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ~185 KB (100%)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-tg-light-hint">Animation Engine</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                    CSS @keyframes + IntersectionObserver
                  </span>
                </div>
              </div>

              {/* Detected Animations Grid */}
              {detectedAnimations.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-tg-light-hint">
                    Konvertierte Motion Presets ({detectedAnimations.length})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detectedAnimations.map((anim) => (
                      <div
                        key={anim.id}
                        className="p-3.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase">
                            {anim.type}
                          </span>
                          <span className="text-[10px] font-mono text-tg-light-hint">
                            Dauer: {anim.duration} | Delay: {anim.delay}
                          </span>
                        </div>

                        <div className="text-xs text-tg-light-hint font-mono bg-black/5 dark:bg-white/5 p-2 rounded truncate">
                          Tag: &lt;{anim.targetTag}&gt; &mdash; "{anim.targetContent || 'Element Content'}"
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-tg-light-border dark:border-tg-dark-border">
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            Framer Motion Equivalent Ready
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(anim.framerMotionJsx, `framer-${anim.id}`)
                            }
                            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {copiedType === `framer-${anim.id}` ? (
                              <span className="text-emerald-500 font-bold">Kopiert!</span>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Framer Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transpiled CSS Keyframe Code Inspector */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-tg-light-hint">
                      Generierte Animation CSS Keyframes
                    </span>
                    <div className="rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border h-64">
                      <Editor
                        height="100%"
                        language="css"
                        value={animationCss || `/* Keine Animationen in der aktuellen Datei gefunden */`}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 12,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-tg-light-hint rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col items-center gap-2">
                  <Film size={28} className="text-purple-500 opacity-60" />
                  <span>Keine Brizy Animationen (<code className="font-mono">data-brz-animate</code>) im aktuellen Quellcode erkannt.</span>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default BrizyMigrator;
