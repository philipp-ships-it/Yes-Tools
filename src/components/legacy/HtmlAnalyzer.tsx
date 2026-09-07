import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Link as LinkIcon, AlertTriangle, CheckCircle2, FileCode2, ChevronDown, ChevronUp, Accessibility, Search, Zap, ShieldAlert, LayoutTemplate, PanelRightClose, Copy, Check, Mail, Activity } from 'lucide-react';

interface ImageInfo {
  id: string;
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  isExternal: boolean;
  isDataUri: boolean;
  issues: string[];
}

interface LinkInfo {
  id: string;
  href: string | null;
  text: string;
  isExternal: boolean;
  issues: string[];
}

interface SyntaxIssue {
  id: string;
  message: string;
  line?: number;
}

interface GenericIssue {
  id: string;
  message: string;
  type: 'warning' | 'error';
}

interface HtmlAnalyzerProps {
  htmlContent: string;
  onToggle?: () => void;
}

const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export const HtmlAnalyzer: React.FC<HtmlAnalyzerProps> = ({ htmlContent, onToggle }) => {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [links, setLinks] = useState<LinkInfo[]>([]);
  const [syntaxIssues, setSyntaxIssues] = useState<SyntaxIssue[]>([]);
  
  const [a11yIssues, setA11yIssues] = useState<GenericIssue[]>([]);
  const [seoIssues, setSeoIssues] = useState<GenericIssue[]>([]);
  const [perfIssues, setPerfIssues] = useState<GenericIssue[]>([]);
  const [securityIssues, setSecurityIssues] = useState<GenericIssue[]>([]);
  const [structureIssues, setStructureIssues] = useState<GenericIssue[]>([]);
  const [legalIssues, setLegalIssues] = useState<GenericIssue[]>([]);
  const [emailIssues, setEmailIssues] = useState<GenericIssue[]>([]);
  
  const [expandedSection, setExpandedSection] = useState<'syntax' | 'images' | 'links' | 'a11y' | 'seo' | 'perf' | 'security' | 'structure' | 'legal' | 'email'>('syntax');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!htmlContent.trim()) {
      setImages([]);
      setLinks([]);
      setSyntaxIssues([]);
      setA11yIssues([]);
      setSeoIssues([]);
      setPerfIssues([]);
      setSecurityIssues([]);
      setStructureIssues([]);
      setLegalIssues([]);
      setEmailIssues([]);
      return;
    }

    try {
      // 1. Parse DOM for Images and Links
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // -- Analyze Images --
      const imgElements = Array.from(doc.querySelectorAll('img'));
      const parsedImages = imgElements.map((img, i) => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt');
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        
        const isExternal = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//');
        const isDataUri = src.startsWith('data:image/');
        
        const issues: string[] = [];
        if (!src) issues.push('Missing src attribute');
        else if (!isExternal && !isDataUri) issues.push('Relative URL (might be broken if hosted elsewhere)');
        
        if (alt === null) issues.push('Missing alt attribute (accessibility issue)');
        else if (alt.trim() === '') issues.push('Empty alt attribute');
        
        if (!width || !height) issues.push('Missing width/height (can cause layout shifts)');

        return {
          id: `img-${i}-${Date.now()}`,
          src,
          alt,
          width,
          height,
          isExternal,
          isDataUri,
          issues
        };
      });
      setImages(parsedImages);

      // -- Analyze Links --
      const linkElements = Array.from(doc.querySelectorAll('a'));
      const parsedLinks = linkElements.map((a, i) => {
        const href = a.getAttribute('href');
        const text = a.textContent || '';
        const isExternal = href ? (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) : false;
        
        const issues: string[] = [];
        if (href === null) issues.push('Missing href attribute');
        else if (href.trim() === '' || href === '#') issues.push('Empty or "#" href attribute');
        
        if (text.trim() === '' && a.children.length === 0) issues.push('Empty link text (accessibility issue)');
        if (isExternal && a.getAttribute('target') === '_blank' && !a.getAttribute('rel')?.includes('noopener')) {
          issues.push('Missing rel="noopener" for target="_blank"');
        }

        return {
          id: `link-${i}-${Date.now()}`,
          href,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          isExternal,
          issues
        };
      });
      setLinks(parsedLinks);

      // 2. Analyze Syntax (Basic Regex approach)
      const newSyntaxIssues: SyntaxIssue[] = [];
      
      // Check for unclosed/mismatched tags
      const tagRegex = /<\/?([a-zA-Z0-9\-]+)[^>]*>/g;
      let match;
      const stack: { tag: string; index: number }[] = [];
      
      while ((match = tagRegex.exec(htmlContent)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        const isClosing = fullTag.startsWith('</');
        const isSelfClosing = fullTag.endsWith('/>') || VOID_ELEMENTS.has(tagName);
        
        if (!isClosing && !isSelfClosing) {
          stack.push({ tag: tagName, index: match.index });
        } else if (isClosing) {
          if (stack.length === 0) {
            newSyntaxIssues.push({
              id: `syntax-close-${match.index}`,
              message: `Unexpected closing tag </${tagName}> without opening tag.`
            });
          } else {
            // Check if the tag is in the stack
            let stackIndex = -1;
            for (let i = stack.length - 1; i >= 0; i--) {
              if (stack[i].tag === tagName) {
                stackIndex = i;
                break;
              }
            }
            if (stackIndex !== -1) {
              // Found it, pop everything above it
              const unclosed = stack.splice(stackIndex + 1);
              unclosed.reverse().forEach(item => {
                newSyntaxIssues.push({
                  id: `syntax-unclosed-${item.index}`,
                  message: `Unclosed tag <${item.tag}>.`
                });
              });
              stack.pop(); // Pop the matching tag
            } else {
              newSyntaxIssues.push({
                id: `syntax-mismatch-${match.index}`,
                message: `Unexpected closing tag </${tagName}>.`
              });
            }
          }
        }
      }
      
      // Any remaining tags in stack are unclosed
      stack.forEach(item => {
        newSyntaxIssues.push({
          id: `syntax-unclosed-${item.index}`,
          message: `Unclosed tag <${item.tag}>.`
        });
      });

      // Check for multiple consecutive < or >
      if (/<{2,}/.test(htmlContent)) {
        newSyntaxIssues.push({ id: 'syntax-multiple-lt', message: 'Multiple consecutive "<" characters found.' });
      }
      if (/>{2,}/.test(htmlContent)) {
        newSyntaxIssues.push({ id: 'syntax-multiple-gt', message: 'Multiple consecutive ">" characters found.' });
      }

      setSyntaxIssues(newSyntaxIssues);

      // 3. Accessibility (a11y) Checks
      const newA11yIssues: GenericIssue[] = [];
      const buttons = doc.querySelectorAll('button');
      buttons.forEach((btn, i) => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          newA11yIssues.push({ id: `a11y-btn-${i}`, message: 'Button missing text or aria-label.', type: 'error' });
        }
      });

      const inputs = doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      inputs.forEach((input, i) => {
        const id = input.getAttribute('id');
        const hasLabel = id ? doc.querySelector(`label[for="${id}"]`) : false;
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
        if (!hasLabel && !hasAriaLabel) {
          newA11yIssues.push({ id: `a11y-input-${i}`, message: `Input (type="${input.getAttribute('type') || 'text'}") missing associated label or aria-label.`, type: 'warning' });
        }
      });

      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let lastLevel = 0;
      headings.forEach((h, i) => {
        const level = parseInt(h.tagName[1], 10);
        if (lastLevel > 0 && level - lastLevel > 1) {
          newA11yIssues.push({ id: `a11y-heading-${i}`, message: `Heading level skipped: H${lastLevel} to H${level}.`, type: 'warning' });
        }
        lastLevel = level;
      });

      if (!doc.documentElement.getAttribute('lang')) {
        newA11yIssues.push({ id: 'a11y-lang', message: 'Missing lang attribute on <html> tag.', type: 'warning' });
      }

      const iframes = doc.querySelectorAll('iframe');
      iframes.forEach((iframe, i) => {
        if (!iframe.getAttribute('title')) {
          newA11yIssues.push({ id: `a11y-iframe-${i}`, message: 'Iframe missing title attribute.', type: 'warning' });
        }
      });
      setA11yIssues(newA11yIssues);

      // 4. SEO & Meta Checks
      const newSeoIssues: GenericIssue[] = [];
      if (!doc.querySelector('title')) {
        newSeoIssues.push({ id: 'seo-title', message: 'Missing <title> tag in <head>.', type: 'warning' });
      }
      if (!doc.querySelector('meta[name="description"]')) {
        newSeoIssues.push({ id: 'seo-desc', message: 'Missing <meta name="description">.', type: 'warning' });
      }
      if (!doc.querySelector('meta[name="viewport"]')) {
        newSeoIssues.push({ id: 'seo-viewport', message: 'Missing <meta name="viewport">. Not mobile responsive.', type: 'error' });
      }
      if (!doc.querySelector('meta[property^="og:"]')) {
        newSeoIssues.push({ id: 'seo-og', message: 'Missing Open Graph tags (og:title, og:image) for social sharing.', type: 'warning' });
      }
      if (!doc.querySelector('link[rel="icon"]') && !doc.querySelector('link[rel="shortcut icon"]')) {
        newSeoIssues.push({ id: 'seo-favicon', message: 'Missing favicon link.', type: 'warning' });
      }
      const h1s = doc.querySelectorAll('h1');
      if (h1s.length === 0) {
        newSeoIssues.push({ id: 'seo-h1-missing', message: 'Missing <h1> tag. Good for SEO to have one.', type: 'warning' });
      } else if (h1s.length > 1) {
        newSeoIssues.push({ id: 'seo-h1-multiple', message: `Found ${h1s.length} <h1> tags. Best practice is usually one per page.`, type: 'warning' });
      }
      setSeoIssues(newSeoIssues);

      // 5. Performance & Best Practices
      const newPerfIssues: GenericIssue[] = [];
      const deprecatedTags = ['font', 'center', 'marquee', 'b', 'i', 'strike', 'u'];
      deprecatedTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        if (elements.length > 0) {
          newPerfIssues.push({ id: `perf-dep-${tag}`, message: `Found ${elements.length} deprecated <${tag}> tag(s). Use CSS or semantic tags instead.`, type: 'warning' });
        }
      });

      const inlineStyles = doc.querySelectorAll('[style]');
      if (inlineStyles.length > 10) {
        newPerfIssues.push({ id: 'perf-inline-styles', message: `Found ${inlineStyles.length} elements with inline styles. Consider using CSS classes.`, type: 'warning' });
      }

      const blockingScripts = doc.querySelectorAll('head script:not([defer]):not([async]):not([type="module"])');
      if (blockingScripts.length > 0) {
        newPerfIssues.push({ id: 'perf-scripts', message: `Found ${blockingScripts.length} render-blocking script(s) in <head>. Add 'defer' or 'async'.`, type: 'warning' });
      }

      const largeImages = doc.querySelectorAll('img:not([loading="lazy"])');
      if (largeImages.length > 3) {
        newPerfIssues.push({ id: 'perf-lazy-img', message: `Found ${largeImages.length} images without loading="lazy". Consider lazy loading offscreen images.`, type: 'warning' });
      }
      setPerfIssues(newPerfIssues);

      // 6. Security Checks
      const newSecurityIssues: GenericIssue[] = [];
      const insecureLinks = doc.querySelectorAll('[src^="http://"], [href^="http://"]');
      if (insecureLinks.length > 0) {
        newSecurityIssues.push({ id: 'sec-http', message: `Found ${insecureLinks.length} insecure HTTP link(s) or source(s). Use HTTPS.`, type: 'error' });
      }
      
      const inlineScripts = doc.querySelectorAll('script:not([src])');
      if (inlineScripts.length > 0) {
        newSecurityIssues.push({ id: 'sec-inline-script', message: `Found ${inlineScripts.length} inline script(s). This can violate strict Content Security Policies (CSP).`, type: 'warning' });
      }

      const targetBlankLinks = doc.querySelectorAll('a[target="_blank"]:not([rel~="noopener"])');
      if (targetBlankLinks.length > 0) {
        newSecurityIssues.push({ id: 'sec-target-blank', message: `Found ${targetBlankLinks.length} target="_blank" links missing rel="noopener". This is a security and performance risk.`, type: 'warning' });
      }
      setSecurityIssues(newSecurityIssues);

      // 7. Structure & Semantics
      const newStructureIssues: GenericIssue[] = [];
      const divButtons = doc.querySelectorAll('div[onclick]:not([role="button"]), span[onclick]:not([role="button"])');
      if (divButtons.length > 0) {
        newStructureIssues.push({ id: 'struct-div-btn', message: `Found ${divButtons.length} <div> or <span> with onClick but no role="button". Use <button> instead.`, type: 'warning' });
      }

      const landmarks = ['main', 'header', 'footer', 'nav'];
      const missingLandmarks = landmarks.filter(tag => !doc.querySelector(tag));
      if (missingLandmarks.length === landmarks.length) {
        newStructureIssues.push({ id: 'struct-landmarks', message: 'No semantic landmarks found (<main>, <header>, etc.).', type: 'warning' });
      }
      setStructureIssues(newStructureIssues);

      // 8. Legal & Compliance Checks (Newsletter focus)
      const newLegalIssues: GenericIssue[] = [];
      const textContent = doc.body.textContent?.toLowerCase() || '';
      
      const hasImpressum = textContent.includes('impressum') || textContent.includes('imprint') || textContent.includes('legal notice');
      if (!hasImpressum) {
        newLegalIssues.push({ id: 'legal-impressum', message: 'Missing "Impressum" or "Imprint" link/text. Legally required in many countries (e.g., DACH region).', type: 'error' });
      }

      const hasUnsubscribe = textContent.includes('unsubscribe') || textContent.includes('abmelden') || textContent.includes('austragen') || htmlContent.includes('*|UNSUB|*');
      if (!hasUnsubscribe) {
        newLegalIssues.push({ id: 'legal-unsub', message: 'Missing "Unsubscribe" or "Abmelden" link. Required by CAN-SPAM / GDPR.', type: 'error' });
      }

      const hasPrivacy = textContent.includes('privacy') || textContent.includes('datenschutz');
      if (!hasPrivacy) {
        newLegalIssues.push({ id: 'legal-privacy', message: 'Missing "Privacy Policy" or "Datenschutz" link.', type: 'warning' });
      }
      setLegalIssues(newLegalIssues);

      // 9. Email Best Practices Checks
      const newEmailIssues: GenericIssue[] = [];
      
      // Check for forbidden tags in email
      const forbiddenEmailTags = ['script', 'iframe', 'video', 'audio', 'form', 'input'];
      forbiddenEmailTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        if (elements.length > 0) {
          newEmailIssues.push({ id: `email-forbidden-${tag}`, message: `Found <${tag}> tag. These are widely unsupported or stripped by email clients.`, type: 'error' });
        }
      });

      // Check for background color on body
      const bodyHasBg = doc.body.hasAttribute('bgcolor') || (doc.body.getAttribute('style') || '').includes('background');
      if (!bodyHasBg) {
        newEmailIssues.push({ id: 'email-body-bg', message: 'No background color defined on <body>. Some email clients might render it transparent/black in dark mode.', type: 'warning' });
      }

      // Check for excessively wide images without max-width
      const imagesList = Array.from(doc.querySelectorAll('img'));
      let wideImages = 0;
      imagesList.forEach(img => {
        const widthAttr = img.getAttribute('width');
        const styleAttr = img.getAttribute('style') || '';
        if (widthAttr && parseInt(widthAttr) > 600 && !styleAttr.includes('max-width')) {
          wideImages++;
        }
      });
      if (wideImages > 0) {
        newEmailIssues.push({ id: 'email-wide-img', message: `Found ${wideImages} image(s) wider than 600px without 'max-width' CSS. May break layout on mobile.`, type: 'warning' });
      }

      // Check HTML size (Gmail clips at 102KB)
      const sizeKB = new Blob([htmlContent]).size / 1024;
      if (sizeKB > 102) {
        newEmailIssues.push({ id: 'email-size', message: `HTML size is ${sizeKB.toFixed(1)}KB. Gmail clips emails larger than 102KB.`, type: 'error' });
      }

      setEmailIssues(newEmailIssues);

    } catch (e) {
      console.error("Failed to parse HTML", e);
    }
  }, [htmlContent]);

  const generateReport = () => {
    let report = '# HTML Analysis Report\n\n';

    const addSection = (title: string, issues: any[], formatIssue: (issue: any) => string) => {
      if (issues.length > 0) {
        report += `## ${title} (${issues.length})\n`;
        issues.forEach(i => {
          report += `- ${formatIssue(i)}\n`;
        });
        report += '\n';
      } else {
        report += `## ${title}\n- No issues detected.\n\n`;
      }
    };

    addSection('Syntax Checks', syntaxIssues, i => i.message);
    
    const imgErrors = images.filter(img => img.issues.length > 0);
    if (imgErrors.length > 0) {
      report += `## Images with Issues (${imgErrors.length})\n`;
      imgErrors.forEach(img => {
        report += `- ${img.src || 'Unknown src'}:\n`;
        img.issues.forEach(issue => report += `  - ${issue}\n`);
      });
      report += '\n';
    }

    const linkErrors = links.filter(link => link.issues.length > 0);
    if (linkErrors.length > 0) {
      report += `## Links with Issues (${linkErrors.length})\n`;
      linkErrors.forEach(link => {
        report += `- ${link.href || 'Unknown href'}:\n`;
        link.issues.forEach(issue => report += `  - ${issue}\n`);
      });
      report += '\n';
    }

    addSection('Accessibility (a11y)', a11yIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('SEO & Meta', seoIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('Performance', perfIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('Security', securityIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('Structure & Best Practices', structureIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('Legal & Compliance', legalIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);
    addSection('Email Best Practices', emailIssues, i => `[${i.type.toUpperCase()}] ${i.message}`);

    return report;
  };

  const handleCopyReport = () => {
    const report = generateReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: 'syntax' | 'images' | 'links' | 'a11y' | 'seo' | 'perf' | 'security' | 'structure' | 'legal' | 'email') => {
    setExpandedSection(prev => prev === section ? prev : section);
  };

  const SectionHeader = ({ title, icon: Icon, count, section, errorCount = 0 }: any) => (
    <button 
      onClick={() => toggleSection(section)}
      className="w-full px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30 flex items-center gap-2 hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover transition-colors"
    >
      <Icon size={18} className={errorCount > 0 ? "text-amber-500" : "text-tg-light-primary dark:text-tg-dark-primary"} />
      <h3 className="font-semibold text-sm text-tg-light-text dark:text-tg-dark-text">{title}</h3>
      
      <div className="ml-auto flex items-center gap-2">
        {errorCount > 0 && (
          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <AlertTriangle size={10} /> {errorCount}
          </span>
        )}
        <span className="bg-tg-light-primary dark:bg-tg-dark-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
        {expandedSection === section ? <ChevronUp size={16} className="text-tg-light-hint" /> : <ChevronDown size={16} className="text-tg-light-hint" />}
      </div>
    </button>
  );

  const calculateHealthScore = () => {
    if (!htmlContent.trim()) return 100;
    let score = 100;
    score -= perfIssues.length * 5;
    score -= seoIssues.length * 4;
    score -= a11yIssues.length * 3;
    score -= securityIssues.length * 4;
    score -= structureIssues.length * 2;
    return Math.max(0, score);
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="flex flex-col h-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30">
        <div className="flex items-center gap-2 text-tg-light-text dark:text-tg-dark-text font-medium text-sm">
          <Search size={16} className="text-tg-light-primary dark:text-tg-dark-primary opacity-80" />
          <span>HTML Analyzer</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCopyReport}
            title="Copy Report for AI"
            className="p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors flex items-center gap-1"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
          {onToggle && (
            <button 
              onClick={onToggle}
              title="Collapse Analyzer"
              className="p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
            >
              <PanelRightClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Health Overview */}
      {htmlContent && (
        <div className="p-4 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/10 dark:bg-tg-dark-secondary/10 flex flex-col gap-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-tg-light-text dark:text-tg-dark-text">
                <Activity size={16} className={healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-amber-500' : 'text-red-500'} />
                Performance & Health Score
              </div>
              <div className={`text-sm font-bold ${healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {healthScore}/100
              </div>
           </div>
           
           <div className="w-full h-2 bg-tg-light-border dark:bg-tg-dark-border rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${healthScore > 80 ? 'bg-emerald-500' : healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${healthScore}%` }}
              />
           </div>

           <button
             onClick={() => {
                localStorage.setItem('html-tools-input', JSON.stringify(htmlContent));
                navigate('/performancetools');
             }}
             className="mt-1 flex items-center justify-center gap-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
           >
             <Zap size={14} /> Send to Performance Tools
           </button>
        </div>
      )}

      {/* Syntax Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Syntax Check" 
          icon={FileCode2} 
          count={syntaxIssues.length === 0 ? 'OK' : syntaxIssues.length} 
          errorCount={syntaxIssues.length}
          section="syntax" 
        />
        {expandedSection === 'syntax' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {syntaxIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No syntax issues detected.</span>
              </div>
            ) : (
              syntaxIssues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Images Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Images" 
          icon={ImageIcon} 
          count={images.length} 
          errorCount={images.reduce((acc, img) => acc + img.issues.length, 0)}
          section="images" 
        />
        {expandedSection === 'images' && (
          <div className="p-3 space-y-3 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[400px] overflow-y-auto">
            {images.length === 0 ? (
              <div className="text-center text-tg-light-hint dark:text-tg-dark-hint text-sm py-4">
                No images found.
              </div>
            ) : (
              images.map((img) => (
                <div key={img.id} className="bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-tg-light-secondary dark:bg-tg-dark-secondary flex-shrink-0 border border-tg-light-border dark:border-tg-dark-border overflow-hidden flex items-center justify-center">
                      {img.src ? (
                        <img src={img.src} alt={img.alt || ''} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <ImageIcon size={20} className="text-tg-light-hint opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-xs font-medium text-tg-light-text dark:text-tg-dark-text truncate" title={img.src}>{img.src || 'No Source'}</div>
                      <div className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint mt-1 flex gap-2">
                        <span>{img.isExternal ? '🌐 External' : img.isDataUri ? '📦 Data URI' : '📁 Relative'}</span>
                      </div>
                    </div>
                  </div>
                  {img.issues.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {img.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-md border border-amber-100 dark:border-amber-800/30">
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Links Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Links" 
          icon={LinkIcon} 
          count={links.length} 
          errorCount={links.reduce((acc, link) => acc + link.issues.length, 0)}
          section="links" 
        />
        {expandedSection === 'links' && (
          <div className="p-3 space-y-3 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[400px] overflow-y-auto">
            {links.length === 0 ? (
              <div className="text-center text-tg-light-hint dark:text-tg-dark-hint text-sm py-4">
                No links found.
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs font-medium text-tg-light-text dark:text-tg-dark-text truncate" title={link.href || ''}>
                      {link.href || 'No href'}
                    </div>
                    <div className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint mt-1 truncate">
                      Text: {link.text || '(empty)'}
                    </div>
                  </div>
                  {link.issues.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {link.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-md border border-amber-100 dark:border-amber-800/30">
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Accessibility Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Accessibility (a11y)" 
          icon={Accessibility} 
          count={a11yIssues.length === 0 ? 'OK' : a11yIssues.length} 
          errorCount={a11yIssues.length}
          section="a11y" 
        />
        {expandedSection === 'a11y' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {a11yIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No accessibility issues detected.</span>
              </div>
            ) : (
              a11yIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="SEO & Meta" 
          icon={Search} 
          count={seoIssues.length === 0 ? 'OK' : seoIssues.length} 
          errorCount={seoIssues.length}
          section="seo" 
        />
        {expandedSection === 'seo' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {seoIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No SEO issues detected.</span>
              </div>
            ) : (
              seoIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Performance Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Performance" 
          icon={Zap} 
          count={perfIssues.length === 0 ? 'OK' : perfIssues.length} 
          errorCount={perfIssues.length}
          section="perf" 
        />
        {expandedSection === 'perf' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {perfIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No performance issues detected.</span>
              </div>
            ) : (
              perfIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Security" 
          icon={ShieldAlert} 
          count={securityIssues.length === 0 ? 'OK' : securityIssues.length} 
          errorCount={securityIssues.length}
          section="security" 
        />
        {expandedSection === 'security' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {securityIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No security issues detected.</span>
              </div>
            ) : (
              securityIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Structure Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Structure & Semantics" 
          icon={LayoutTemplate} 
          count={structureIssues.length === 0 ? 'OK' : structureIssues.length} 
          errorCount={structureIssues.length}
          section="structure" 
        />
        {expandedSection === 'structure' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {structureIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No structure issues detected.</span>
              </div>
            ) : (
              structureIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legal & Compliance Section */}
      <div className="flex flex-col border-b border-tg-light-border dark:border-tg-dark-border">
        <SectionHeader 
          title="Legal & Compliance" 
          icon={ShieldAlert} 
          count={legalIssues.length === 0 ? 'OK' : legalIssues.length} 
          errorCount={legalIssues.length}
          section="legal" 
        />
        {expandedSection === 'legal' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {legalIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No legal/compliance issues detected.</span>
              </div>
            ) : (
              legalIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Email Best Practices Section */}
      <div className="flex flex-col">
        <SectionHeader 
          title="Email Best Practices" 
          icon={Mail} 
          count={emailIssues.length === 0 ? 'OK' : emailIssues.length} 
          errorCount={emailIssues.length}
          section="email" 
        />
        {expandedSection === 'email' && (
          <div className="p-3 space-y-2 bg-tg-light-surface dark:bg-tg-dark-surface max-h-[300px] overflow-y-auto">
            {emailIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 size={16} />
                <span>No email-specific issues detected.</span>
              </div>
            ) : (
              emailIssues.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${issue.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};
