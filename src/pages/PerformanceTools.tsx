import React, { useState, useRef } from 'react';
import { 
  Zap, Code2, Navigation, Image as ImageIcon, Box, Layout, ShieldAlert,
  Server, Smartphone, Globe, Search, ArrowRight, ShieldCheck, FileCode2, Info, UploadCloud, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

// Data structure for the tools and best practices
const categories = [
  {
    id: 'performance',
    title: 'Performance & Speed',
    icon: <Zap size={20} />,
    tools: [
      { id: 'html-min', name: 'HTML Minification', desc: 'Remove whitespace and comments', status: 'ready' },
      { id: 'css-min', name: 'CSS Minification', desc: 'Compress CSS files', status: 'ready' },
      { id: 'js-min', name: 'JavaScript Minification', desc: 'Shrink JS code', status: 'ready' },
      { id: 'img-opt', name: 'Image Optimization', desc: 'Compress and resize images', status: 'link', link: '/imagetools' },
      { id: 'lazy-load', name: 'Lazy Loading Snippets', desc: 'Generate intersection observer code', status: 'ready' },
      { id: 'resource-hints', name: 'Resource Hints', desc: 'Preload, prefetch & preconnect tags', status: 'ready' }
    ],
    practices: [
      {
        title: 'Core Web Vitals Target',
        content: 'Aim for LCP < 2.5s, INP < 200ms, and CLS < 0.1 to ensure a top-tier user experience.'
      },
      {
        title: 'Critical Rendering Path',
        content: 'Keep TTFB under 800ms. Inline critical CSS (under 14KB) and defer non-critical CSS/JS.'
      },
      {
        title: 'Image Strategy',
        content: 'Always define width/height to prevent layout shifts (CLS). Serve modern formats like WebP or AVIF.'
      }
    ]
  },
  {
    id: 'seo',
    title: 'SEO & Crawlability',
    icon: <Search size={20} />,
    tools: [
      { id: 'meta-tags', name: 'Meta Tag Generator', desc: 'Create perfect titles & descriptions', status: 'ready' },
      { id: 'canonical', name: 'Canonical Tag Generator', desc: 'Prevent duplicate content issues', status: 'ready' },
      { id: 'robots', name: 'Robots.txt Builder', desc: 'Manage crawler access easily', status: 'ready' }
    ],
    practices: [
      {
        title: 'Title & Meta descriptions',
        content: 'Titles should be 50-60 characters. Descriptions 150-160 characters, compelling and unique.'
      },
      {
        title: 'Heading Hierarchy',
        content: 'Ensure a single <h1> per page. Do not skip heading levels (e.g., jumping from h2 to h4).'
      },
      {
        title: 'Mobile-Friendly Design',
        content: 'Configure the viewport meta tag correctly. Ensure tap targets are at least 48px by 48px.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Quality',
    icon: <ShieldCheck size={20} />,
    tools: [
      { id: 'csp-gen', name: 'CSP Generator', desc: 'Content Security Policy builder', status: 'ready' },
      { id: 'sec-headers', name: 'Security Headers', desc: 'HSTS, X-Frame-Options & more', status: 'ready' },
      { id: 'sri-hash', name: 'SRI Hash Generator', desc: 'Create Subresource Integrity hashes', status: 'ready' }
    ],
    practices: [
      {
        title: 'Enforce HTTPS',
        content: 'Ensure all resources (images, scripts) are loaded via HTTPS to prevent mixed-content warnings.'
      },
      {
        title: 'XSS Prevention',
        content: 'Sanitize user input before rendering. Use DOMPurify and avoid innerHTML where possible.'
      },
      {
        title: 'Content Security Policy',
        content: 'Establish a strict default-src. Use nonces for inline scripts instead of unsafe-inline.'
      }
    ]
  }
];

export const PerformanceTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState(categories[0].id);
  const [activeTool, setActiveTool] = useState(categories[0].tools[0].id);
  
  // Try to load input from localStorage on mount
  const [toolInput, setToolInput] = useState(() => {
    try {
      const stored = localStorage.getItem('html-tools-input');
      return stored ? JSON.parse(stored) : '';
    } catch {
      return localStorage.getItem('html-tools-input') || '';
    }
  });
  
  const [toolOutput, setToolOutput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisActive, setAnalysisActive] = useState(false);
  const [analysisScore, setAnalysisScore] = useState(0);
  const [metrics, setMetrics] = useState({ domNodes: 0, htmlSize: 0, resources: 0 });
  const [extractedImages, setExtractedImages] = useState<File[]>([]);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendBackToHtmlTools = () => {
    if (toolOutput) {
      localStorage.setItem('html-tools-input', JSON.stringify(toolOutput));
      navigate('/');
    }
  };

  const processFileForAnalysis = async (file: File) => {
    setIsProcessing(true);
    try {
      let combinedHtmlText = '';
      let imagesFound: File[] = [];

      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        
        // Find HTML files
        const htmlFiles = Object.keys(loadedZip.files).filter(name => name.endsWith('.html') || name.endsWith('.htm'));
        for (const htmlName of htmlFiles) {
          const content = await loadedZip.files[htmlName].async('string');
          combinedHtmlText += content + '\n\n';
        }

        // Find Image files
        const imageFiles = Object.keys(loadedZip.files).filter(name => name.match(/\.(jpe?g|png|webp|gif|svg)$/i));
        for (const imgName of imageFiles) {
          if (loadedZip.files[imgName].dir) continue;
          
          const blob = await loadedZip.files[imgName].async('blob');
          const mimeType = imgName.endsWith('.svg') ? 'image/svg+xml' :
                           imgName.endsWith('.webp') ? 'image/webp' :
                           imgName.endsWith('.png') ? 'image/png' :
                           imgName.endsWith('.gif') ? 'image/gif' : 'image/jpeg';
                           
          const filename = imgName.split('/').pop() || imgName;
          imagesFound.push(new File([blob], filename, { type: mimeType }));
        }

      } else {
        combinedHtmlText = await file.text();
      }

      setAnalysisActive(true);
      setToolInput(combinedHtmlText);
      setExtractedImages(imagesFound);
      
      // Quick heuristic
      const parser = new DOMParser();
      const doc = parser.parseFromString(combinedHtmlText, 'text/html');
      
      let score = 100;
      if (!doc.title) score -= 10;
      if (!doc.documentElement.lang) score -= 5;
      score -= doc.querySelectorAll('img:not([alt])').length * 4;
      score -= doc.querySelectorAll('img:not([width]), img:not([height])').length * 3;
      score -= doc.querySelectorAll('script:not([async]):not([defer])').length * 5;
      score -= doc.querySelectorAll('style').length * 2;
      if (!doc.querySelector('meta[name="description"]')) score -= 5;
      if (!doc.querySelector('meta[name="viewport"]')) score -= 10;
      score = Math.max(0, score);
      
      setAnalysisScore(score);
      setMetrics({
        domNodes: doc.querySelectorAll('*').length,
        htmlSize: combinedHtmlText.length,
        resources: doc.querySelectorAll('img, script, link[rel="stylesheet"]').length
      });
    } catch (err) {
      console.error(err);
      alert('Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileForAnalysis(e.dataTransfer.files[0]);
    }
  };


  const handleToolAction = (toolId: string) => {
    switch (toolId) {
      case 'html-min':
        // Basic HTML minifier regex
        setToolOutput(
          toolInput
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .trim()
        );
        break;
      case 'css-min':
        setToolOutput(
          toolInput
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around syntax
            .trim()
        );
        break;
      case 'js-min':
        // Note: Real JS minification requires AST parsing, this is a very basic string replacement
        setToolOutput(
          toolInput
            .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
            .replace(/\/\/.*$/gm, '') // Line comments
            .replace(/\s+/g, ' ')
            .trim()
        );
        break;
      case 'lazy-load':
        setToolOutput(`<!-- Add loading="lazy" to images pointing below the fold -->
<img src="image.jpg" width="800" height="600" loading="lazy" alt="...">

<!-- JavaScript IntersectionObserver Snippet -->
<script>
document.addEventListener("DOMContentLoaded", function() {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
});
</script>`);
        break;
      case 'resource-hints':
        setToolOutput(`<!-- Preconnect: Establish early connections to important third-party origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- DNS-Prefetch: Fallback for preconnect -->
<link rel="dns-prefetch" href="https://example-analytics.com">

<!-- Preload: Force early fetch of critical resources (LCP image, critical font) -->
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

<!-- Prefetch: Fetch resources likely needed for the NEXT navigation -->
<link rel="prefetch" href="/next-page-chunk.js">`);
        break;
      case 'meta-tags':
        setToolOutput(`<!-- Primary Meta Tags -->
<title>Perfect Title (50-60 Chars)</title>
<meta name="description" content="A compelling description of the page content, kept between 150-160 characters to avoid truncation in SERPs.">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/">
<meta property="og:title" content="Perfect Title (50-60 Chars)">
<meta property="og:description" content="A compelling description of the page content...">
<meta property="og:image" content="https://example.com/social-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://example.com/">
<meta property="twitter:title" content="Perfect Title (50-60 Chars)">
<meta property="twitter:description" content="A compelling description of the page content...">
<meta property="twitter:image" content="https://example.com/social-image.jpg">`);
        break;
      case 'canonical':
        setToolOutput(`<!-- Add this inside the <head> of your page -->
<!-- It tells search engines which URL is the "master" version to index -->
<link rel="canonical" href="https://www.example.com/preferred-page-url" />`);
        break;
      case 'robots':
        setToolOutput(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /*?search=
Disallow: /*?sort=

# Optional: specifically allow Googlebot to images
User-agent: Googlebot-Image
Allow: /images/

Sitemap: https://www.example.com/sitemap.xml`);
        break;
      case 'csp-gen':
        setToolOutput(`<!-- Content Security Policy (Meta Tag Fallback) -->
<!-- Best applied as an HTTP Response Header -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-random123' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">`);
        break;
      case 'sec-headers':
        setToolOutput(`# Nginx Configuration for Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;`);
        break;
      case 'sri-hash':
        setToolOutput(`<!-- Subresource Integrity (SRI) -->
<!-- Ensures that the fetched resource has not been altered -->

<!-- Script Example -->
<script 
  src="https://code.jquery.com/jquery-3.6.0.min.js" 
  integrity="sha384-vtXRMe3mGCbOeY7l30aIg8H9p3GdeSe4IFlP6G8JMa7o7lXvnz3GFKzPxzJdPfGK" 
  crossorigin="anonymous">
</script>

<!-- Stylesheet Example -->
<link 
  rel="stylesheet" 
  href="https://cdn.example.com/style.css" 
  integrity="sha384-..." 
  crossorigin="anonymous" 
/>

// Note: To generate a real hash for your file, use a terminal command like:
// openssl dgst -sha384 -binary file.js | openssl base64 -A`);
        break;
      default:
        setToolOutput('Tool configuration loaded. Input data to process.');
    }
  };

  const activeCategoryData = categories.find(c => c.id === activeTab);
  const activeToolData = activeCategoryData?.tools.find(t => t.id === activeTool);

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto gap-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
          <Zap size={20} />
        </div>
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text">Web Quality Tools</h1>
          <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Performance, SEO, & Security Best Practices</p>
        </div>
      </div>

      {/* Dropzone & Quick Analysis Area */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div 
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' 
              : 'border-tg-light-border dark:border-tg-dark-border bg-tg-light-surface dark:bg-tg-dark-surface hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <input 
            type="file" 
            accept=".html,.htm,text/html,.zip" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => {
               if (e.target.files && e.target.files.length > 0) {
                 processFileForAnalysis(e.target.files[0]);
               }
            }}
          />
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-tg-light-bg dark:bg-tg-dark-bg text-tg-light-hint dark:text-tg-dark-hint'}`}>
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            ) : (
              <UploadCloud size={28} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text mb-2">
            {isProcessing ? 'Analyzing...' : isDragging ? 'Drop file or zip to analyze' : 'Drag & drop an HTML or ZIP file for a quick health check'}
          </h3>
          <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint max-w-md">
            Instantly measure your page’s fundamental performance, SEO structure, and resource bloat. Zips are auto-extracted.
          </p>
        </div>

        {/* Analysis Chart Section */}
        {analysisActive && (
          <div className="w-full bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-6 shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text flex items-center gap-2 mb-6">
              <Activity className="text-indigo-500" size={20} /> Overall Health Score
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 pl-4">
               {/* Big Circular/Bar Score */}
               <div className="flex items-center justify-center relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="64" cy="64" r="56" className="stroke-current text-tg-light-border dark:text-tg-dark-border" strokeWidth="12" fill="transparent" />
                     <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        className={`stroke-current transition-all duration-1000 ease-out ${analysisScore > 80 ? 'text-emerald-500' : analysisScore > 50 ? 'text-amber-500' : 'text-red-500'}`} 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 56}
                        strokeDashoffset={2 * Math.PI * 56 * (1 - analysisScore / 100)}
                        strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center tracking-tight">
                    <span className={`text-4xl font-extrabold ${analysisScore > 80 ? 'text-emerald-500' : analysisScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>{analysisScore}</span>
                  </div>
               </div>

               {/* Metrics Breakdown */}
               <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                 <div className="flex flex-col gap-2 p-4 bg-tg-light-bg dark:bg-tg-dark-bg rounded-xl border border-tg-light-border dark:border-tg-dark-border">
                   <div className="text-sm font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">DOM Nodes</div>
                   <div className={`text-2xl font-bold ${metrics.domNodes > 1500 ? 'text-red-500' : metrics.domNodes > 800 ? 'text-amber-500' : 'text-emerald-500'}`}>
                     {metrics.domNodes}
                   </div>
                   <div className="text-xs text-tg-light-hint dark:text-tg-dark-hint">Optimal &lt; 800</div>
                 </div>
                 <div className="flex flex-col gap-2 p-4 bg-tg-light-bg dark:bg-tg-dark-bg rounded-xl border border-tg-light-border dark:border-tg-dark-border">
                   <div className="text-sm font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Raw Input Size</div>
                   <div className={`text-2xl font-bold ${metrics.htmlSize > 100000 ? 'text-red-500' : 'text-tg-light-text dark:text-tg-dark-text'}`}>
                     {(metrics.htmlSize / 1024).toFixed(1)} KB
                   </div>
                   <div className="text-xs text-tg-light-hint dark:text-tg-dark-hint">Consider minification</div>
                 </div>
                 <div className="flex flex-col gap-2 p-4 bg-tg-light-bg dark:bg-tg-dark-bg rounded-xl border border-tg-light-border dark:border-tg-dark-border">
                   <div className="text-sm font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Ext. Resources</div>
                   <div className="text-2xl font-bold text-tg-light-text dark:text-tg-dark-text">
                     {metrics.resources}
                   </div>
                   <div className="text-xs text-tg-light-hint dark:text-tg-dark-hint">Images, scripts, styles</div>
                 </div>
               </div>
            </div>
            
            {extractedImages.length > 0 && (
              <div className="mt-8 border-t border-tg-light-border dark:border-tg-dark-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
                  <span className="font-semibold text-indigo-500">{extractedImages.length} images</span> found in this ZIP archive.
                </div>
                <button 
                  onClick={() => navigate('/imagetools', { state: { imageFiles: extractedImages } })}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <ImageIcon size={16} /> Optimize Extracted Images
                </button>
              </div>
            )}
            
            <div className={`mt-4 ${extractedImages.length === 0 ? 'border-t border-tg-light-border dark:border-tg-dark-border pt-4' : ''} text-sm text-tg-light-hint dark:text-tg-dark-hint text-center`}>
              Scroll down to manually generate optimisations, minified code, and secure headers for your website.
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pt-4">
        
        {/* Left Sidebar - Navigation */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar">
          {categories.map(cat => (
            <div key={cat.id} className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTab(cat.id);
                  setActiveTool(cat.tools[0].id);
                  setToolInput('');
                  setToolOutput('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === cat.id 
                    ? 'bg-tg-light-surface dark:bg-tg-dark-surface text-indigo-600 dark:text-indigo-400 shadow-sm border border-tg-light-border dark:border-tg-dark-border' 
                    : 'text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'
                }`}
              >
                {cat.icon}
                {cat.title}
              </button>
              
              {/* Tool List for Active Tab */}
              {activeTab === cat.id && (
                <div className="pl-6 flex flex-col gap-1 mt-1 mb-2">
                  {cat.tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (tool.status === 'link' && tool.link) {
                          navigate(tool.link);
                        } else {
                          setActiveTool(tool.id);
                          setToolInput('');
                          setToolOutput('');
                        }
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                        activeTool === tool.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'
                      }`}
                    >
                      <span className="truncate">{tool.name}</span>
                      {tool.status === 'link' && <ArrowRight size={12} className="opacity-50" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Center - Tool Workspace */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-4 md:p-6 overflow-hidden">
          <div className="flex items-center gap-2 pb-4 border-b border-tg-light-border dark:border-tg-dark-border shrink-0">
            <FileCode2 size={20} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text">
              {activeToolData?.name}
            </h2>
          </div>
          
          <div className="text-sm text-tg-light-hint dark:text-tg-dark-hint shrink-0">
            {activeToolData?.desc}
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {activeToolData?.status === 'ready' && (
              <>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <label className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider">Input</label>
                  <textarea
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder="Paste your code or content here..."
                    className="w-full h-32 md:h-48 bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-xl p-3 text-sm font-mono text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleToolAction(activeTool)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Process & Generate
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider">Output / Snippet</label>
                    {toolOutput && (
                      <button 
                         onClick={sendBackToHtmlTools}
                         className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/30"
                      >
                         <Code2 size={14} /> Send back to HTML Tools
                      </button>
                    )}
                  </div>
                  <textarea
                    readOnly
                    value={toolOutput}
                    placeholder="Generated result will appear here..."
                    className="w-full h-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-xl p-3 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Best Practices Context */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 md:p-6 border border-indigo-100 dark:border-indigo-900/30 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 pb-3 border-b border-indigo-200 dark:border-indigo-800">
            <Info size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Best Practices</h3>
          </div>

          <div className="flex flex-col gap-4">
            {activeCategoryData?.practices.map((practice, idx) => (
              <div key={idx} className="bg-white dark:bg-tg-dark-surface rounded-xl p-4 shadow-sm border border-indigo-50 dark:border-indigo-900/50">
                <h4 className="text-sm font-bold text-tg-light-text dark:text-tg-dark-text mb-1.5">{practice.title}</h4>
                <p className="text-xs leading-relaxed text-tg-light-hint dark:text-tg-dark-hint">{practice.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-900/30">
            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-200 mb-1 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Never Stop Optimizing
            </h4>
            <p className="text-xs leading-relaxed text-orange-700 dark:text-orange-300">
              Web standards change rapidly. Regularly audit your applications via Lighthouse to identify bottlenecks in LCP, speed drops, and new security threats.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
