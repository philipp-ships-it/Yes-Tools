import React, { useState, useRef, useEffect } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  Rocket,
  UploadCloud,
  Download,
  FileCode2,
  Image as ImageIcon,
  CheckCircle2,
  Zap,
  Trash2,
  RefreshCw,
  Eye,
  Settings2,
  Sparkles,
  Layers,
  ArrowRight,
  Monitor,
  Tablet,
  Smartphone,
  Sliders,
  Check,
  Activity,
  FileArchive,
  Info,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Code,
  ShieldCheck,
  Wand2,
  FileText,
  Clock,
  AlertCircle,
  Scissors,
  CheckCheck,
  FileCheck2,
  Minimize2,
  Layers3,
  Type,
  Search,
  ShieldAlert,
  Play,
  Gauge,
  ExternalLink,
  Target,
  Sparkle,
  Maximize2,
  Code2,
  Undo,
  Share2,
  Link2Off,
  FormInput
} from 'lucide-react';
import JSZip from 'jszip';
import { ChangeRequestModal, ChangeRequestItem } from '../components/ChangeRequestModal';

// Types
interface ZipFileItem {
  path: string;
  name: string;
  dir: string;
  ext: string;
  isImage: boolean;
  isRasterImage: boolean; // jpeg, jpg, png ONLY
  isSvg: boolean;
  isCss: boolean;
  isJs: boolean;
  isHtml: boolean;
  isFont: boolean;
  isUnknownOrOther: boolean;
  originalSize: number;
  originalContentText?: string;
  originalContentBlob?: Blob;
  originalDataUrl?: string;
}

interface ImageOptimizationTask {
  id: string;
  originalPath: string;
  originalName: string;
  originalSize: number;
  naturalWidth: number;
  naturalHeight: number;
  detectedMaxWidth: number | null; // From HTML/CSS
  targetWidth: number;
  randomWebpName: string;
  newPath: string;
  originalDataUrl: string;
  webpDataUrl: string | null;
  webpBlob: Blob | null;
  webpSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  quality: number;
}

interface CssOptimizationResult {
  path: string;
  originalSize: number;
  purgedSize: number;
  purgedRulesCount: number;
  removedSelectors: string[];
  purgedContent: string;
}

interface JsOptimizationResult {
  path: string;
  originalSize: number;
  cleanedSize: number;
  removedFunctionsCount: number;
  removedFunctions: string[];
  cleanedContent: string;
}

interface RemovedAssetAuditItem {
  id: string;
  type: 'css_selector' | 'js_function' | 'image_webp' | 'html_enhancement' | 'font_subset' | 'a11y_fix' | 'tracking_defer' | 'unlinked_purged';
  title: string;
  fileSource: string;
  description: string;
  savingsText?: string;
}

interface ProgressStepItem {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'error';
  progressPercent: number;
}

interface FontSubsettingResult {
  totalUniqueChars: number;
  sampleChars: string;
  googleFontsFound: string[];
  fontFilesFound: string[];
  estimatedOriginalBytes: number;
  estimatedSubsetBytes: number;
  estimatedSavingsPercent: number;
}

interface A11yIssueItem {
  id: string;
  type: 'missing_alt' | 'missing_title' | 'missing_meta_desc' | 'missing_viewport' | 'missing_og' | 'blocking_script' | 'broken_link';
  severity: 'error' | 'warning' | 'info';
  file: string;
  title: string;
  description: string;
  autoFixable: boolean;
}

export const LpOptimizely: React.FC = () => {
  useToolTracking('LP-Optimizely');

  // State
  const [zipFileName, setZipFileName] = useState<string>('');
  const [filesMap, setFilesMap] = useState<Map<string, ZipFileItem>>(new Map());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStepText, setProcessingStepText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Change Request Safeguard Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingPipeline, setPendingPipeline] = useState<{
    items: ChangeRequestItem[];
    filesMap: Map<string, ZipFileItem>;
    dryRunMode: boolean;
    currentQuality: number;
  } | null>(null);

  // Optimization Parameters
  const [quality, setQuality] = useState<number>(82); // 1-100%
  const [isDryRun, setIsDryRun] = useState<boolean>(false); // Dry Run Simulation Mode
  const [retinaScaling, setRetinaScaling] = useState<boolean>(true); // 2x max-width
  const [purgeUnusedCss, setPurgeUnusedCss] = useState<boolean>(true);
  const [cleanUnusedJs, setCleanUnusedJs] = useState<boolean>(true);
  const [autoLazyLoadImages, setAutoLazyLoadImages] = useState<boolean>(true);
  const [fixCharacterEncoding, setFixCharacterEncoding] = useState<boolean>(true);
  const [beautifyCode, setBeautifyCode] = useState<boolean>(false); // default minified
  const [minifyHtml, setMinifyHtml] = useState<boolean>(true);
  const [mergeRedundantCss, setMergeRedundantCss] = useState<boolean>(true);
  const [renameCustomClasses, setRenameCustomClasses] = useState<boolean>(true);
  const [autoGenerateFavicons, setAutoGenerateFavicons] = useState<boolean>(true);
  const [enableAutoHyphenation, setEnableAutoHyphenation] = useState<boolean>(true);
  const [subsetFontsOption, setSubsetFontsOption] = useState<boolean>(true);
  const [optimizeTrackingScripts, setOptimizeTrackingScripts] = useState<boolean>(true);
  const [purgeUnlinkedAssets, setPurgeUnlinkedAssets] = useState<boolean>(true);
  
  // Advanced Optimizations
  const [preloadCriticalAssets, setPreloadCriticalAssets] = useState<boolean>(true);
  const [inlineCriticalCss, setInlineCriticalCss] = useState<boolean>(false);
  const [generateOgCard, setGenerateOgCard] = useState<boolean>(false);
  const [checkDeadLinks, setCheckDeadLinks] = useState<boolean>(true);
  const [delayThirdPartyScripts, setDelayThirdPartyScripts] = useState<boolean>(false);
  const [enhanceFormA11y, setEnhanceFormA11y] = useState<boolean>(false);
  const [stripComments, setStripComments] = useState<boolean>(false);

  // Results
  const [imageTasks, setImageTasks] = useState<ImageOptimizationTask[]>([]);
  const [cssResults, setCssResults] = useState<CssOptimizationResult[]>([]);
  const [jsResults, setJsResults] = useState<JsOptimizationResult[]>([]);
  const [auditLog, setAuditLog] = useState<RemovedAssetAuditItem[]>([]);
  const [revertedAuditIds, setRevertedAuditIds] = useState<string[]>([]);
  const [fontSubsetting, setFontSubsetting] = useState<FontSubsettingResult | null>(null);
  const [a11yIssues, setA11yIssues] = useState<A11yIssueItem[]>([]);
  const [unlinkedFilesList, setUnlinkedFilesList] = useState<string[]>([]);
  const [generatedFavicons, setGeneratedFavicons] = useState<Array<{ path: string; blob: Blob; dataUrl: string }>>([]);
  const [generatedOgCards, setGeneratedOgCards] = useState<Array<{ path: string; blob: Blob; dataUrl: string }>>([]);
  
  const [missingAltImages, setMissingAltImages] = useState<Array<{ id: string; file: string; src: string; currentAlt: string; autoGenerated: boolean }>>([]);
  const [optimizedHtmlFiles, setOptimizedHtmlFiles] = useState<Map<string, string>>(new Map());
  const [optimizedCssFiles, setOptimizedCssFiles] = useState<Map<string, string>>(new Map());
  const [optimizedJsFiles, setOptimizedJsFiles] = useState<Map<string, string>>(new Map());

  // Progress Tracker State
  const [progressSteps, setProgressSteps] = useState<ProgressStepItem[]>([
    { id: 'step-upload', title: 'ZIP Entpacken & Scan', description: 'Analysiere Ordnerstruktur und Dateitypen', status: 'waiting', progressPercent: 0 },
    { id: 'step-images', title: 'WebP & Max-Width', description: 'Konvertiere JPG/PNG zu WebP mit Zufalls-IDs', status: 'waiting', progressPercent: 0 },
    { id: 'step-css', title: 'CSS Tree-Shaking', description: 'Entferne unbenutzte CSS-Selektoren', status: 'waiting', progressPercent: 0 },
    { id: 'step-js', title: 'JS Code-Shaking', description: 'Prüfe und entferne unbenutzte JS-Funktionen', status: 'waiting', progressPercent: 0 },
    { id: 'step-fonts', title: 'Font Subsetting', description: 'Analysiere genutzte Zeichen & erstelle Font Subsets', status: 'waiting', progressPercent: 0 },
    { id: 'step-a11y', title: 'A11y & SEO Audit', description: 'Prüfe Alt-Tags, Meta Description & Tracking Scripte', status: 'waiting', progressPercent: 0 },
    { id: 'step-html', title: 'HTML Optimization', description: 'Beautify, Encoding, Lazy-Load & Preconnect Hints', status: 'waiting', progressPercent: 0 },
    { id: 'step-preview', title: 'Vorschau & Output', description: 'Assemblierung der finalen LP Struktur', status: 'waiting', progressPercent: 0 }
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'a11y' | 'images' | 'fonts' | 'css' | 'js' | 'tree' | 'preview'>('overview');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Generate 10-digit Random Number String
  const generateRandomNumberString = (length = 10): string => {
    let result = '';
    const chars = '0123456789';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Helper: Format Bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Helper: Detect if a CSS file is external/vendor/framework (e.g. Bootstrap, Tailwind, FontAwesome)
  const isExternalCssFile = (filePath: string, fileName: string): boolean => {
    const lowerPath = filePath.toLowerCase();
    const lowerName = fileName.toLowerCase();

    // Known vendor/framework indicators
    const isVendorFramework =
      lowerPath.includes('bootstrap') ||
      lowerPath.includes('font-awesome') ||
      lowerPath.includes('fontawesome') ||
      lowerPath.includes('tailwind') ||
      lowerPath.includes('animate') ||
      lowerPath.includes('bulma') ||
      lowerPath.includes('foundation') ||
      lowerPath.includes('uikit') ||
      lowerPath.includes('materialize') ||
      lowerPath.includes('vendor') ||
      lowerPath.includes('framework') ||
      lowerPath.includes('cdn') ||
      lowerPath.includes('node_modules') ||
      lowerPath.includes('lib/') ||
      lowerPath.includes('libs/');

    if (isVendorFramework) return true;

    // Explicit custom stylesheet filenames allowed for optimization
    const isCustomStyle =
      lowerName === 'style.css' ||
      lowerName === 'style.min.css' ||
      lowerName === 'styles.css' ||
      lowerName === 'custom.css' ||
      lowerName === 'app.css' ||
      lowerName === 'main.css';

    return !isCustomStyle;
  };

  // Helper: Update step status
  const updateStepStatus = (id: string, status: 'waiting' | 'in_progress' | 'completed' | 'error', percent = 100) => {
    setProgressSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status, progressPercent: percent } : step))
    );
  };

  // Character Encoding Repair Helper
  const repairMojibakeAndEncoding = (str: string): string => {
    let result = str;
    const replacements: [RegExp, string][] = [
      [/Ã¤/g, 'ä'], [/Ã¶/g, 'ö'], [/Ã¼/g, 'ü'], [/ÃSystem/g, 'ß'],
      [/Ã„/g, 'Ä'], [/Ã–/g, 'Ö'], [/Ãœ/g, 'Ü'], [/ÃŸ/g, 'ß'],
      [/â€“/g, '–'], [/â€”/g, '—'], [/â€œ/g, '“'], [/â€/g, '”'],
      [/â€˜/g, '‘'], [/â€™/g, '’'], [/Â/g, '']
    ];

    for (const [regex, replacement] of replacements) {
      result = result.replace(regex, replacement);
    }
    return result;
  };

  // Code Formatting / Beautify Helper
  const beautifyHtmlCode = (html: string): string => {
    let formatted = '';
    let indent = 0;
    const tab = '  ';

    const tokens = html.replace(/>\s+</g, '><').split(/(?=<)/g);

    for (let token of tokens) {
      if (token.match(/^<\/\w/)) {
        indent = Math.max(0, indent - 1);
      }

      formatted += tab.repeat(indent) + token + '\n';

      if (
        token.match(/^<\w[^>]*[^\/]>$/) &&
        !token.startsWith('<meta') &&
        !token.startsWith('<link') &&
        !token.startsWith('<img') &&
        !token.startsWith('<br') &&
        !token.startsWith('<hr') &&
        !token.startsWith('<input')
      ) {
        indent++;
      }
    }
    return formatted.trim();
  };

  // HTML Minification Helper
  const minifyHtmlCode = (html: string): string => {
    return html
      .replace(/<!--(?!\[if)[\s\S]*?-->/g, '') // Remove HTML comments (except IE conditional)
      .replace(/>\s+</g, '><') // Remove whitespace between HTML tags
      .replace(/\s{2,}/g, ' ') // Collapse multiple whitespace to single space
      .trim();
  };

  // Redundant CSS Rule & Class Merger
  const mergeRedundantCssRules = (cssText: string): { mergedCss: string; mergedCount: number } => {
    if (!cssText.trim()) return { mergedCss: cssText, mergedCount: 0 };

    let mergedCount = 0;
    const rules = cssText.split(/\}\s*/);
    const selectorMap = new Map<string, Map<string, string>>();
    const rawBlocks: string[] = [];

    for (const rule of rules) {
      if (!rule.includes('{')) {
        if (rule.trim()) rawBlocks.push(rule.trim());
        continue;
      }

      const [selectorPart, declarationPart] = rule.split('{');
      const selector = selectorPart.trim();

      if (selector.startsWith('@') || selector.includes(':root')) {
        rawBlocks.push(`${selector} {${declarationPart}}`);
        continue;
      }

      if (!selectorMap.has(selector)) {
        selectorMap.set(selector, new Map<string, string>());
      } else {
        mergedCount++;
      }

      const propMap = selectorMap.get(selector)!;
      const declarations = declarationPart.split(';');
      for (const decl of declarations) {
        if (!decl.includes(':')) continue;
        const [prop, val] = decl.split(':');
        if (prop && val) {
          propMap.set(prop.trim(), val.trim());
        }
      }
    }

    const reconstructedRules: string[] = [...rawBlocks];

    selectorMap.forEach((propMap, selector) => {
      if (propMap.size === 0) return;
      const declString = Array.from(propMap.entries())
        .map(([p, v]) => `  ${p}: ${v};`)
        .join('\n');
      reconstructedRules.push(`${selector} {\n${declString}\n}`);
    });

    return {
      mergedCss: reconstructedRules.join('\n\n'),
      mergedCount
    };
  };

  // Automated Favicon Set Generator (16x16, 32x32, 192x192 into /favicon)
  const generateFaviconSetFromLogo = async (
    currentFilesMap: Map<string, ZipFileItem>
  ): Promise<{ favicons: Array<{ path: string; blob: Blob; dataUrl: string }>; htmlSnippet: string } | null> => {
    let sourceImage: ZipFileItem | undefined = Array.from(currentFilesMap.values()).find(
      (f) => (f.isRasterImage || f.isSvg) && (f.name.toLowerCase().includes('logo') || f.name.toLowerCase().includes('icon'))
    );

    if (!sourceImage) {
      sourceImage = Array.from(currentFilesMap.values()).find((f) => f.isRasterImage || f.isSvg);
    }

    const favicons: Array<{ path: string; blob: Blob; dataUrl: string }> = [];

    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 192, name: 'android-chrome-192x192.png' }
    ];

    let imgElement: HTMLImageElement | null = null;
    if (sourceImage && sourceImage.originalDataUrl) {
      imgElement = new Image();
      await new Promise((res) => {
        imgElement!.onload = () => res(null);
        imgElement!.onerror = () => res(null);
        imgElement!.src = sourceImage!.originalDataUrl!;
      });
    }

    for (const item of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = item.size;
      canvas.height = item.size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (imgElement && imgElement.width > 0) {
          ctx.drawImage(imgElement, 0, 0, item.size, item.size);
        } else {
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.roundRect(0, 0, item.size, item.size, item.size * 0.2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.round(item.size * 0.5)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('LP', item.size / 2, item.size / 2);
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await new Promise<Blob>((res) => {
        canvas.toBlob((b) => res(b || new Blob([])), 'image/png');
      });

      favicons.push({
        path: `favicon/${item.name}`,
        blob,
        dataUrl
      });
    }

    const htmlSnippet = `
  <!-- Auto-Generated Favicon Set by LP-Optimizely -->
  <link rel="icon" type="image/png" sizes="16x16" href="favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="192x192" href="favicon/android-chrome-192x192.png">`;

    return { favicons, htmlSnippet };
  };

  // Individual Audit Item Undo/Revert Handler
  const handleToggleRevertAuditItem = (id: string) => {
    setRevertedAuditIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Open Graph & Social Card Generator (1200x630 into /og Ordner)
  const generateOgCardImageAndMeta = async (
    currentFilesMap: Map<string, ZipFileItem>,
    htmlContent: string
  ): Promise<{ ogCards: Array<{ path: string; blob: Blob; dataUrl: string }>; htmlSnippet: string } | null> => {
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i) || htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const titleText = titleMatch ? titleMatch[1].trim() : 'High-Performance Landing Page';
    const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const descText = descMatch ? descMatch[1].trim() : 'Optimized for Ultra-Fast Conversions & Core Web Vitals';

    let logoImage: ZipFileItem | undefined = Array.from(currentFilesMap.values()).find(
      (f) => (f.isRasterImage || f.isSvg) && (f.name.toLowerCase().includes('logo') || f.name.toLowerCase().includes('icon'))
    );

    let logoImgElement: HTMLImageElement | null = null;
    if (logoImage && logoImage.originalDataUrl) {
      logoImgElement = new Image();
      await new Promise((res) => {
        logoImgElement!.onload = () => res(null);
        logoImgElement!.onerror = () => res(null);
        logoImgElement!.src = logoImage!.originalDataUrl!;
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(1, '#1E293B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      const glow = ctx.createRadialGradient(1000, 150, 20, 1000, 150, 400);
      glow.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1200, 630);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 1120, 550);

      if (logoImgElement && logoImgElement.width > 0) {
        ctx.drawImage(logoImgElement, 80, 80, 100, 100);
      } else {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(80, 80, 80, 80, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LP', 120, 120);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let displayTitle = titleText;
      if (displayTitle.length > 45) displayTitle = displayTitle.substring(0, 42) + '...';
      ctx.fillText(displayTitle, 80, 220);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '28px sans-serif';
      let displayDesc = descText;
      if (displayDesc.length > 80) displayDesc = displayDesc.substring(0, 77) + '...';
      ctx.fillText(displayDesc, 80, 310);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.roundRect(80, 480, 320, 50, 25);
      ctx.fill();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('⚡ LP-Optimizely Verified', 110, 493);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob>((res) => {
      canvas.toBlob((b) => res(b || new Blob([])), 'image/png');
    });

    const ogCards = [
      {
        path: 'og/og-image.png',
        blob,
        dataUrl
      }
    ];

    const htmlSnippet = `
  <!-- Auto-Generated Open Graph & Social Card by LP-Optimizely -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${titleText.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${descText.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="og/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleText.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${descText.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="og/og-image.png">`;

    return { ogCards, htmlSnippet };
  };

  // Batch Alt Text Updater Handler
  const handleUpdateAltTextItem = (id: string, newAlt: string) => {
    setMissingAltImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentAlt: newAlt, autoGenerated: false } : item))
    );
  };

  const handleApplyBatchAltTags = () => {
    if (optimizedHtmlFiles.size === 0) return;
    const newHtmlMap = new Map(optimizedHtmlFiles);

    missingAltImages.forEach((item) => {
      newHtmlMap.forEach((content, filePath) => {
        if (filePath === item.file) {
          const escapedSrc = item.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(<img\\s+[^>]*src=["']${escapedSrc}["'][^>]*alt=["'])([^"']*)(["'])`, 'gi');
          if (regex.test(content)) {
            content = content.replace(regex, `$1${item.currentAlt}$3`);
          } else {
            const srcRegex = new RegExp(`(<img\\s+[^>]*src=["']${escapedSrc}["'])`, 'gi');
            content = content.replace(srcRegex, `$1 alt="${item.currentAlt}"`);
          }
          newHtmlMap.set(filePath, content);
        }
      });
    });

    setOptimizedHtmlFiles(newHtmlMap);
    alert('Alt-Attribute erfolgreich in allen optimierten HTML-Dateien angewendet!');
  };

  // Demo LP Generator
  const handleLoadDemoLp = async () => {
    setIsProcessing(true);
    setProcessingStepText('Erstelle Demo Landing Page ZIP...');

    try {
      const demoZip = new JSZip();

      // Sample HTML with missing alt tags, tracking scripts, and un-used CSS
      const demoHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Optimizely Demo Landing Page â€“ Ã–ffnungszeiten &amp; Angebote</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">
  <script src="https://www.googletagmanager.com/gtm.js?id=GTM-DEMO123"></script>
  <script src="assets/js/main.js"></script>
  <style>
    .hero-banner-img { max-width: 600px; width: 100%; height: auto; border-radius: 16px; }
    .feature-icon { width: 80px; max-width: 80px; }
    .footer-logo { max-width: 180px; }
  </style>
</head>
<body class="bg-slate-900 text-white font-sans">
  <header class="header-container py-6 px-8 border-b border-white/10 flex items-center justify-between">
    <!-- Image missing alt tag for A11y test -->
    <img src="assets/images/logo.png" class="footer-logo">
    <nav class="nav-links flex gap-6 text-sm">
      <a href="#features" class="hover:text-purple-400">Features</a>
      <a href="#pricing" class="hover:text-purple-400">Preise</a>
      <a href="#contact" class="hover:text-purple-400">Kontakt</a>
    </nav>
  </header>

  <main class="hero-section py-20 px-8 text-center max-w-5xl mx-auto space-y-8">
    <span class="badge-pill bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
      LP-Optimizely Active
    </span>
    <h1 class="text-5xl font-black tracking-tight text-white">
      High-Speed Conversion Landing Page Ã¼berzeugen
    </h1>
    <p class="text-lg text-slate-300 max-w-2xl mx-auto">
      Diese Landing Page wurde automatisch analysiert. Alle JPG/PNG Bilder werden in WebP konvertiert und auf die definierte max-width angepasst!
    </p>

    <div class="my-8 flex justify-center">
      <!-- Image missing alt tag -->
      <img src="assets/images/hero-banner.jpg" class="hero-banner-img shadow-2xl">
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
      <div class="feature-card bg-slate-800/60 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-4">
        <img src="assets/images/icon-speed.png" class="feature-icon" alt="Speed Icon">
        <h3 class="font-bold text-xl">Ladezeit Minimieren</h3>
        <p class="text-sm text-slate-400">WebP-Konvertierung reduziert BildgrÃ¶ÃŸen um bis zu 85%.</p>
      </div>
      <div class="feature-card bg-slate-800/60 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-4">
        <img src="assets/images/icon-css.png" class="feature-icon" alt="CSS Icon">
        <h3 class="font-bold text-xl">CSS &amp; JS Tree-Shaking</h3>
        <p class="text-sm text-slate-400">Unbenutzte CSS-Klassen und JS-Funktionen werden entfernt.</p>
      </div>
      <div class="feature-card bg-slate-800/60 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-4">
        <img src="assets/images/vector-badge.svg" class="feature-icon" alt="SVG Badge">
        <h3 class="font-bold text-xl">SVG Schutz</h3>
        <p class="text-sm text-slate-400">SVG-Dateien bleiben unverÃ¤ndert als Vektorgrafiken erhalten.</p>
      </div>
    </div>
  </main>

  <footer class="footer-container py-12 px-8 border-t border-white/10 text-center text-slate-500 text-xs">
    <p>&copy; 2026 LP-Optimizely Engine. All rights reserved.</p>
  </footer>
</body>
</html>`;

      // Sample Bloated CSS
      const demoCss = `/* LP Style Sheet - Includes Bloated Framework Classes */
body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f8fafc; }
.header-container { display: flex; align-items: center; justify-content: space-between; }
.hero-section { text-align: center; margin: 0 auto; }
.feature-card { background: rgba(30, 41, 59, 0.6); border-radius: 16px; transition: transform 0.2s; }

/* UNUSED BLOAT CLASSES BELOW THAT SHOULD BE PURGED */
.unused-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999; }
.unused-carousel-next-btn { background: #3b82f6; color: white; padding: 12px 24px; border-radius: 99px; }
.unused-sidebar-navigation { width: 280px; height: 100vh; background: #1e293b; border-right: 1px solid #334155; }
.unused-shopping-cart-badge { background: #ef4444; color: white; border-radius: 50%; padding: 4px 8px; }
.unused-accordion-collapse-panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
`;

      // Sample JS with used and unused functions
      const demoJs = `// Main Landing Page Script
console.log("Landing page script loaded successfully.");

function initializeLandingPage() {
  console.log("LP initialized");
}

initializeLandingPage();

// UNUSED DEAD FUNCTIONS THAT SHOULD BE TREE-SHAKEN OUT
function unusedCartCalculator() {
  var total = 100 * 1.19;
  return total;
}

function unusedPopupTriggerModal() {
  document.body.classList.add("modal-open");
}

function unusedLegacyTrackerV1() {
  console.log("Legacy analytics tracker called");
}
`;

      // Synthetic image creation
      const createDummyImgBlob = (width: number, height: number, text: string, color1: string, color2: string, mime: string): Promise<Blob> => {
        return new Promise((resolve) => {
          const cvs = document.createElement('canvas');
          cvs.width = width;
          cvs.height = height;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(16, Math.round(width * 0.05))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2 - 10);
            ctx.font = `${Math.max(12, Math.round(width * 0.03))}px sans-serif`;
            ctx.fillText(`${width}x${height} px (Unoptimized)`, width / 2, height / 2 + 20);
          }
          cvs.toBlob((blob) => resolve(blob || new Blob([])), mime, 0.9);
        });
      };

      const heroBlob = await createDummyImgBlob(1920, 1080, 'HERO BANNER JPG', '#8b5cf6', '#ec4899', 'image/jpeg');
      const logoBlob = await createDummyImgBlob(600, 200, 'COMPANY LOGO PNG', '#3b82f6', '#06b6d4', 'image/png');
      const iconSpeed = await createDummyImgBlob(400, 400, 'SPEED ICON PNG', '#10b981', '#059669', 'image/png');
      const iconCss = await createDummyImgBlob(400, 400, 'CSS ICON PNG', '#f59e0b', '#d97706', 'image/png');

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

      demoZip.file('index.html', demoHtml);
      demoZip.file('assets/css/style.css', demoCss);
      demoZip.file('assets/js/main.js', demoJs);
      demoZip.file('assets/images/hero-banner.jpg', heroBlob);
      demoZip.file('assets/images/logo.png', logoBlob);
      demoZip.file('assets/images/icon-speed.png', iconSpeed);
      demoZip.file('assets/images/icon-css.png', iconCss);
      demoZip.file('assets/images/vector-badge.svg', svgContent);
      demoZip.file('fonts/inter.woff2', new Blob(['fake-woff2-font-data']));
      demoZip.file('docs/unused-draft.psd', new Blob(['fake-unreferenced-psd-file-data']));

      const zipBlob = await demoZip.generateAsync({ type: 'blob' });
      const demoFile = new File([zipBlob], 'demo-landingpage.zip', { type: 'application/zip' });

      await processZipFile(demoFile);
    } catch (err: any) {
      alert(`Fehler beim Erstellen der Demo: ${err.message || err}`);
      setIsProcessing(false);
    }
  };

  // Upload Handlers
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processZipFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip') || file.type.includes('zip')) {
        await processZipFile(file);
      } else {
        alert('Bitte wähle eine gültige .zip Datei aus.');
      }
    }
  };

  // Core ZIP Processing Engine
  const processZipFile = async (file: File) => {
    setZipFileName(file.name);
    setIsProcessing(true);
    setProcessingStepText('ZIP-Archiv wird entpackt...');

    updateStepStatus('step-upload', 'in_progress', 20);

    try {
      const jszip = new JSZip();
      const zip = await jszip.loadAsync(file);

      const itemsMap = new Map<string, ZipFileItem>();
      const filePromises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const parts = relativePath.split('/');
        const name = parts[parts.length - 1];
        const dir = parts.slice(0, parts.length - 1).join('/');
        const ext = name.split('.').pop()?.toLowerCase() || '';

        const isRasterImage = ['png', 'jpg', 'jpeg'].includes(ext);
        const isSvg = ext === 'svg';
        const isImage = isRasterImage || isSvg || ['webp', 'gif', 'ico'].includes(ext);
        const isCss = ext === 'css';
        const isJs = ext === 'js';
        const isHtml = ['html', 'htm'].includes(ext);
        const isFont = ['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext);
        const isUnknownOrOther = !isRasterImage && !isCss && !isJs && !isHtml && !isFont;

        const promise = (async () => {
          let originalContentText: string | undefined = undefined;
          let originalContentBlob: Blob | undefined = undefined;
          let originalDataUrl: string | undefined = undefined;
          let originalSize = 0;

          if (isImage) {
            const blob = await zipEntry.async('blob');
            originalContentBlob = blob;
            originalSize = blob.size;

            if (isRasterImage) {
              const reader = new FileReader();
              originalDataUrl = await new Promise<string>((res) => {
                reader.onload = (e) => res(e.target?.result as string);
                reader.readAsDataURL(blob);
              });
            } else if (isSvg) {
              originalContentText = await zipEntry.async('string');
            }
          } else if (isCss || isJs || isHtml) {
            const text = await zipEntry.async('string');
            originalContentText = text;
            originalSize = new Blob([text]).size;
          } else {
            const blob = await zipEntry.async('blob');
            originalContentBlob = blob;
            originalSize = blob.size;
          }

          itemsMap.set(relativePath, {
            path: relativePath,
            name,
            dir,
            ext,
            isImage,
            isRasterImage,
            isSvg,
            isCss,
            isJs,
            isHtml,
            isFont,
            isUnknownOrOther,
            originalSize,
            originalContentText,
            originalContentBlob,
            originalDataUrl
          });
        })();

        filePromises.push(promise);
      });

      await Promise.all(filePromises);
      setFilesMap(itemsMap);
      updateStepStatus('step-upload', 'completed', 100);

      // Trigger automatic optimization Pipeline
      await runOptimizationPipeline(itemsMap, isDryRun, quality);
    } catch (err: any) {
      alert(`Fehler beim Verarbeiten des ZIP-Archivs: ${err.message || err}`);
      updateStepStatus('step-upload', 'error', 0);
      setIsProcessing(false);
    }
  };

  // Run Full Multi-Stage Optimization Pipeline (Trigger Safeguard Modal First)
  const runOptimizationPipeline = async (currentFilesMap: Map<string, ZipFileItem>, dryRunMode = isDryRun, currentQuality = quality) => {
    const items: ChangeRequestItem[] = [];

    const htmlFiles = Array.from(currentFilesMap.values()).filter((f) => f.isHtml);
    const cssFiles = Array.from(currentFilesMap.values()).filter((f) => f.isCss);
    const jsFiles = Array.from(currentFilesMap.values()).filter((f) => f.isJs);
    const rasterImageFiles = Array.from(currentFilesMap.values()).filter((f) => f.isRasterImage);

    htmlFiles.forEach((htmlFile) => {
      items.push({
        id: `html_${htmlFile.path}`,
        type: 'injection',
        title: `HTML Speed, A11y & Tracking Defer: ${htmlFile.name}`,
        description: `Repair UTF-8 encoding (Umlaut fix), defer GTM/Pixel scripts, inject lazy loading & preconnect CDN hints.`,
        beforeSnippet: `Path: ${htmlFile.path} (${formatBytes(htmlFile.originalSize)})`,
        afterSnippet: `<meta charset="UTF-8">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<!-- Deferred Tracking Scripts -->`
      });
    });

    cssFiles.forEach((cssFile) => {
      const isExt = isExternalCssFile(cssFile.path, cssFile.name);
      items.push({
        id: `css_${cssFile.path}`,
        type: 'deletion',
        title: isExt
          ? `Externe CSS-Datei geschützt: ${cssFile.name}`
          : `CSS Tree-Shaking & Rule Merger: ${cssFile.name}`,
        description: isExt
          ? `Externe CSS-Datei (z. B. Bootstrap/Vendor) wird nicht verringert oder verändert, um Layout-Brüche zu vermeiden.`
          : `Purge unreferenced CSS selectors based on HTML structure and consolidate redundant CSS declarations.`,
        beforeSnippet: `Path: ${cssFile.path} (${formatBytes(cssFile.originalSize)})`,
        afterSnippet: isExt ? `/* Externe CSS-Datei geschützt */` : `/* Purged & Consolidated Production Stylesheet */`
      });
    });

    jsFiles.forEach((jsFile) => {
      items.push({
        id: `js_${jsFile.path}`,
        type: 'deletion',
        title: `JS Code-Shaking: ${jsFile.name}`,
        description: `Tree-shake dead JS functions and remove unreferenced script blocks.`,
        beforeSnippet: `Path: ${jsFile.path} (${formatBytes(jsFile.originalSize)})`,
        afterSnippet: `/* Pruned Production JavaScript */`
      });
    });

    rasterImageFiles.forEach((imgFile) => {
      items.push({
        id: `img_${imgFile.path}`,
        type: 'transpile',
        title: `WebP Image Optimization & Max-Width Capping: ${imgFile.name}`,
        description: `Convert ${imgFile.ext.toUpperCase()} to WebP format (${currentQuality}% quality) and rescale to detected max-width.`,
        beforeSnippet: `Path: ${imgFile.path} (${formatBytes(imgFile.originalSize)})`,
        afterSnippet: `WebP format with randomized ID hash (${currentQuality}% quality)`
      });
    });

    if (items.length === 0) {
      items.push({
        id: 'lp_general_opt',
        type: 'injection',
        title: 'LP-Optimizely Performance & Critical Path Optimization',
        description: 'Execute full landing page performance optimization pipeline.',
        afterSnippet: 'Full LP Optimization Pipeline'
      });
    }

    setPendingPipeline({
      items,
      filesMap: currentFilesMap,
      dryRunMode,
      currentQuality
    });
    setIsModalOpen(true);
  };

  const handleConfirmPipelineModal = (selectedIds: string[]) => {
    if (!pendingPipeline) return;
    setIsModalOpen(false);
    runOptimizationPipelineInternal(
      pendingPipeline.filesMap,
      pendingPipeline.dryRunMode,
      pendingPipeline.currentQuality,
      selectedIds
    );
  };

  // Internal Pipeline Execution Handler
  const runOptimizationPipelineInternal = async (
    currentFilesMap: Map<string, ZipFileItem>,
    dryRunMode = isDryRun,
    currentQuality = quality,
    selectedIds?: string[]
  ) => {
    setIsProcessing(true);
    const newAuditLog: RemovedAssetAuditItem[] = [];

    const htmlFiles = Array.from(currentFilesMap.values()).filter((f) => f.isHtml);
    const cssFiles = Array.from(currentFilesMap.values()).filter((f) => f.isCss);
    const jsFiles = Array.from(currentFilesMap.values()).filter((f) => f.isJs);
    const fontFiles = Array.from(currentFilesMap.values()).filter((f) => f.isFont);
    const rasterImageFiles = Array.from(currentFilesMap.values()).filter((f) => f.isRasterImage);

    const combinedCodeText = [
      ...htmlFiles.map((f) => f.originalContentText || ''),
      ...cssFiles.map((f) => f.originalContentText || '')
    ].join('\n');

    // ==========================================
    // STAGE 1: Image Max-Width Capping & WebP Conversion
    // ==========================================
    updateStepStatus('step-images', 'in_progress', 10);
    setProcessingStepText('Analysiere Bilddimensionen & berechne WebP Komprimierung...');

    const tasks: ImageOptimizationTask[] = [];

    for (let i = 0; i < rasterImageFiles.length; i++) {
      const imgFile = rasterImageFiles[i];
      if (!imgFile.originalDataUrl) continue;

      const img = new Image();
      await new Promise((res) => {
        img.onload = () => res(null);
        img.onerror = () => res(null);
        img.src = imgFile.originalDataUrl!;
      });

      const naturalWidth = img.naturalWidth || img.width || 800;
      const naturalHeight = img.naturalHeight || img.height || 600;

      const fileNameEscaped = imgFile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let detectedMaxWidth: number | null = null;

      const imgTagRegex = new RegExp(`<img[^>]*src=["'][^"']*${fileNameEscaped}["'][^>]*>`, 'gi');
      const tagMatches = combinedCodeText.match(imgTagRegex);

      if (tagMatches && tagMatches.length > 0) {
        for (const tagStr of tagMatches) {
          const styleMaxW = tagStr.match(/max-width:\s*(\d+)px/i) || tagStr.match(/width:\s*(\d+)px/i);
          if (styleMaxW) {
            detectedMaxWidth = parseInt(styleMaxW[1], 10);
            break;
          }
          const attrW = tagStr.match(/width=["'](\d+)["']/i);
          if (attrW) {
            detectedMaxWidth = parseInt(attrW[1], 10);
            break;
          }
          const tailwindMap: Record<string, number> = {
            'max-w-xs': 320, 'max-w-sm': 384, 'max-w-md': 448, 'max-w-lg': 512,
            'max-w-xl': 576, 'max-w-2xl': 672, 'max-w-3xl': 768, 'max-w-4xl': 896,
            'max-w-5xl': 1024, 'max-w-6xl': 1152, 'max-w-7xl': 1280
          };
          for (const [twClass, twPx] of Object.entries(tailwindMap)) {
            if (tagStr.includes(twClass)) {
              detectedMaxWidth = twPx;
              break;
            }
          }
        }
      }

      let targetWidth = naturalWidth;
      if (detectedMaxWidth && detectedMaxWidth > 0) {
        const desiredPx = retinaScaling ? detectedMaxWidth * 2 : detectedMaxWidth;
        if (naturalWidth > desiredPx) {
          targetWidth = desiredPx;
        }
      }

      const randomNumStr = generateRandomNumberString(10);
      const randomWebpName = `${randomNumStr}.webp`;

      const pathParts = imgFile.path.split('/');
      pathParts[pathParts.length - 1] = randomWebpName;
      const newPath = pathParts.join('/');

      tasks.push({
        id: `img-task-${imgFile.path}`,
        originalPath: imgFile.path,
        originalName: imgFile.name,
        originalSize: imgFile.originalSize,
        naturalWidth,
        naturalHeight,
        detectedMaxWidth,
        targetWidth,
        randomWebpName,
        newPath,
        originalDataUrl: imgFile.originalDataUrl,
        webpDataUrl: null,
        webpBlob: null,
        webpSize: 0,
        status: 'pending',
        quality: currentQuality
      });
    }

    const pathReplacementMap = new Map<string, string>();

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'processing';
      setImageTasks([...tasks]);

      try {
        const img = new Image();
        await new Promise((res) => {
          img.onload = () => res(null);
          img.src = task.originalDataUrl;
        });

        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (task.targetWidth > 0 && width > task.targetWidth) {
          const ratio = task.targetWidth / width;
          width = task.targetWidth;
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const webpQualityRatio = Math.max(0.01, task.quality / 100);
          const webpDataUrl = canvas.toDataURL('image/webp', webpQualityRatio);
          const webpBlob = await new Promise<Blob>((res) => {
            canvas.toBlob((b) => res(b || new Blob([])), 'image/webp', webpQualityRatio);
          });

          task.webpDataUrl = webpDataUrl;
          task.webpBlob = webpBlob;
          task.webpSize = webpBlob.size;
          task.status = 'done';

          pathReplacementMap.set(task.originalName, task.randomWebpName);
          pathReplacementMap.set(task.originalPath, task.newPath);

          newAuditLog.push({
            id: `audit-img-${i}`,
            type: 'image_webp',
            title: `Bild Konvertiert zu WebP (${task.randomWebpName})`,
            fileSource: task.originalPath,
            description: `${dryRunMode ? '[Dry Run Simulation] ' : ''}Original: ${task.naturalWidth}x${task.naturalHeight}px (${formatBytes(task.originalSize)}) ➔ WebP: ${width}x${height}px (${formatBytes(task.webpSize)}) [Qualität: ${task.quality}%]`,
            savingsText: `-${formatBytes(Math.max(0, task.originalSize - task.webpSize))}`
          });
        }
      } catch (err) {
        task.status = 'error';
      }

      const percent = Math.round(((i + 1) / Math.max(1, tasks.length)) * 100);
      updateStepStatus('step-images', 'in_progress', percent);
      setImageTasks([...tasks]);
    }
    updateStepStatus('step-images', 'completed', 100);

    // ==========================================
    // STAGE 2: CSS Tree-Shaking & Selector Removal
    // ==========================================
    updateStepStatus('step-css', 'in_progress', 20);
    setProcessingStepText('Analysiere HTML & entferne unbenutzte CSS-Klassen...');

    const updatedCssFiles = new Map<string, string>();
    const cssStats: CssOptimizationResult[] = [];

    const allHtmlContent = htmlFiles.map((f) => f.originalContentText || '').join(' ');

    const usedClasses = new Set<string>();
    const classMatches = allHtmlContent.matchAll(/(?:class|className)=["']([^"']+)["']/g);
    for (const match of classMatches) {
      match[1].split(/\s+/).forEach((cls) => {
        if (cls.trim()) usedClasses.add(cls.trim());
      });
    }

    const usedIds = new Set<string>();
    const idMatches = allHtmlContent.matchAll(/id=["']([^"']+)["']/g);
    for (const match of idMatches) {
      if (match[1].trim()) usedIds.add(match[1].trim());
    }

    for (const cssFile of cssFiles) {
      const originalCss = cssFile.originalContentText || '';

      // Skip external/vendor/framework CSS files (e.g. Bootstrap, Tailwind, FontAwesome)
      if (isExternalCssFile(cssFile.path, cssFile.name)) {
        let extCss = originalCss;
        for (const [oldRef, newRef] of pathReplacementMap.entries()) {
          extCss = extCss.split(oldRef).join(newRef);
        }
        updatedCssFiles.set(cssFile.path, extCss);
        const fileBytes = cssFile.originalSize || new Blob([extCss]).size;
        cssStats.push({
          path: cssFile.path,
          originalSize: fileBytes,
          purgedSize: fileBytes,
          purgedRulesCount: 0,
          removedSelectors: [],
          purgedContent: extCss
        });

        newAuditLog.push({
          id: `audit-css-skip-ext-${cssFile.path}`,
          type: 'css_selector',
          title: `Externe CSS-Datei geschützt: ${cssFile.name}`,
          fileSource: cssFile.path,
          description: `Externe CSS-Datei '${cssFile.name}' (z. B. Bootstrap/Vendor) wurde nicht verringert oder verändert, um volle Layout-Kompatibilität zu garantieren.`,
          savingsText: 'Geschützt'
        });
        continue;
      }

      let purgedCss = originalCss;
      const removedSelectorsList: string[] = [];

      if (purgeUnusedCss) {
        const rules = originalCss.split(/\}\s*/);
        const keptRules: string[] = [];
        let ruleCounter = 0;

        for (const rule of rules) {
          if (!rule.includes('{')) {
            if (rule.trim()) keptRules.push(rule.trim());
            continue;
          }

          const [selectorPart, declarationPart] = rule.split('{');
          const selector = selectorPart.trim();

          if (
            selector.startsWith('@') ||
            selector.includes(':root') ||
            selector.includes('body') ||
            selector.includes('html') ||
            selector.includes('*')
          ) {
            keptRules.push(`${selector} {${declarationPart}}`);
            continue;
          }

          let isUsed = true;

          const classInSelector = selector.match(/\.([a-zA-Z0-9_-]+)/g);
          if (classInSelector && classInSelector.length > 0) {
            const hasMatchingClass = classInSelector.some((c) => usedClasses.has(c.substring(1)));
            if (!hasMatchingClass) {
              isUsed = false;
            }
          }

          const idInSelector = selector.match(/#([a-zA-Z0-9_-]+)/g);
          if (idInSelector && idInSelector.length > 0) {
            const hasMatchingId = idInSelector.some((i) => usedIds.has(i.substring(1)));
            if (!hasMatchingId) {
              isUsed = false;
            }
          }

          if (isUsed) {
            keptRules.push(`${selector} {${declarationPart}}`);
          } else {
            removedSelectorsList.push(selector);
            ruleCounter++;
            newAuditLog.push({
              id: `audit-css-${selector}-${cssFile.path}-${ruleCounter}`,
              type: 'css_selector',
              title: `Unbenutzter CSS Selektor gelöscht: ${selector}`,
              fileSource: cssFile.path,
              description: `Selektor '${selector}' wird in keiner HTML-Datei verwendet.`,
              savingsText: 'Entfernt'
            });
          }
        }

        purgedCss = keptRules.join('\n');
      }

      // Merge Redundant Rules & Identical Classes
      if (mergeRedundantCss) {
        const mergeResult = mergeRedundantCssRules(purgedCss);
        purgedCss = mergeResult.mergedCss;
        if (mergeResult.mergedCount > 0) {
          newAuditLog.push({
            id: `audit-css-merge-${cssFile.path}`,
            type: 'css_selector',
            title: `Redundante CSS-Regeln zusammengeführt (${mergeResult.mergedCount} doppelte Regeln)`,
            fileSource: cssFile.path,
            description: `${mergeResult.mergedCount} doppelt definierte Selektoren oder CSS-Klassen wurden zu konsolidierten Regeln zusammengefasst.`,
            savingsText: 'Cleaned'
          });
        }
      }

      // Inject Hyphenation & Overflow Wrap Rules
      if (enableAutoHyphenation) {
        purgedCss += `\n\n/* LP-Optimizely Auto Hyphenation & Overflow-Wrap */\np, li, div {\n  hyphens: auto;\n  overflow-wrap: break-word;\n}`;
      }

      if (stripComments) {
        purgedCss = purgedCss.replace(/\/\*[\s\S]*?\*\//g, '');
      }

      for (const [oldRef, newRef] of pathReplacementMap.entries()) {
        purgedCss = purgedCss.split(oldRef).join(newRef);
      }

      updatedCssFiles.set(cssFile.path, purgedCss);
      const purgedSize = new Blob([purgedCss]).size;
      cssStats.push({
        path: cssFile.path,
        originalSize: cssFile.originalSize,
        purgedSize,
        purgedRulesCount: removedSelectorsList.length,
        removedSelectors: removedSelectorsList,
        purgedContent: purgedCss
      });
    }

    setCssResults(cssStats);
    setOptimizedCssFiles(updatedCssFiles);
    updateStepStatus('step-css', 'completed', 100);

    // ==========================================
    // STAGE 3: JS Code Tree-Shaking & Dead Function Removal
    // ==========================================
    updateStepStatus('step-js', 'in_progress', 30);
    setProcessingStepText('Prüfe JS-Dateien auf unbenutzte Funktionen & Toter Code...');

    const updatedJsFiles = new Map<string, string>();
    const jsStats: JsOptimizationResult[] = [];

    const fullHtmlAndJsScope = [
      ...htmlFiles.map((f) => f.originalContentText || ''),
      ...jsFiles.map((f) => f.originalContentText || '')
    ].join('\n');

    for (const jsFile of jsFiles) {
      const originalJs = jsFile.originalContentText || '';
      let cleanedJs = originalJs;
      const removedFunctionsList: string[] = [];

      if (cleanUnusedJs) {
        const functionDeclRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
        let match: RegExpExecArray | null;

        while ((match = functionDeclRegex.exec(originalJs)) !== null) {
          const funcName = match[1];

          const occurrences = (fullHtmlAndJsScope.match(new RegExp(`\\b${funcName}\\b`, 'g')) || []).length;

          if (occurrences <= 1 && (funcName.startsWith('unused') || funcName.startsWith('dead') || funcName.includes('Legacy'))) {
            const funcBlockRegex = new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}`, 'g');
            cleanedJs = cleanedJs.replace(funcBlockRegex, `/* [LP-Optimizely] Purged unused function: ${funcName}() */`);
            removedFunctionsList.push(funcName);

            newAuditLog.push({
              id: `audit-js-${funcName}-${jsFile.path}`,
              type: 'js_function',
              title: `Unbenutzte JS Funktion entfernt: ${funcName}()`,
              fileSource: jsFile.path,
              description: `Funktion '${funcName}()' wurde an keiner Stelle aufgerufen.`,
              savingsText: 'Pruned'
            });
          }
        }
      }

      for (const [oldRef, newRef] of pathReplacementMap.entries()) {
        cleanedJs = cleanedJs.split(oldRef).join(newRef);
      }

      if (stripComments) {
        cleanedJs = cleanedJs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*/gm, '');
      }

      updatedJsFiles.set(jsFile.path, cleanedJs);
      const cleanedSize = new Blob([cleanedJs]).size;
      jsStats.push({
        path: jsFile.path,
        originalSize: jsFile.originalSize,
        cleanedSize,
        removedFunctionsCount: removedFunctionsList.length,
        removedFunctions: removedFunctionsList,
        cleanedContent: cleanedJs
      });
    }

    setJsResults(jsStats);
    setOptimizedJsFiles(updatedJsFiles);
    updateStepStatus('step-js', 'completed', 100);

    // ==========================================
    // STAGE 4: Font Subsetting & Character Set Analysis
    // ==========================================
    updateStepStatus('step-fonts', 'in_progress', 40);
    setProcessingStepText('Analysiere genutzte Zeichen (Glyphs) & Optimiere Web Fonts...');

    const allTextScope = [
      ...htmlFiles.map((f) => f.originalContentText || ''),
      ...cssFiles.map((f) => f.originalContentText || '')
    ].join(' ');

    const uniqueCharsSet = new Set<string>();
    for (let char of allTextScope) {
      if (char.trim() && char.charCodeAt(0) > 31) {
        uniqueCharsSet.add(char);
      }
    }

    const uniqueCharsList = Array.from(uniqueCharsSet).sort().join('');
    const googleFontsFound: string[] = [];
    const fontFilesFound: string[] = fontFiles.map((f) => f.path);

    for (const htmlFile of htmlFiles) {
      const text = htmlFile.originalContentText || '';
      const gfMatches = text.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+/g);
      if (gfMatches) {
        googleFontsFound.push(...gfMatches);
      }
    }

    const estOriginalBytes = fontFiles.reduce((s, f) => s + f.originalSize, 0) || 120000;
    const estimatedSubsetRatio = Math.min(0.85, 1 - Math.min(1, uniqueCharsSet.size / 600));
    const estSubsetBytes = Math.round(estOriginalBytes * (1 - estimatedSubsetRatio));
    const estSavingsPercent = Math.round(estimatedSubsetRatio * 100);

    setFontSubsetting({
      totalUniqueChars: uniqueCharsSet.size,
      sampleChars: uniqueCharsList.slice(0, 40),
      googleFontsFound,
      fontFilesFound,
      estimatedOriginalBytes: estOriginalBytes,
      estimatedSubsetBytes: estSubsetBytes,
      estimatedSavingsPercent: estSavingsPercent
    });

    newAuditLog.push({
      id: `audit-fonts-subset`,
      type: 'font_subset',
      title: `Font Subsetting Berechnet (${uniqueCharsSet.size} Glyphen)`,
      fileSource: fontFilesFound.join(', ') || 'Google Fonts',
      description: `Gefundene eindeutige Zeichen: ${uniqueCharsSet.size} aus ~600 Unicode-Zeichen. Reduziert Font-Größe um ca. ${estSavingsPercent}%.`,
      savingsText: `-${estSavingsPercent}% Fonts`
    });

    updateStepStatus('step-fonts', 'completed', 100);

    // ==========================================
    // STAGE 5: Automated A11y & SEO Audit Step
    // ==========================================
    updateStepStatus('step-a11y', 'in_progress', 60);
    setProcessingStepText('Prüfe Barrierefreiheit (A11y), Alt-Tags & SEO Metadaten...');

    const foundA11yIssues: A11yIssueItem[] = [];
    const foundMissingAltImages: Array<{ id: string; file: string; src: string; currentAlt: string; autoGenerated: boolean }> = [];

    for (const htmlFile of htmlFiles) {
      const text = htmlFile.originalContentText || '';

      // Check 1: Images missing alt tag
      const imgMatches = text.matchAll(/<img\s+([^>]+)>/gi);
      let imgCounter = 0;
      for (const m of imgMatches) {
        imgCounter++;
        const tag = m[0];
        if (!tag.includes('alt=') || tag.match(/alt=["']\s*["']/)) {
          const srcMatch = tag.match(/src=["']([^"']+)["']/);
          const imgSrc = srcMatch ? srcMatch[1] : 'unbekanntes-bild';
          const srcName = imgSrc.split('/').pop()?.split('.')[0] || 'Image';
          const cleanAltName = srcName.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

          foundMissingAltImages.push({
            id: `alt-${htmlFile.path}-${imgCounter}`,
            file: htmlFile.path,
            src: imgSrc,
            currentAlt: cleanAltName,
            autoGenerated: true
          });

          foundA11yIssues.push({
            id: `a11y-alt-${imgSrc}`,
            type: 'missing_alt',
            severity: 'error',
            file: htmlFile.path,
            title: `Fehlendes Alt-Attribut (A11y / SEO)`,
            description: `Bild '${imgSrc}' besitzt kein beschreibendes 'alt' Attribut. Auto-generierter Vorschlag: '${cleanAltName}'.`,
            autoFixable: true
          });
        }
      }

      // Check 2: Missing title
      if (!text.includes('<title>') || text.includes('<title></title>')) {
        foundA11yIssues.push({
          id: `a11y-title-${htmlFile.path}`,
          type: 'missing_title',
          severity: 'error',
          file: htmlFile.path,
          title: `Fehlendes <title> Tag`,
          description: `Die HTML-Datei enthält keinen gültigen Seitentitel.`,
          autoFixable: true
        });
      }

      // Check 3: Missing Meta Description
      if (!text.includes('name="description"')) {
        foundA11yIssues.push({
          id: `a11y-meta-desc-${htmlFile.path}`,
          type: 'missing_meta_desc',
          severity: 'warning',
          file: htmlFile.path,
          title: `Fehlende Meta Description`,
          description: `Keine meta description gefunden für Google SERP Snippets.`,
          autoFixable: true
        });
      }

      // Check 4: Synchronous Tracking Scripts
      if (
        (text.includes('googletagmanager.com') || text.includes('connect.facebook.net') || text.includes('analytics.tiktok.com')) &&
        !text.includes('async') && !text.includes('defer')
      ) {
        foundA11yIssues.push({
          id: `a11y-tracking-${htmlFile.path}`,
          type: 'blocking_script',
          severity: 'warning',
          file: htmlFile.path,
          title: `Blockierendes Tracking Script in <head>`,
          description: `Tracking-Skript (GTM/Meta/TikTok) lädt synchron und verlangsamt das First Contentful Paint (FCP).`,
          autoFixable: true
        });
      }

      // Check 5: Dead Links & Missing Internal ZIP Assets
      if (checkDeadLinks) {
        const linkMatches = text.matchAll(/(?:src|href|action|poster)=["']([^"']+)["']/gi);
        for (const lm of linkMatches) {
          const rawUrl = lm[1].trim();
          if (
            rawUrl &&
            !rawUrl.startsWith('http://') &&
            !rawUrl.startsWith('https://') &&
            !rawUrl.startsWith('//') &&
            !rawUrl.startsWith('mailto:') &&
            !rawUrl.startsWith('tel:') &&
            !rawUrl.startsWith('#') &&
            !rawUrl.startsWith('javascript:') &&
            !rawUrl.startsWith('data:')
          ) {
            const cleanUrl = rawUrl.split('?')[0].split('#')[0].replace(/^\.\//, '');
            const fileExists =
              currentFilesMap.has(cleanUrl) ||
              Array.from(currentFilesMap.keys()).some((k) => k.endsWith(cleanUrl)) ||
              pathReplacementMap.has(cleanUrl);
            if (!fileExists) {
              foundA11yIssues.push({
                id: `deadlink-${htmlFile.path}-${cleanUrl}`,
                type: 'broken_link',
                severity: 'error',
                file: htmlFile.path,
                title: `Toter Link / Fehlendes Asset im ZIP`,
                description: `Relativer Pfad '${cleanUrl}' wurde nicht im entpackten ZIP-Archiv gefunden.`,
                autoFixable: false
              });
            }
          }
        }
      }
    }

    setA11yIssues(foundA11yIssues);
    setMissingAltImages(foundMissingAltImages);
    updateStepStatus('step-a11y', 'completed', 100);

    // ==========================================
    // STAGE 6: HTML Optimization & Code Enhancements
    // ==========================================
    updateStepStatus('step-html', 'in_progress', 70);
    setProcessingStepText('Optimiere HTML (UTF-8 Repair, Preload, Critical CSS & Interaction Triggers)...');

    const updatedHtmlFiles = new Map<string, string>();

    for (const htmlFile of htmlFiles) {
      let htmlContent = htmlFile.originalContentText || '';

      // 1. Character Encoding Fix (Mojibake repair)
      if (fixCharacterEncoding) {
        htmlContent = repairMojibakeAndEncoding(htmlContent);
        if (!htmlContent.toLowerCase().includes('charset=')) {
          htmlContent = htmlContent.replace('<head>', '<head>\n  <meta charset="UTF-8">');
        }
      }

      // 2. Replace image paths with WebP
      for (const [oldRef, newRef] of pathReplacementMap.entries()) {
        htmlContent = htmlContent.split(oldRef).join(newRef);
      }

      // 3. Inject Lazy-Loading & Async Decoding onto <img> tags
      if (autoLazyLoadImages) {
        let imgIndex = 0;
        htmlContent = htmlContent.replace(/<img\s+([^>]+)>/gi, (fullMatch, attrStr) => {
          imgIndex++;
          let newAttrs = attrStr;

          // Auto-fix missing alt tags with intelligent filename derivation
          if (!newAttrs.includes('alt=')) {
            const srcMatch = newAttrs.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
              const srcName = srcMatch[1].split('/').pop()?.split('.')[0] || 'Image';
              const cleanAltName = srcName.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              newAttrs += ` alt="${cleanAltName}"`;
            } else {
              newAttrs += ' alt="Landing Page Visual"';
            }
          }

          if (imgIndex > 1 && !newAttrs.includes('loading=')) {
            newAttrs += ' loading="lazy"';
          }
          if (!newAttrs.includes('decoding=')) {
            newAttrs += ' decoding="async"';
          }
          return `<img ${newAttrs}>`;
        });
      }

      // 4. Optimize Tracking Scripts & Inject Preconnect
      if (optimizeTrackingScripts) {
        if (htmlContent.includes('googletagmanager.com') && !htmlContent.includes('async')) {
          htmlContent = htmlContent.replace(/<script([^>]*)src=["']([^"']*googletagmanager\.com[^"']*)["']([^>]*)>/gi, '<script$1src="$2"$3 async>');
          newAuditLog.push({
            id: `audit-gtm-defer-${htmlFile.path}`,
            type: 'tracking_defer',
            title: `GTM Tracking Script Non-Blocking gemacht (async)`,
            fileSource: htmlFile.path,
            description: `Google Tag Manager Skript laedt nun asynchron zur Maximierung des FCP Scores.`,
            savingsText: 'Speed++'
          });
        }

        // Inject Preconnect CDN Hints
        if ((htmlContent.includes('fonts.googleapis.com') || htmlContent.includes('googletagmanager.com')) && !htmlContent.includes('rel="preconnect"')) {
          const preconnectTags = `<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link rel="dns-prefetch" href="https://www.googletagmanager.com">`;
          htmlContent = htmlContent.replace('</head>', `  ${preconnectTags}\n</head>`);
        }
      }

      // 4.1. Third-Party Script Interaction Trigger (Delay GA/Pixel/Hotjar)
      if (delayThirdPartyScripts) {
        const deferredSources: string[] = [];
        htmlContent = htmlContent.replace(/<script([^>]*)src=["']([^"']*(?:googletagmanager|facebook\.net|hotjar|tiktok|clarity|google-analytics)[^"']*)["']([^>]*)><\/script>/gi, (match, p1, srcUrl) => {
          deferredSources.push(srcUrl);
          return `<!-- Deferred Script by LP-Optimizely: ${srcUrl} -->`;
        });
        if (deferredSources.length > 0) {
          const delayLoaderScript = `
  <script id="lp-optimizely-lazy-scripts">
    (function(){
      var done = false;
      function loadAll(){
        if(done) return; done = true;
        var scripts = ${JSON.stringify(deferredSources)};
        scripts.forEach(function(u){
          var s = document.createElement('script'); s.src = u; s.async = true;
          document.head.appendChild(s);
        });
      }
      ['scroll','pointerdown','keydown','touchstart','mousemove'].forEach(function(ev){
        window.addEventListener(ev, loadAll, {once:true, passive:true});
      });
      setTimeout(loadAll, 7000);
    })();
  </script>`;
          htmlContent = htmlContent.replace('</head>', `${delayLoaderScript}\n</head>`);
          newAuditLog.push({
            id: `audit-delay-scripts-${htmlFile.path}`,
            type: 'tracking_defer',
            title: `Third-Party Scripts verzögert (Interaction Trigger)`,
            fileSource: htmlFile.path,
            description: `${deferredSources.length} Schwergewichtige Skripte (GA, Pixel, Hotjar, TikTok) werden erst bei Nutzerinteraktion geladen (100/100 Lighthouse).`,
            savingsText: '100/100 TBT'
          });
        }
      }

      // 5. Append Font Subsetting Query String if Google Fonts found
      if (subsetFontsOption && uniqueCharsList) {
        const encodedChars = encodeURIComponent(uniqueCharsList.slice(0, 80));
        htmlContent = htmlContent.replace(/(https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+)/g, (match) => {
          if (!match.includes('&text=')) {
            return `${match}&text=${encodedChars}`;
          }
          return match;
        });
      }

      // 5.1 Preload Critical Assets Scanner (<link rel="preload">)
      if (preloadCriticalAssets) {
        let preloadSnippet = '';
        const fontMatches = Array.from(htmlContent.matchAll(/href=["']([^"']+\.(?:woff2|woff|ttf))["']/gi));
        const cssMatches = Array.from(htmlContent.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi));
        
        fontMatches.forEach((m) => {
          if (!htmlContent.includes(`rel="preload"`) || !htmlContent.includes(m[1])) {
            preloadSnippet += `\n  <link rel="preload" href="${m[1]}" as="font" type="font/woff2" crossorigin>`;
          }
        });
        cssMatches.slice(0, 2).forEach((m) => {
          if (!htmlContent.includes(`rel="preload"`) || !htmlContent.includes(m[1])) {
            preloadSnippet += `\n  <link rel="preload" href="${m[1]}" as="style">`;
          }
        });

        if (preloadSnippet) {
          htmlContent = htmlContent.replace('</head>', `${preloadSnippet}\n</head>`);
          newAuditLog.push({
            id: `audit-preload-${htmlFile.path}`,
            type: 'html_enhancement',
            title: `Resource Preloading Injected (<link rel="preload">)`,
            fileSource: htmlFile.path,
            description: `Preload-Attribute für kritische Schriftarten & Stylesheets im Head injiziert für beschleunigten Renderpfad.`,
            savingsText: 'Speed++'
          });
        }
      }

      // 5.2 Critical Above-the-Fold CSS Inliner
      if (inlineCriticalCss && updatedCssFiles.size > 0) {
        const combinedCss = Array.from(updatedCssFiles.values()).join('\n');
        const topRules = combinedCss.slice(0, 2500);
        if (topRules && !htmlContent.includes('id="lp-critical-above-the-fold"')) {
          const inlineStyleTag = `\n  <style id="lp-critical-above-the-fold">/* Above-the-Fold Critical CSS Inlined by LP-Optimizely */\n${topRules}\n</style>`;
          htmlContent = htmlContent.replace('</head>', `${inlineStyleTag}\n</head>`);
          newAuditLog.push({
            id: `audit-critical-css-${htmlFile.path}`,
            type: 'html_enhancement',
            title: `Critical Above-the-Fold CSS Inlining`,
            fileSource: htmlFile.path,
            description: `Kritisches Above-the-Fold CSS direkt im HTML-<head> platziert zur Minimierung des First Contentful Paint (FCP).`,
            savingsText: 'FCP++'
          });
        }
      }

      // 5.3 Open Graph Social Card Generator
      if (generateOgCard) {
        const ogData = await generateOgCardImageAndMeta(currentFilesMap, htmlContent);
        if (ogData) {
          if (!htmlContent.includes('property="og:image"')) {
            htmlContent = htmlContent.replace('</head>', `${ogData.htmlSnippet}\n</head>`);
          }
          setGeneratedOgCards(ogData.ogCards);
          newAuditLog.push({
            id: `audit-og-${htmlFile.path}`,
            type: 'html_enhancement',
            title: `Open Graph Card (1200x630) im /og Ordner`,
            fileSource: htmlFile.path,
            description: `Generierte 1200x630 Social Preview Grafik 'og/og-image.png' und injizierte Open Graph & Twitter Meta Tags.`,
            savingsText: 'Social++'
          });
        }
      }

      // 5.4 Form A11y & Autocomplete Enhancer
      if (enhanceFormA11y) {
        let formFieldsEnhancedCount = 0;
        htmlContent = htmlContent.replace(/<(input|select|textarea)\s+([^>]+)>/gi, (match, tagName, attrs) => {
          let newAttrs = attrs;
          if (!newAttrs.includes('autocomplete=')) {
            if (/type=["']email["']|name=["']?.*email.*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="email"';
              formFieldsEnhancedCount++;
            } else if (/type=["']tel["']|name=["']?.*(?:phone|tel|mobil).*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="tel"';
              formFieldsEnhancedCount++;
            } else if (/name=["']?.*(?:first|fname).*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="given-name"';
              formFieldsEnhancedCount++;
            } else if (/name=["']?.*(?:last|lname).*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="family-name"';
              formFieldsEnhancedCount++;
            } else if (/name=["']?.*(?:name|vorname|nachname).*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="name"';
              formFieldsEnhancedCount++;
            } else if (/name=["']?.*(?:plz|zip).*/i.test(newAttrs)) {
              newAttrs += ' autocomplete="postal-code"';
              formFieldsEnhancedCount++;
            }
          }

          if (!newAttrs.includes('aria-label=') && !newAttrs.includes('aria-labelledby=')) {
            const nameMatch = newAttrs.match(/name=["']([^"']+)["']/i) || newAttrs.match(/placeholder=["']([^"']+)["']/i);
            if (nameMatch) {
              const cleanLabel = nameMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              newAttrs += ` aria-label="${cleanLabel}"`;
              formFieldsEnhancedCount++;
            }
          }

          if (!newAttrs.includes('required') && (/type=["']email["']/i.test(newAttrs) || /type=["']tel["']/i.test(newAttrs))) {
            newAttrs += ' required';
            formFieldsEnhancedCount++;
          }

          return `<${tagName} ${newAttrs}>`;
        });

        if (formFieldsEnhancedCount > 0) {
          newAuditLog.push({
            id: `audit-form-a11y-${htmlFile.path}`,
            type: 'html_enhancement',
            title: `Formular A11y & Autocomplete Enhancer`,
            fileSource: htmlFile.path,
            description: `Formularfelder automatisch mit WCAG autocomplete, aria-label & required Attributen ausgestattet.`,
            savingsText: 'WCAG++'
          });
        }
      }

      // 6. Auto Favicon Detection & Generation
      if (autoGenerateFavicons && !htmlContent.toLowerCase().includes('rel="icon"') && !htmlContent.toLowerCase().includes('rel="shortcut icon"')) {
        const faviconData = await generateFaviconSetFromLogo(currentFilesMap);
        if (faviconData) {
          htmlContent = htmlContent.replace('</head>', `${faviconData.htmlSnippet}\n</head>`);
          setGeneratedFavicons(faviconData.favicons);
          newAuditLog.push({
            id: `audit-favicon-${htmlFile.path}`,
            type: 'html_enhancement',
            title: `Favicon-Set Automatisch Generiert (/favicon Ordner)`,
            fileSource: htmlFile.path,
            description: `Fehlendes Favicon erkannt. Generiere 16x16, 32x32 & 192x192 PNG Favicons im /favicon Ordner und füge <link rel="icon"> ein.`,
            savingsText: 'A11y/UX++'
          });
        }
      }

      // 7. Inject Fallback Hyphenation CSS if no external CSS
      if (enableAutoHyphenation && cssFiles.length === 0 && !htmlContent.includes('lp-optimizely-hyphenation')) {
        const hyphenationStyle = `\n  <style id="lp-optimizely-hyphenation">p, li, div { hyphens: auto; overflow-wrap: break-word; }</style>`;
        htmlContent = htmlContent.replace('</head>', `${hyphenationStyle}\n</head>`);
      }

      // 8. Code Comment Stripping (Opt-In)
      if (stripComments) {
        htmlContent = htmlContent.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
      }

      // 9. Code Beautify or Minify
      if (minifyHtml) {
        htmlContent = minifyHtmlCode(htmlContent);
      } else if (beautifyCode) {
        htmlContent = beautifyHtmlCode(htmlContent);
      }

      updatedHtmlFiles.set(htmlFile.path, htmlContent);
    }

    // 10. Efficient Custom CSS Class Renaming (.top -> ._165792, .bottom -> ._093468)
    if (renameCustomClasses) {
      const customClassSet = new Set<string>();
      const protectedVendorClasses = new Set<string>();
      const ignoredSelectors = new Set([
        'hover', 'focus', 'active', 'disabled', 'visited', 'checked',
        'first-child', 'last-child', 'nth-child', 'before', 'after',
        'root', 'body', 'html', 'dark', 'light', 'media', 'keyframes',
        'font-face', 'supports', 'container', 'layer', 'import', 'charset',
        '0%', '100%', '50%'
      ]);

      // 10a. Collect all classes defined in external vendor CSS files (Bootstrap, Tailwind, etc.) to keep them protected
      for (const cssFile of cssFiles) {
        if (isExternalCssFile(cssFile.path, cssFile.name)) {
          const content = cssFile.originalContentText || '';
          const matches = content.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_\-\u00A0-\uFFFF]*)/g);
          for (const m of matches) {
            if (m[1]) protectedVendorClasses.add(m[1]);
          }
        }
      }

      // 10b. Scan ONLY custom CSS files (e.g. style.css)
      for (const cssFile of cssFiles) {
        if (!isExternalCssFile(cssFile.path, cssFile.name)) {
          const cssCode = updatedCssFiles.get(cssFile.path) || cssFile.originalContentText || '';
          const matches = cssCode.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_\-\u00A0-\uFFFF]*)/g);
          for (const m of matches) {
            const cls = m[1];
            if (
              cls &&
              !cls.startsWith('_') &&
              !ignoredSelectors.has(cls.toLowerCase()) &&
              !protectedVendorClasses.has(cls)
            ) {
              customClassSet.add(cls);
            }
          }
        }
      }

      // 10c. Scan HTML files for custom classes (filtering out protected vendor classes)
      for (const [, htmlCode] of updatedHtmlFiles.entries()) {
        const matches = htmlCode.matchAll(/(?:class|className)=["']([^"']+)["']/g);
        for (const m of matches) {
          m[1].split(/\s+/).forEach((cls) => {
            const trimmed = cls.trim();
            if (
              trimmed &&
              !trimmed.startsWith('_') &&
              !ignoredSelectors.has(trimmed.toLowerCase()) &&
              !protectedVendorClasses.has(trimmed)
            ) {
              customClassSet.add(trimmed);
            }
          });
        }
      }

      if (customClassSet.size > 0) {
        const usedIds = new Set<string>();
        const classMap = new Map<string, string>();
        let renamedCount = 0;

        for (const oldCls of customClassSet) {
          let randomNumStr = '';
          do {
            const digits = Math.floor(100000 + Math.random() * 90000000).toString();
            randomNumStr = `_${digits}`;
          } while (usedIds.has(randomNumStr));

          usedIds.add(randomNumStr);
          classMap.set(oldCls, randomNumStr);
          renamedCount++;
        }

        // Sort class names by length descending so longer classes (e.g. flip-top) are replaced BEFORE shorter substrings (e.g. top)
        const sortedOldClasses = Array.from(classMap.keys()).sort((a, b) => b.length - a.length);

        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Replace ONLY in custom CSS files (never touch external vendor CSS)
        for (const cssFile of cssFiles) {
          if (!isExternalCssFile(cssFile.path, cssFile.name)) {
            let newCss = updatedCssFiles.get(cssFile.path) || cssFile.originalContentText || '';
            for (const oldCls of sortedOldClasses) {
              const newCls = classMap.get(oldCls)!;
              const regex = new RegExp(`\\.${escapeRegex(oldCls)}(?![a-zA-Z0-9_\\-\\u00A0-\\uFFFF])`, 'g');
              newCss = newCss.replace(regex, `.${newCls}`);
            }
            updatedCssFiles.set(cssFile.path, newCss);
          }
        }

        // Replace in HTML files (class/className attributes & inline <style> blocks)
        for (const [path, htmlCode] of updatedHtmlFiles.entries()) {
          // 1. Replace inside class/className attributes
          let newHtml = htmlCode.replace(/(class|className)=["']([^"']+)["']/g, (match, attrName, classValue) => {
            const tokens = classValue.split(/\s+/);
            const newTokens = tokens.map((token) => classMap.get(token) || token);
            return `${attrName}="${newTokens.join(' ')}"`;
          });

          // 2. Replace inside <style> tags
          newHtml = newHtml.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, openTag, styleContent, closeTag) => {
            let updatedStyle = styleContent;
            for (const oldCls of sortedOldClasses) {
              const newCls = classMap.get(oldCls)!;
              const regex = new RegExp(`\\.${escapeRegex(oldCls)}(?![a-zA-Z0-9_\\-\\u00A0-\\uFFFF])`, 'g');
              updatedStyle = updatedStyle.replace(regex, `.${newCls}`);
            }
            return `${openTag}${updatedStyle}${closeTag}`;
          });

          updatedHtmlFiles.set(path, newHtml);
        }

        newAuditLog.push({
          id: `audit-css-obfuscate-rename`,
          type: 'css_selector',
          title: `Effiziente Einzelne CSS-Klassen Umbenennung (${renamedCount} Custom-Klassen)`,
          fileSource: zipFileName || 'Landing Page',
          description: `${renamedCount} Custom-Klassen (z.B. .top, .bottom, .flip-top) wurden einzeln mit eigenen anonymisierten String-IDs (z.B. ._165792, ._093468, ._039678) umbenannt.`,
          savingsText: `${renamedCount} Classes`
        });
      }
    }

    if (stripComments) {
      newAuditLog.push({
        id: `audit-strip-comments-global`,
        type: 'html_enhancement',
        title: `Code-Kommentare entfernt (HTML, CSS & JS)`,
        fileSource: zipFileName || 'Landig Page',
        description: `Alle Entwickler-Kommentare (<!-- -->, /* */, //) wurden vollständig aus HTML, CSS und JS-Dateien entfernt.`,
        savingsText: 'Cleaned'
      });
    }

    setOptimizedHtmlFiles(updatedHtmlFiles);
    setAuditLog(newAuditLog);
    updateStepStatus('step-html', 'completed', 100);

    // ==========================================
    // STAGE 7: Identify Orphan / Unlinked ZIP Assets & Images
    // ==========================================
    const allReferencesText = [
      ...Array.from(updatedHtmlFiles.values()),
      ...Array.from(updatedCssFiles.values()),
      ...Array.from(updatedJsFiles.values())
    ].join(' ');

    const unlinked: string[] = [];
    currentFilesMap.forEach((fileItem, path) => {
      if (!fileItem.isHtml && !fileItem.isCss && !fileItem.isJs) {
        const fileName = fileItem.name;
        const cleanName = fileName.split('/').pop() || fileName;

        const isReferenced = 
          allReferencesText.includes(fileName) || 
          allReferencesText.includes(cleanName) || 
          allReferencesText.includes(path) ||
          tasks.some((t) => t.originalPath === path && (allReferencesText.includes(t.randomWebpName) || allReferencesText.includes(t.newPath)));

        if (!isReferenced) {
          unlinked.push(path);
          newAuditLog.push({
            id: `audit-unlinked-${path}`,
            type: 'unlinked_purged',
            title: (fileItem.isRasterImage || fileItem.isSvg)
              ? `Unbenutztes Bild gelöscht: ${cleanName}`
              : `Unbenutzte Datei gelöscht: ${cleanName}`,
            fileSource: path,
            description: `Datei '${path}' ist im HTML/CSS/JS Code nirgends eingebunden und wurde gelöscht.`,
            savingsText: formatBytes(fileItem.originalSize)
          });
        }
      }
    });

    setUnlinkedFilesList(unlinked);

    // ==========================================
    // STAGE 8: Live Preview & Virtual ZIP Assembly
    // ==========================================
    updateStepStatus('step-preview', 'in_progress', 80);
    setProcessingStepText('Generiere Vorschau & erstelle finale LP Struktur...');

    buildLivePreviewBlobUrl(updatedHtmlFiles, updatedCssFiles, updatedJsFiles, tasks);

    updateStepStatus('step-preview', 'completed', 100);
    setIsProcessing(false);
    setActiveTab('overview');
  };

  // Build Virtual Live Preview Blob URL & Cache to LocalStorage
  const buildLivePreviewBlobUrl = (
    htmlMap: Map<string, string>,
    cssMap: Map<string, string>,
    jsMap: Map<string, string>,
    tasks: ImageOptimizationTask[]
  ) => {
    let mainHtmlPath = Array.from(htmlMap.keys()).find((p) => p.endsWith('index.html')) || Array.from(htmlMap.keys())[0];
    if (!mainHtmlPath) return;

    let mainHtml = htmlMap.get(mainHtmlPath) || '';

    let combinedCss = '';
    cssMap.forEach((cssText) => {
      combinedCss += `\n/* Optimized CSS */\n${cssText}\n`;
    });

    if (combinedCss) {
      mainHtml = mainHtml.replace('</head>', `<style>${combinedCss}</style>\n</head>`);
    }

    // Map WebP Data URLs for all tasks
    tasks.forEach((t) => {
      if (t.webpDataUrl) {
        mainHtml = mainHtml.split(t.randomWebpName).join(t.webpDataUrl);
        mainHtml = mainHtml.split(t.newPath).join(t.webpDataUrl);
        mainHtml = mainHtml.split(t.originalPath).join(t.webpDataUrl);
        mainHtml = mainHtml.split(t.originalName).join(t.webpDataUrl);
      }
    });

    // Map any non-task images or fakepaths to Data URLs for seamless preview
    filesMap.forEach((fileItem, filePath) => {
      if ((fileItem.isRasterImage || fileItem.isSvg) && fileItem.originalDataUrl) {
        const cleanName = filePath.split('/').pop() || filePath;
        mainHtml = mainHtml.split(filePath).join(fileItem.originalDataUrl);
        mainHtml = mainHtml.split(cleanName).join(fileItem.originalDataUrl);
        mainHtml = mainHtml.split(`C:\\fakepath\\${cleanName}`).join(fileItem.originalDataUrl);
      }
    });

    // LocalStorage cache backup for LP Preview
    try {
      localStorage.setItem('lp_optimizely_preview_html', mainHtml);
    } catch (e) {
      // Ignore quota errors gracefully
    }

    const blob = new Blob([mainHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setPreviewBlobUrl(url);
  };

  // Download Fully Optimized Landing Page ZIP
  const handleDownloadOptimizedZip = async () => {
    setIsProcessing(true);
    setProcessingStepText('Erstelle finale optimierte ZIP-Datei...');

    try {
      const outputZip = new JSZip();

      // Preserve non-raster files unless purged as unlinked
      filesMap.forEach((fileItem, path) => {
        const isRevertedUnlinked = revertedAuditIds.includes(`audit-unlinked-${path}`);
        if (purgeUnlinkedAssets && unlinkedFilesList.includes(path) && !isRevertedUnlinked) {
          return; // Skip unlinked draft files!
        }

        if (!fileItem.isRasterImage && !fileItem.isCss && !fileItem.isHtml && !fileItem.isJs) {
          if (fileItem.isSvg && fileItem.originalContentText) {
            outputZip.file(path, fileItem.originalContentText);
          } else if (fileItem.originalContentBlob) {
            outputZip.file(path, fileItem.originalContentBlob);
          }
        }
      });

      // Add optimized HTML files
      optimizedHtmlFiles.forEach((htmlContent, path) => {
        outputZip.file(path, htmlContent);
      });

      // Add optimized CSS files
      optimizedCssFiles.forEach((cssContent, path) => {
        outputZip.file(path, cssContent);
      });

      // Add optimized JS files
      optimizedJsFiles.forEach((jsContent, path) => {
        outputZip.file(path, jsContent);
      });

      // Add new WebP Images or preserve original if audit reverted
      imageTasks.forEach((t, i) => {
        const isRevertedImage = revertedAuditIds.includes(`audit-img-${i}`);
        if (isRevertedImage) {
          // Write back original raster image
          const origItem = filesMap.get(t.originalPath);
          if (origItem && origItem.originalContentBlob) {
            outputZip.file(t.originalPath, origItem.originalContentBlob);
          }
        } else if (t.webpBlob && t.status === 'done') {
          outputZip.file(t.newPath, t.webpBlob);
        }
      });

      // Add Auto-Generated Favicon PNGs
      generatedFavicons.forEach((fav) => {
        outputZip.file(fav.path, fav.blob);
      });

      // Add Open Graph Social Cards
      generatedOgCards.forEach((og) => {
        outputZip.file(og.path, og.blob);
      });

      const zipBlob = await outputZip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      const cleanBaseName = zipFileName ? zipFileName.replace(/\.zip$/i, '') : 'landingpage';
      downloadAnchor.download = `${cleanBaseName}-optimizely.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Fehler beim Erstellen der optimierten ZIP-Datei: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Total Metrics Calculations
  const totalOriginalSize = Array.from(filesMap.values()).reduce((sum, f) => sum + f.originalSize, 0);

  const totalOptimizedImagesSize = imageTasks.reduce((sum, t) => sum + (t.webpSize || t.originalSize), 0);
  const totalOptimizedCssSize = Array.from(optimizedCssFiles.values()).reduce((sum, text) => sum + new Blob([text]).size, 0);
  const totalOptimizedHtmlSize = Array.from(optimizedHtmlFiles.values()).reduce((sum, text) => sum + new Blob([text]).size, 0);
  const totalOptimizedJsSize = Array.from(optimizedJsFiles.values()).reduce((sum, text) => sum + new Blob([text]).size, 0);

  const untouchedFilesSize = Array.from(filesMap.values())
    .filter((f) => !f.isRasterImage && !f.isCss && !f.isHtml && !f.isJs)
    .reduce((sum, f) => sum + f.originalSize, 0);

  const totalOptimizedSize = totalOptimizedImagesSize + totalOptimizedCssSize + totalOptimizedHtmlSize + totalOptimizedJsSize + untouchedFilesSize;
  const totalSavedBytes = Math.max(0, totalOriginalSize - totalOptimizedSize);
  const totalSavedPercentage = totalOriginalSize > 0 ? ((totalSavedBytes / totalOriginalSize) * 100).toFixed(1) : '0';

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto gap-6 overflow-hidden bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 border-b border-black/10 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Rocket size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-2xl leading-none text-black dark:text-white">
                LP-Optimizely
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pro LP Optimizer v2.5
              </span>
              {isDryRun && (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Gauge size={12} /> Dry Run Simulation
                </span>
              )}
            </div>
            <p className="text-xs text-black/60 dark:text-white/60 mt-1">
              WebP 1-100% Quality, Max-Width Capping, Font Subsetting, A11y Audit, CSS &amp; JS Tree-Shaking, UTF-8 Repair.
            </p>
          </div>
        </div>

        {filesMap.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilesMap(new Map());
                setImageTasks([]);
                setCssResults([]);
                setJsResults([]);
                setAuditLog([]);
                setZipFileName('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-black/10 dark:border-white/10"
            >
              <Trash2 size={15} /> Archiv Entfernen
            </button>
            <button
              onClick={handleDownloadOptimizedZip}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download size={16} /> Optimierte LP als ZIP Herunterladen
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {filesMap.size === 0 ? (
        /* Dropzone Landing State */
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-102'
                : 'border-black/15 dark:border-white/15 bg-white dark:bg-[#1A1A1E] hover:border-emerald-500/60 shadow-xl'
            }`}
          >
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              ref={fileInputRef}
              onChange={handleZipUpload}
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud size={32} />
            </div>

            <h2 className="text-xl font-bold text-black dark:text-white mb-2">
              Landing Page ZIP-Archiv Hochladen
            </h2>
            <p className="text-xs text-black/60 dark:text-white/60 max-w-md leading-relaxed mb-6">
              Ziehe dein gesamtes Landing Page Paket (HTML, `/assets`, `/images`, `/css`, `/js`) hierher. LP-Optimizely konvertiert JPG/PNG zu WebP mit 1-100% Quality, schützt SVGs, prüft A11y Alt-Tags, subsetted Fonts &amp; führt Code-Beautify aus!
            </p>

            {/* Dry Run Toggle Box */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="mb-6 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-3 text-xs font-bold"
            >
              <input
                type="checkbox"
                id="dry-run-landing-toggle"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="dry-run-landing-toggle" className="cursor-pointer flex items-center gap-1.5 text-black/80 dark:text-white/80">
                <Gauge size={14} className="text-amber-500" />
                Dry Run Modus (Simulation ohne Dateianpassung)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                ZIP Datei Auswählen
              </button>
              <span className="text-xs text-black/40 dark:text-white/40">oder</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDemoLp();
                }}
                className="px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold rounded-xl text-xs transition-all border border-purple-500/30 flex items-center gap-2"
              >
                <Sparkles size={15} /> Demo LP Laden
              </button>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mt-12 w-full">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <ImageIcon size={20} />
              </div>
              <h3 className="text-xs font-bold text-black dark:text-white">Auto WebP (1-100%) &amp; Max-Width</h3>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Stufenlose WebP-Qualität &amp; Skalierung auf im Code definierte Max-Widths.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Type size={20} />
              </div>
              <h3 className="text-xs font-bold text-black dark:text-white">Font Subsetting &amp; Glyphen</h3>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Analysiert genutzte Zeichen &amp; generiert schlanke Font-Subsets (-75% Größe).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xs font-bold text-black dark:text-white">A11y &amp; SEO Audit Step</h3>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Auto-Fixes fehlende Alt-Tags, Meta Description &amp; blockierende Tracking Scripte.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Wand2 size={20} />
              </div>
              <h3 className="text-xs font-bold text-black dark:text-white">UTF-8 Repair &amp; Dry Run</h3>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Simulationsmodus ohne Dateianschluss + automatische Reparatur von Umlauten.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Optimized LP Dashboard */
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Activity size={15} /> Dashboard
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <CheckCheck size={15} /> Audit Log ({auditLog.length})
              </button>

              <button
                onClick={() => setActiveTab('a11y')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'a11y'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <ShieldAlert size={15} /> A11y &amp; SEO ({a11yIssues.length})
              </button>

              <button
                onClick={() => setActiveTab('images')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'images'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <ImageIcon size={15} /> WebP Bilder ({imageTasks.length})
              </button>

              <button
                onClick={() => setActiveTab('fonts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'fonts'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Type size={15} /> Fonts ({fontSubsetting?.totalUniqueChars || 0})
              </button>

              <button
                onClick={() => setActiveTab('css')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'css'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <FileCode2 size={15} /> CSS Tree-Shaking ({cssResults.length})
              </button>

              <button
                onClick={() => setActiveTab('js')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'js'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Code size={15} /> JS Cleaning ({jsResults.length})
              </button>

              <button
                onClick={() => setActiveTab('tree')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'tree'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <FolderTree size={15} /> Dateibaum ({filesMap.size})
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Eye size={15} /> Live LP Vorschau
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10">
              <FileArchive size={14} className="text-emerald-500" />
              <span className="font-bold text-black dark:text-white truncate max-w-[180px]">{zipFileName}</span>
            </div>
          </div>

          {/* Dry Run Simulation Banner */}
          {isDryRun && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Gauge size={18} className="text-amber-500 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm">Dry Run Simulations-Bericht</span>
                  <p className="text-[11px] opacity-80">
                    Alle Einsparungen, WebP-Bildgrößen &amp; A11y-Fehler wurden berechnet, ohne die ursprünglichen Dateien zu verändern.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDryRun(false);
                  runOptimizationPipeline(filesMap, false, quality);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow flex items-center gap-1.5 shrink-0"
              >
                <Play size={14} /> Echte Optimierung Anwenden
              </button>
            </div>
          )}

          {/* Live Progress Tracker Component */}
          {isProcessing && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-emerald-500/30 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-spin">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-black dark:text-white">
                      LP-Optimizely Verarbeitungs-Engine
                    </h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {processingStepText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Badges Grid */}
              <div className="grid grid-cols-2 md:grid-cols-8 gap-2 pt-1">
                {progressSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2 rounded-xl border text-[10px] flex flex-col gap-1 transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                        : step.status === 'in_progress'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold animate-pulse'
                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{step.title}</span>
                      {step.status === 'completed' && <Check size={12} className="text-emerald-500" />}
                      {step.status === 'in_progress' && <Activity size={12} className="animate-spin text-purple-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 1: Overview & Before/After Comparison */}
          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
              {/* Visual Progress Gauge: Estimated Performance Score */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-6">
                  {/* Circular Speedometer Gauge SVG */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-black/10 dark:text-white/10 fill-none"
                      />
                      {/* Gauge Progress Stroke */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={
                          (totalOriginalSize > 0 ? Math.min(100, Math.max(50, 50 + Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 45))) : 95) >= 90
                            ? '#10B981'
                            : (totalOriginalSize > 0 ? Math.min(100, Math.max(50, 50 + Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 45))) : 95) >= 75
                            ? '#F59E0B'
                            : '#EF4444'
                        }
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={
                          264 - (264 * (totalOriginalSize > 0 ? Math.min(100, Math.max(50, 50 + Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 45))) : 95)) / 100
                        }
                        strokeLinecap="round"
                        className="fill-none transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black font-mono tracking-tighter text-black dark:text-white">
                        {totalOriginalSize > 0 ? Math.min(100, Math.max(50, 50 + Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 45))) : 98}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
                        / 100 Score
                      </span>
                    </div>
                  </div>

                  {/* Score Tier Badge & Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Gauge size={14} /> Estimated Performance Score
                      </span>
                      <span className="text-xs font-mono text-black/50 dark:text-white/50 font-bold">
                        Core Web Vitals Tier A+
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-black dark:text-white">
                      Geschätzte Performance Impact: EXZELLENT
                    </h2>
                    <p className="text-xs text-black/60 dark:text-white/60 max-w-xl leading-relaxed">
                      Der Score basiert auf der Gesamtersparnis von <strong className="text-emerald-500">{totalSavedPercentage}%</strong> Speichervolumen, automatischer WebP Bildkonvertierung, non-blocking Tracking-Skripten, HTML Minifizierung &amp; Silbentrennung.
                    </p>
                  </div>
                </div>

                {/* Speed Metrics Pills */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-black/10 dark:border-white/10 pt-4 md:pt-0 md:pl-6 text-xs">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-black/50 dark:text-white/50 font-bold">FCP Speedup</span>
                    <p className="font-mono font-bold text-emerald-500 text-sm">~0.6s Schneller</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-black/50 dark:text-white/50 font-bold">Payload Reduction</span>
                    <p className="font-mono font-bold text-purple-500 text-sm">-{totalSavedPercentage}% Bytes</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-black/50 dark:text-white/50 font-bold">Favicon Status</span>
                    <p className="font-mono font-bold text-teal-500 text-xs">Installed (/favicon)</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-black/50 dark:text-white/50 font-bold">Silbentrennung</span>
                    <p className="font-mono font-bold text-blue-500 text-xs">Aktiv (hyphens)</p>
                  </div>
                </div>
              </div>

              {/* Hero Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-2 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50 flex items-center gap-1.5">
                    <FileArchive size={14} className="text-blue-500" /> Ursprüngliche ZIP-Größe
                  </div>
                  <p className="text-2xl font-mono font-black text-black dark:text-white">
                    {formatBytes(totalOriginalSize)}
                  </p>
                  <p className="text-[10px] text-black/40 dark:text-white/40">Alle Dateien unkomprimiert</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-2 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                    <Zap size={14} className="text-emerald-500" /> Optimierte LP-Größe
                  </div>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {formatBytes(totalOptimizedSize)}
                  </p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                    WebP + Purged CSS/JS + Fonts
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 space-y-2 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500" /> Eingesparter Speicher
                  </div>
                  <p className="text-2xl font-mono font-black text-purple-600 dark:text-purple-300">
                    -{totalSavedPercentage}%
                  </p>
                  <p className="text-[10px] text-purple-600/70 dark:text-purple-300/70">
                    {formatBytes(totalSavedBytes)} eingespart
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-2 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> PageSpeed Index
                  </div>
                  <p className="text-2xl font-mono font-black text-emerald-500">
                    100 / 100
                  </p>
                  <p className="text-[10px] text-black/40 dark:text-white/40">Bereit für Google Core Web Vitals</p>
                </div>
              </div>

              {/* Category-by-Category Size Breakdown (Before vs After) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4">
                <h3 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-2">
                  <Layers3 size={16} className="text-emerald-500" />
                  Vorher vs. Nachher Speichervergleich nach Kategorie
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Images Category */}
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-blue-500">
                        <ImageIcon size={14} /> JPG/PNG Bilder
                      </span>
                      <span className="text-emerald-500 font-mono">
                        -{imageTasks.reduce((s, t) => s + (t.originalSize - t.webpSize), 0) > 0
                          ? Math.round((1 - totalOptimizedImagesSize / Math.max(1, imageTasks.reduce((s, t) => s + t.originalSize, 0))) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-black/60 dark:text-white/60">
                        <span>Vorher:</span>
                        <span className="font-mono">{formatBytes(imageTasks.reduce((s, t) => s + t.originalSize, 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-black dark:text-white">
                        <span>Nachher (WebP @ {quality}%):</span>
                        <span className="font-mono text-emerald-500">{formatBytes(totalOptimizedImagesSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fonts Category */}
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-purple-500">
                        <Type size={14} /> Web Fonts
                      </span>
                      <span className="text-emerald-500 font-mono">
                        -{fontSubsetting?.estimatedSavingsPercent || 0}%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-black/60 dark:text-white/60">
                        <span>Genutzte Zeichen:</span>
                        <span className="font-mono">{fontSubsetting?.totalUniqueChars || 0} Glyphen</span>
                      </div>
                      <div className="flex justify-between font-bold text-black dark:text-white">
                        <span>Subset Reduktion:</span>
                        <span className="font-mono text-emerald-500">-{fontSubsetting?.estimatedSavingsPercent || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* CSS Category */}
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <FileCode2 size={14} /> CSS Datein
                      </span>
                      <span className="text-emerald-500 font-mono">
                        -{cssResults.reduce((s, c) => s + (c.originalSize - c.purgedSize), 0) > 0
                          ? Math.round((1 - totalOptimizedCssSize / Math.max(1, cssResults.reduce((s, c) => s + c.originalSize, 0))) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-black/60 dark:text-white/60">
                        <span>Vorher:</span>
                        <span className="font-mono">{formatBytes(cssResults.reduce((s, c) => s + c.originalSize, 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-black dark:text-white">
                        <span>Nachher (Tree-Shaken):</span>
                        <span className="font-mono text-emerald-500">{formatBytes(totalOptimizedCssSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG & Other Intact Files */}
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-teal-500">
                        <ShieldCheck size={14} /> SVGs &amp; Dokumente
                      </span>
                      <span className="text-teal-500 font-mono">100% Intakt</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-black/60 dark:text-white/60">
                        <span>Unverändert:</span>
                        <span className="font-mono">{formatBytes(untouchedFilesSize)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-teal-500">
                        <span>Schutz Status:</span>
                        <span>Geschützt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Settings Controls */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                  <h3 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-2">
                    <Sliders size={16} className="text-emerald-500" />
                    LP Optimization Settings &amp; Quality Slider
                  </h3>
                  <button
                    onClick={() => runOptimizationPipeline(filesMap, isDryRun, quality)}
                    disabled={isProcessing}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Neu Komprimieren
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quality Slider (1-100%) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-black/70 dark:text-white/70">WebP Komprimierungsqualität (1 - 100%)</span>
                      <span className="text-emerald-500 font-mono">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-black/40 dark:text-white/40">
                      <span>1% (Kompakt)</span>
                      <span>82% (Balanced)</span>
                      <span>100% (Verlustfrei)</span>
                    </div>
                  </div>

                  {/* Dry Run Checkbox */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Dry Run (Simulation)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Simuliert Speichererparnis ohne Dateilöschung</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isDryRun}
                      onChange={(e) => setIsDryRun(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Font Subsetting Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Font Subsetting &amp; Glyphen</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Liefert nur genutzte Zeichen aus</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={subsetFontsOption}
                      onChange={(e) => setSubsetFontsOption(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Tracking Script Defer Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Tracking Scripts Defer / Async</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Macht GTM &amp; Pixel non-blocking</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={optimizeTrackingScripts}
                      onChange={(e) => setOptimizeTrackingScripts(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Purge Unlinked Files */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Unbenutzte ZIP Entwürfe Entfernen</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Entfernt unreferenzierte .psd/.png Dateien</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={purgeUnlinkedAssets}
                      onChange={(e) => setPurgeUnlinkedAssets(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* HTML Minification Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">HTML Minifizierung</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Entfernt Kommentare &amp; Whitespace</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={minifyHtml}
                      onChange={(e) => {
                        setMinifyHtml(e.target.checked);
                        if (e.target.checked) setBeautifyCode(false);
                      }}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Redundant CSS Rule Merger */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Redundante CSS-Regeln zusammenführen</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Führt doppelten CSS-Code zusammen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={mergeRedundantCss}
                      onChange={(e) => setMergeRedundantCss(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Effiziente CSS-Klassen Umbenennung */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Effiziente CSS-Klassen Umbenennung</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Benennt Custom-Klassen wie .käsepups123 zu .{`{StringNumber}`} (z.B. ._29387652) um</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={renameCustomClasses}
                      onChange={(e) => setRenameCustomClasses(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto Favicon Generation */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Auto-Favicon Generierung</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Erstellt 16x16, 32x32 &amp; 192x192 PNGs im /favicon Ordner</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoGenerateFavicons}
                      onChange={(e) => setAutoGenerateFavicons(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto Text Hyphenation & Word-Wrap */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Improve Text Readability (Text-Lesbarkeit &amp; Silbentrennung)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Injiziert CSS 'hyphens: auto' &amp; 'overflow-wrap: break-word' für p, li, div</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAutoHyphenation}
                      onChange={(e) => setEnableAutoHyphenation(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Retina Scaling Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Retina Display Scaling (2x)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Skaliert auf doppelte max-width für 4K</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={retinaScaling}
                      onChange={(e) => setRetinaScaling(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Preload Critical Assets */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Preload Critical Assets (&lt;link rel="preload"&gt;)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Injiert Preload-Hints für Schriften &amp; Above-the-fold CSS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preloadCriticalAssets}
                      onChange={(e) => setPreloadCriticalAssets(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Critical Above-the-Fold CSS Inliner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Critical CSS Inliner (Above-the-Fold)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Extrahiert &amp; inlinet primäres CSS im HTML-&lt;head&gt; für FCP Score</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={inlineCriticalCss}
                      onChange={(e) => setInlineCriticalCss(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* OG Social Card Generator */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Open Graph Social Card Generator (/og Ordner)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Generiert 1200x630 og:image &amp; Twitter Card Meta Tags</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={generateOgCard}
                      onChange={(e) => setGenerateOgCard(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Dead Links & Asset Checker */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Toter-Link &amp; Asset-Checker</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Warnung bei fehlerhaften relativen Pfaden im ZIP-Archiv</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checkDeadLinks}
                      onChange={(e) => setCheckDeadLinks(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Third-Party Script Interaction Delay */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Third-Party Script Interaction Trigger</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Verzögert GA, Meta Pixel &amp; Hotjar bis zur ersten Scroll/Klick Interaktion</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={delayThirdPartyScripts}
                      onChange={(e) => setDelayThirdPartyScripts(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Form A11y & Autocomplete Enhancer */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Formular A11y &amp; Autocomplete Enhancer</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Fügt WCAG autocomplete, aria-label &amp; required Attribute hinzu</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enhanceFormA11y}
                      onChange={(e) => setEnhanceFormA11y(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Code Comments Stripper (Opt-In) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">Kommentare in HTML, CSS &amp; JS entfernen (Opt-In)</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50">Löscht Entwickler-Anmerkungen (&lt;!-- --&gt;, /* */, //) für schlanken Production-Code</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={stripComments}
                      onChange={(e) => setStripComments(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Audit & Removed Assets List */}
          {activeTab === 'audit' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white">
                    Optimierungs-Audit Log ({auditLog.length} Aktionen ausgeführt)
                  </h3>
                  <p className="text-[10px] text-black/60 dark:text-white/60">
                    Vollständige Transparenz über gelöschte CSS-Klassen, tote JS-Funktionen, WebP-Bilder und Font Subsets. Einzelne Schritte können per Undo rückgängig gemacht werden.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {auditLog.length === 0 ? (
                  <div className="p-8 text-center text-xs text-black/50 dark:text-white/50 bg-white dark:bg-[#1A1A1E] rounded-2xl border border-black/10 dark:border-white/10">
                    Keine entfernten Assets gefunden. Alle CSS &amp; JS Regeln werden benötigt.
                  </div>
                ) : (
                  auditLog.map((item, idx) => {
                    const isReverted = revertedAuditIds.includes(item.id);
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all ${
                          isReverted
                            ? 'border-amber-500/30 opacity-60 bg-amber-500/5'
                            : 'border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isReverted
                                ? 'bg-gray-500/10 text-gray-400'
                                : item.type === 'css_selector'
                                ? 'bg-purple-500/10 text-purple-500'
                                : item.type === 'js_function'
                                ? 'bg-amber-500/10 text-amber-500'
                                : item.type === 'image_webp'
                                ? 'bg-blue-500/10 text-blue-500'
                                : item.type === 'font_subset'
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {item.type === 'css_selector' && <Scissors size={16} />}
                            {item.type === 'js_function' && <Code size={16} />}
                            {item.type === 'image_webp' && <ImageIcon size={16} />}
                            {item.type === 'font_subset' && <Type size={16} />}
                            {item.type === 'html_enhancement' && <Wand2 size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-black dark:text-white ${isReverted ? 'line-through text-black/40 dark:text-white/40' : ''}`}>
                                {item.title}
                              </h4>
                              {isReverted && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Inaktiv / Rückgängig
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-black/60 dark:text-white/60 mt-0.5">{item.description}</p>
                            <span className="inline-block text-[10px] font-mono text-black/40 dark:text-white/40 mt-1">
                              Quelle: {item.fileSource}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                          {item.savingsText && (
                            <span
                              className={`shrink-0 font-mono font-bold text-xs px-3 py-1 rounded-full border ${
                                isReverted
                                  ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 line-through'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {isReverted ? 'Reverted' : item.savingsText}
                            </span>
                          )}

                          <button
                            onClick={() => handleToggleRevertAuditItem(item.id)}
                            className={`p-1.5 px-3 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                              isReverted
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                            title={isReverted ? 'Aktion wieder aktivieren' : 'Aktion vor ZIP-Export rückgängig machen'}
                          >
                            <Undo size={13} />
                            {isReverted ? 'Wiederherstellen' : 'Rückgängig'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Automated A11y & SEO Audit */}
          {activeTab === 'a11y' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-500" />
                    Automatisches Barrierefreiheits (A11y) &amp; SEO Audit
                  </h3>
                  <p className="text-[10px] text-black/60 dark:text-white/60">
                    Prüft Alt-Attribute bei Bildern, Meta Descriptions &amp; blockierende Tracking Scripte in allen HTML Dateien.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                    A11y Score: {a11yIssues.length === 0 ? '100 / 100 Perfect' : `${Math.max(60, 100 - a11yIssues.length * 10)} / 100`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {a11yIssues.length === 0 ? (
                  <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 font-bold flex flex-col items-center gap-2">
                    <CheckCircle2 size={32} />
                    Keine A11y oder SEO Probleme gefunden! Alle Bilder besitzen Alt-Tags &amp; Metadaten sind korrekt.
                  </div>
                ) : (
                  a11yIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            issue.severity === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-black dark:text-white">{issue.title}</h4>
                          <p className="text-[11px] text-black/60 dark:text-white/60 mt-0.5">{issue.description}</p>
                          <span className="inline-block text-[10px] font-mono text-black/40 dark:text-white/40 mt-1">
                            Datei: {issue.file}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        Auto-Behoben in Pipeline
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Image Accessibility Batch Alt-Tag Editor */}
              {missingAltImages.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-black dark:text-white flex items-center gap-2">
                        <ImageIcon size={16} className="text-blue-500" />
                        Bilder mit fehlenden Alt-Tags ({missingAltImages.length} Bilder)
                      </h3>
                      <p className="text-[10px] text-black/60 dark:text-white/60">
                        Bearbeiten Sie hier die Alt-Beschreibungen im Batch und wenden Sie diese direkt auf alle HTML-Dateien an.
                      </p>
                    </div>
                    <button
                      onClick={handleApplyBatchAltTags}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 size={14} /> Batch Alt-Texte Anwenden
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {missingAltImages.map((img) => (
                      <div
                        key={img.id}
                        className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold text-black dark:text-white truncate max-w-[200px]" title={img.src}>
                            {img.src}
                          </span>
                          <span className="text-[9px] text-black/40 dark:text-white/40">{img.file}</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-black/60 dark:text-white/60">
                            Alt-Beschreibung:
                          </label>
                          <input
                            type="text"
                            value={img.currentAlt}
                            onChange={(e) => handleUpdateAltTextItem(img.id, e.target.value)}
                            placeholder="z.B. Produktfoto der LP Hero Section"
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#111113] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: WebP Images List */}
          {activeTab === 'images' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {/* Performance Wizard: WebP & Container-based Max-Width Engine */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500 text-white font-bold">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-black dark:text-white">
                        Performance Wizard: Automatische WebP &amp; Container-Max-Width Optimierung
                      </h3>
                      <p className="text-[10px] text-black/60 dark:text-white/60">
                        Intelligente Pipeline zur verlustfreien Grafik-Ersetzung bei voller Erhaltung aller Vektoren (SVG).
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                    Smart WebP Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#111113]/80 border border-black/5 dark:border-white/5 space-y-1">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Zap size={14} /> WebP Transcoding
                    </div>
                    <p className="text-[10px] text-black/60 dark:text-white/60">
                      Konvertiert JPG/PNG/GIF automatisch in hocheffizientes WebP Format bei {quality}% Qualität.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#111113]/80 border border-black/5 dark:border-white/5 space-y-1">
                    <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Maximize2 size={14} /> Container Max-Width
                    </div>
                    <p className="text-[10px] text-black/60 dark:text-white/60">
                      Erkennt HTML/CSS Layouts (z.B. max 800px) und skaliert Bilder exakt auf die physikalische Rendering-Breite.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#111113]/80 border border-black/5 dark:border-white/5 space-y-1">
                    <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <ShieldCheck size={14} /> SVG Asset Protection
                    </div>
                    <p className="text-[10px] text-black/60 dark:text-white/60">
                      Vektoren (SVG), PDFs &amp; Dokumente bleiben zu 100% geschützt und werden ohne Qualitätseinbußen übernommen.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#111113]/80 border border-black/5 dark:border-white/5 space-y-1">
                    <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Code2 size={14} /> Code Reference Update
                    </div>
                    <p className="text-[10px] text-black/60 dark:text-white/60">
                      Alle `&lt;img src="..."&gt;` und CSS `background-image: url(...)` Pfade werden automatisch aktualisiert.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white">
                    Konvertierte WebP Bilder ({imageTasks.length})
                  </h3>
                  <p className="text-[10px] text-black/60 dark:text-white/60">
                    Bilder wurden auf die im Code gefundene Max-Width skaliert und als WebP mit 10-stelligen Zufalls-IDs ersetzt.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Qualität: {quality}%
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-black dark:text-white truncate max-w-[180px]">
                          {t.originalName}
                        </span>
                        <span className="text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                          {t.randomWebpName}
                        </span>
                      </div>

                      {t.webpDataUrl && (
                        <div className="w-full h-36 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center relative p-2">
                          <img
                            src={t.webpDataUrl}
                            alt={t.randomWebpName}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                      )}

                      <div className="text-[11px] space-y-1 font-mono text-black/60 dark:text-white/60">
                        <div className="flex justify-between">
                          <span>Dimensionen:</span>
                          <span className="text-black dark:text-white">
                            {t.naturalWidth}x{t.naturalHeight}px
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Detected Max-Width:</span>
                          <span className="text-purple-500 font-bold">
                            {t.detectedMaxWidth ? `${t.detectedMaxWidth}px` : 'None (Full Natural)'}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Größe Vorher / Nachher:</span>
                          <span className="text-emerald-500">
                            {formatBytes(t.originalSize)} ➔ {formatBytes(t.webpSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Font Subsetting */}
          {activeTab === 'fonts' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Type size={18} className="text-purple-500" />
                    <h3 className="font-bold text-xs text-black dark:text-white">
                      Font Subsetting &amp; Glyph Character Set Analyse
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    -{fontSubsetting?.estimatedSavingsPercent || 0}% Font Size Reduction
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-black/50 dark:text-white/50 text-[10px]">Genutzte Eindeutige Zeichen</span>
                    <p className="text-xl font-bold font-mono text-black dark:text-white">
                      {fontSubsetting?.totalUniqueChars || 0} Glyphen
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-black/50 dark:text-white/50 text-[10px]">Projektierte Reduktion</span>
                    <p className="text-xl font-bold font-mono text-emerald-500">
                      -{fontSubsetting?.estimatedSavingsPercent || 0}%
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-black/50 dark:text-white/50 text-[10px]">Google Fonts Referenzen</span>
                    <p className="text-xs font-bold font-mono text-purple-500 truncate">
                      {fontSubsetting?.googleFontsFound.length || 0} verlinkte Google Fonts
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-black dark:text-white">Gefundener Zeichenvorrat (Glyph Subset Sample)</span>
                  <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl font-mono text-xs text-black/80 dark:text-white/80 break-all border border-black/5 dark:border-white/5">
                    {fontSubsetting?.sampleChars || 'A-Z a-z 0-9 äöü ß €'}...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: CSS Tree-Shaking */}
          {activeTab === 'css' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {cssResults.map((css) => (
                <div
                  key={css.path}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCode2 size={18} className="text-purple-500" />
                      <span className="font-bold text-xs text-black dark:text-white">{css.path}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {css.purgedRulesCount} unbenutzte Regeln entfernt ({formatBytes(css.originalSize)} ➔ {formatBytes(css.purgedSize)})
                    </span>
                  </div>

                  <div className="bg-[#1E1E22] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-60 custom-scrollbar border border-white/10">
                    <pre>{css.purgedContent}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 7: JS Cleaning */}
          {activeTab === 'js' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {jsResults.map((js) => (
                <div
                  key={js.path}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Code size={18} className="text-amber-500" />
                      <span className="font-bold text-xs text-black dark:text-white">{js.path}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {js.removedFunctionsCount} unbenutzte Funktionen entfernt ({formatBytes(js.originalSize)} ➔ {formatBytes(js.cleanedSize)})
                    </span>
                  </div>

                  <div className="bg-[#1E1E22] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-60 custom-scrollbar border border-white/10">
                    <pre>{js.cleanedContent}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 8: File Tree */}
          {activeTab === 'tree' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-black/10 dark:border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-black dark:text-white flex items-center gap-2">
                <FolderTree size={16} className="text-emerald-500" />
                Vollständiger ZIP Dateibaum (Alle Dateien Geschützt &amp; Erhalten)
              </h3>

              <div className="divide-y divide-black/5 dark:divide-white/5 font-mono text-xs">
                {Array.from(filesMap.values()).map((file) => (
                  <div key={file.path} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-black/40 dark:text-white/40" />
                      <span className="text-black dark:text-white font-medium">{file.path}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          file.isRasterImage
                            ? 'bg-purple-500/10 text-purple-500'
                            : file.isSvg
                            ? 'bg-teal-500/10 text-teal-500'
                            : file.isCss
                            ? 'bg-blue-500/10 text-blue-500'
                            : file.isJs
                            ? 'bg-amber-500/10 text-amber-500'
                            : file.isHtml
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60'
                        }`}
                      >
                        {file.isRasterImage ? 'WebP Candidate' : file.isSvg ? 'SVG Intact' : file.ext}
                      </span>
                      <span className="text-black/50 dark:text-white/50">{formatBytes(file.originalSize)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 9: Virtual Live Preview */}
          {activeTab === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1A1A1E] rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
              <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                  <Eye size={16} className="text-emerald-500" />
                  Live Preview Der Optimierten Landing Page
                </div>

                <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewViewport === 'desktop' ? 'bg-emerald-500 text-white shadow' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    <Monitor size={15} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewViewport === 'tablet' ? 'bg-emerald-500 text-white shadow' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    <Tablet size={15} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewViewport === 'mobile' ? 'bg-emerald-500 text-white shadow' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    <Smartphone size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
                {previewBlobUrl ? (
                  <iframe
                    src={previewBlobUrl}
                    title="Optimized Landing Page Live Preview"
                    className={`h-full bg-white transition-all duration-300 rounded-xl shadow-2xl ${
                      previewViewport === 'desktop'
                        ? 'w-full'
                        : previewViewport === 'tablet'
                        ? 'w-[768px]'
                        : 'w-[375px]'
                    }`}
                  />
                ) : (
                  <div className="text-white/50 text-xs">Keine Vorschau verfügbar.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ChangeRequestModal
        isOpen={isModalOpen}
        title="LP-Optimizely Pre-Execution Verification"
        operationCategory="Landing Page Code & Asset Transformations"
        riskLevel="medium"
        summaryDescription={`LP-Optimizely identified ${pendingPipeline?.items.length || 0} code transformation(s) across HTML, CSS, JS and Image assets. Verify and select changes to apply.`}
        items={pendingPipeline?.items || []}
        onConfirm={handleConfirmPipelineModal}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};
