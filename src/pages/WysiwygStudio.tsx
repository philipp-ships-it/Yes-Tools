import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCrossToolStore } from '../store/crossToolStore';
import { callOpenRouterChat, getOpenRouterApiKey, getOpenRouterModel } from '../services/openrouterService';
import Editor from '@monaco-editor/react';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { 
  Code2, 
  Eye, 
  SplitSquareHorizontal, 
  Folder, 
  FileCode, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Download, 
  Wand2, 
  Sparkles, 
  TerminalSquare, 
  Layers, 
  Type, 
  Layout, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  ChevronRight, 
  ChevronDown, 
  X, 
  HelpCircle, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RefreshCw, 
  Sliders, 
  Settings,
  PlusCircle,
  Box, 
  Grid, 
  MousePointer, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  ImageIcon, 
  Link, 
  Undo, 
  Redo,
  AlertTriangle,
  CheckCircle2,
  FilePlus,
  Search,
  FileArchive,
  Bot,
  Globe,
  Film,
  Image as ImageLucide,
  ShieldCheck,
  EyeOff,
  Play,
  Activity,
  CheckCircle,
  Maximize,
  Minimize,
  Command,
  Users,
  Zap,
  Replace,
  LayoutTemplate,
  History,
  Clock,
  Grid3X3,
  Ruler,
  UploadCloud,
  FileSearch,
  Layers3,
  Network,
  Split,
  FileText,
  LayoutGrid,
  BookOpen,
  Mail,
  Tag,
  Filter,
  FolderPlus,
  FolderOpen,
  FolderTree,
  Loader2,
  Send,
  CheckSquare,
  Square,
  Archive,
  FolderDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileDown,
  Workflow,
  Cpu,
  Lightbulb,
  MousePointer2,
  ShieldAlert,
  ListFilter,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';
import { fixMojibake } from '../lib/encodingFixer';
import htmlBeautify from 'js-beautify/js/lib/beautify-html.js';
import { CodeSnippet } from './ComponentStorage';

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface SeoData {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  favicon: string;
}

const parseSeoFromHtml = (html: string): SeoData => {
  if (typeof window === 'undefined') return { title: '', description: '', ogTitle: '', ogDescription: '', ogImage: '', favicon: '' };
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const title = doc.querySelector('title')?.textContent || '';
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href') || '';
  return { title, description, ogTitle, ogDescription, ogImage, favicon };
};

const updateSeoInHtml = (html: string, seo: SeoData): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let head = doc.querySelector('head');
  if (!head) {
    head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.body || doc.documentElement.firstChild);
  }

  // Update Title
  let titleEl = head.querySelector('title');
  if (!titleEl) {
    titleEl = doc.createElement('title');
    head.appendChild(titleEl);
  }
  titleEl.textContent = seo.title;

  // Update Meta Description
  let metaDesc = head.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = doc.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', seo.description);

  // Update OG Title
  let ogT = head.querySelector('meta[property="og:title"]');
  if (!ogT) {
    ogT = doc.createElement('meta');
    ogT.setAttribute('property', 'og:title');
    head.appendChild(ogT);
  }
  ogT.setAttribute('content', seo.ogTitle || seo.title);

  // Update OG Description
  let ogD = head.querySelector('meta[property="og:description"]');
  if (!ogD) {
    ogD = doc.createElement('meta');
    ogD.setAttribute('property', 'og:description');
    head.appendChild(ogD);
  }
  ogD.setAttribute('content', seo.ogDescription || seo.description);

  // Update OG Image
  if (seo.ogImage) {
    let ogI = head.querySelector('meta[property="og:image"]');
    if (!ogI) {
      ogI = doc.createElement('meta');
      ogI.setAttribute('property', 'og:image');
      head.appendChild(ogI);
    }
    ogI.setAttribute('content', seo.ogImage);
  }

  // Update Favicon
  if (seo.favicon) {
    let fav = head.querySelector('link[rel="icon"]');
    if (!fav) {
      fav = doc.createElement('link');
      fav.setAttribute('rel', 'icon');
      head.appendChild(fav);
    }
    fav.setAttribute('href', seo.favicon);
  }

  return doc.documentElement.outerHTML;
};

interface HealthIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'A11y' | 'SEO' | 'Security' | 'Syntax';
  title: string;
  description: string;
}

export interface QuickInsertBoilerplate {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

export const QUICK_INSERT_BOILERPLATES: QuickInsertBoilerplate[] = [
  {
    id: 'card',
    name: '💳 Card Komponente',
    category: 'UI Components',
    description: 'Responsive Karte mit Bild, Badge, Titel, Text & CTA Button',
    code: `<!-- Quick Insert: Card Component -->
<div class="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm mx-auto transition-all hover:shadow-2xl">
  <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop" alt="Card Banner" class="w-full h-48 object-cover rounded-xl mb-4" />
  <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">Featured</span>
  <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mt-2 mb-2">Smarte Karte</h3>
  <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Dies ist ein vorgefertigter Karten-Container mit Bild, Badge, Überschrift und Aktionstaste.</p>
  <button class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95">Jetzt Entdecken</button>
</div>`
  },
  {
    id: 'navbar',
    name: '🧭 Navigation Header',
    category: 'Layout',
    description: 'Header Leiste mit Logo, Navigations-Links & CTA Button',
    code: `<!-- Quick Insert: Navigation Header -->
<header class="w-full bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg">Y</div>
    <span class="font-extrabold text-base tracking-tight">YES Studio</span>
  </div>
  <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
    <a href="#features" class="hover:text-blue-400 transition-colors">Features</a>
    <a href="#solutions" class="hover:text-blue-400 transition-colors">Lösungen</a>
    <a href="#pricing" class="hover:text-blue-400 transition-colors">Preise</a>
    <a href="#contact" class="hover:text-blue-400 transition-colors">Kontakt</a>
  </nav>
  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95">Kostenlos Starten</button>
</header>`
  },
  {
    id: 'form',
    name: '📋 Formular Container',
    category: 'Formular',
    description: 'Kontakt & Lead-Formular mit Eingabefeldern und Button',
    code: `<!-- Quick Insert: Form Container -->
<div class="max-w-md mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
  <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-1">Kontakt aufnehmen</h3>
  <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Fülle das Formular aus, um sofort mit uns in Verbindung zu treten.</p>
  <form class="flex flex-col gap-4">
    <div>
      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vollständiger Name</label>
      <input type="text" placeholder="Max Mustermann" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div>
      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-Mail Adresse</label>
      <input type="email" placeholder="max@beispiel.de" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div>
      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nachricht</label>
      <textarea rows="4" placeholder="Deine Nachricht an uns..." class="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
    </div>
    <button type="button" class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95">Absenden & Bestätigen</button>
  </form>
</div>`
  },
  {
    id: 'hero',
    name: '🚀 Hero Banner',
    category: 'Hero',
    description: 'Imposanter Hero-Bereich mit Badge, Überschrift & CTA Buttons',
    code: `<!-- Quick Insert: Hero Section -->
<section class="w-full py-20 px-6 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white text-center flex flex-col items-center justify-center">
  <span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30 mb-4 animate-pulse">✨ Neu: Nativ AI Studio Ecosystem</span>
  <h1 class="text-4xl md:text-6xl font-black tracking-tight max-w-3xl leading-tight mb-6">Perfekte Landing Pages & E-Mail Mailings im Handumdrehen</h1>
  <p class="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed mb-8">Erstelle hochkonvertierende HTML & Tailwind Layouts mit professionellen Werkzeugen, Echtzeit-Vorschau und unbegrenzten Vorlagen.</p>
  <div class="flex items-center gap-4 flex-wrap justify-center">
    <button class="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xl transition-all active:scale-95">Jetzt Ausprobieren</button>
    <button class="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all">Dokumentation Ansehen</button>
  </div>
</section>`
  },
  {
    id: 'pricing',
    name: '🏷️ Pricing Table',
    category: 'Layout',
    description: '3-Spalten Preistabelle mit hervorgehobener Karte & Features',
    code: `<!-- Quick Insert: Pricing Container -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto p-6">
  <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
    <div>
      <h4 class="font-extrabold text-lg text-slate-900 dark:text-white">Starter</h4>
      <p class="text-xs text-slate-500 mb-4">Ideal für Einzelprojekte</p>
      <div class="text-3xl font-black text-slate-900 dark:text-white mb-6">0 € <span class="text-xs font-normal text-slate-400">/Monat</span></div>
      <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-6">
        <li>✓ 5 Templates Storage</li>
        <li>✓ Live HTML/CSS Editor</li>
        <li>✓ Standard Export</li>
      </ul>
    </div>
    <button class="w-full py-2.5 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all">Starten</button>
  </div>
  <div class="p-6 bg-gradient-to-b from-blue-600 to-indigo-700 text-white rounded-3xl shadow-2xl relative flex flex-col justify-between transform md:-translate-y-2">
    <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] uppercase shadow-md">Popular</span>
    <div>
      <h4 class="font-extrabold text-lg text-white">Pro Studio</h4>
      <p class="text-xs text-blue-100 mb-4">Für Profis & kleine Teams</p>
      <div class="text-3xl font-black text-white mb-6">29 € <span class="text-xs font-normal text-blue-200">/Monat</span></div>
      <ul class="text-xs text-blue-100 space-y-2 mb-6">
        <li>✓ Unbegrenzter Storage</li>
        <li>✓ KI Code Review & Auto-Fix</li>
        <li>✓ Structured ZIP Export</li>
        <li>✓ Full A11y & SEO Audit</li>
      </ul>
    </div>
    <button class="w-full py-2.5 rounded-xl bg-white text-blue-600 font-bold text-xs shadow-lg hover:bg-blue-50 transition-all">Pro Wählen</button>
  </div>
  <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
    <div>
      <h4 class="font-extrabold text-lg text-slate-900 dark:text-white">Enterprise</h4>
      <p class="text-xs text-slate-500 mb-4">Maßgeschneidert für Agenturen</p>
      <div class="text-3xl font-black text-slate-900 dark:text-white mb-6">99 € <span class="text-xs font-normal text-slate-400">/Monat</span></div>
      <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-6">
        <li>✓ Alle Pro Features</li>
        <li>✓ Custom Fonts & Brand Themes</li>
        <li>✓ Dedicated API Support</li>
      </ul>
    </div>
    <button class="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Anfragen</button>
  </div>
</div>`
  },
  {
    id: 'email-table',
    name: '📬 E-Mail Mailing Table (600px)',
    category: 'Mailing',
    description: 'Tabellen-Layout für Outlook & mobile Clients optimiert',
    code: `<!-- Quick Insert: 600px Responsive Table Layout for Email -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f9; font-family: Arial, sans-serif;">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="background-color: #1e1b4b; padding: 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold;">Sonderausgabe GeVestor</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px; color: #334155; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Sehr geehrte Damen und Herren,</p>
            <p>Willkommen zu unserer neuesten E-Mail Sonderausgabe. Hier finden Sie alle relevanten Informationen auf einen Blick.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://example.com" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Hier Klicken & Details Ansehen</a>
            </div>
            <p style="margin-bottom: 0;">Mit freundlichen Grüßen,<br/>Ihr Redaktionsteam</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background-color: #f8fafc; padding: 16px; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">© 2026 YES Investmedia. Alle Rechte vorbehalten. | <a href="#" style="color: #64748b;">Abmelden</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  },
  {
    id: 'footer',
    name: '🔻 Footer Section',
    category: 'Layout',
    description: 'Mehrspaltiger Fußzeilenbereich mit Social Links & Copyright',
    code: `<!-- Quick Insert: Multi-Column Footer -->
<footer class="w-full bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
    <div>
      <h4 class="text-white font-extrabold text-base mb-3">YES Studio</h4>
      <p class="text-xs leading-relaxed">Die führende Plattform für visuelle E-Mail & Landing-Page Gestaltung.</p>
    </div>
    <div>
      <h5 class="text-white font-bold text-xs uppercase tracking-wider mb-3">Werkzeuge</h5>
      <ul class="text-xs space-y-2">
        <li><a href="#" class="hover:text-white transition-colors">WYSIWYG Canvas</a></li>
        <li><a href="#" class="hover:text-white transition-colors">Monaco Code Editor</a></li>
        <li><a href="#" class="hover:text-white transition-colors">Templates Archiv</a></li>
      </ul>
    </div>
    <div>
      <h5 class="text-white font-bold text-xs uppercase tracking-wider mb-3">Ecosystem</h5>
      <ul class="text-xs space-y-2">
        <li><a href="#" class="hover:text-white transition-colors">A11y Auditor</a></li>
        <li><a href="#" class="hover:text-white transition-colors">KI Code Review</a></li>
        <li><a href="#" class="hover:text-white transition-colors">Dependency Graph</a></li>
      </ul>
    </div>
    <div>
      <h5 class="text-white font-bold text-xs uppercase tracking-wider mb-3">Rechtliches</h5>
      <ul class="text-xs space-y-2">
        <li><a href="#" class="hover:text-white transition-colors">Datenschutz</a></li>
        <li><a href="#" class="hover:text-white transition-colors">Impressum</a></li>
        <li><a href="#" class="hover:text-white transition-colors">AGB</a></li>
      </ul>
    </div>
  </div>
  <div class="max-w-6xl mx-auto border-t border-slate-900 pt-6 text-center text-[11px] text-slate-600">
    © 2026 YES Studio Ecosystem. Alle Rechte vorbehalten.
  </div>
</footer>`
  }
];

const calculateCodeHealth = (html: string): { score: number; issues: HealthIssue[] } => {
  const issues: HealthIssue[] = [];
  let deduction = 0;

  if (!html.toLowerCase().includes('<!doctype html>')) {
    deduction += 10;
    issues.push({
      id: 'doctype',
      type: 'warning',
      category: 'SEO',
      title: 'Fehlendes <!DOCTYPE html>',
      description: 'Standard HTML5 Browser benötigen DOCTYPE für korrekten Render-Modus.'
    });
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title check
  const title = doc.querySelector('title')?.textContent?.trim();
  if (!title) {
    deduction += 15;
    issues.push({
      id: 'no-title',
      type: 'error',
      category: 'SEO',
      title: 'Kein Seitentitel (<title>)',
      description: 'Suchmaschinen & Browser-Tabs benötigen einen prägnanten Titel.'
    });
  }

  // Img Alt check
  const imgs = Array.from(doc.querySelectorAll('img'));
  const missingAlt = imgs.filter(i => !i.hasAttribute('alt') || !i.getAttribute('alt')?.trim());
  if (missingAlt.length > 0) {
    deduction += Math.min(25, missingAlt.length * 8);
    issues.push({
      id: 'missing-alt',
      type: 'warning',
      category: 'A11y',
      title: `${missingAlt.length} Bild(er) ohne alt-Attribut`,
      description: 'Barrierefreiheit (Screenreader) erfordert alt-Texte für alle Grafiken.'
    });
  }

  // Viewport check
  const viewport = doc.querySelector('meta[name="viewport"]');
  if (!viewport) {
    deduction += 15;
    issues.push({
      id: 'no-viewport',
      type: 'warning',
      category: 'A11y',
      title: 'Fehlender Mobile Viewport Tag',
      description: 'Mobilgeräte benötigen <meta name="viewport" content="width=device-width, initial-scale=1.0">.'
    });
  }

  // HTTP Links check
  const httpLinks = Array.from(doc.querySelectorAll('script[src^="http:"], link[href^="http:"], img[src^="http:"]'));
  if (httpLinks.length > 0) {
    deduction += 10;
    issues.push({
      id: 'http-mixed-content',
      type: 'error',
      category: 'Security',
      title: `${httpLinks.length} Unsichere HTTP-Ressource(n)`,
      description: 'Ressourcen sollten stets über https:// geladen werden.'
    });
  }

  const score = Math.max(0, 100 - deduction);
  return { score, issues };
};

export interface A11yIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  title: string;
  selector: string;
  recommendation: string;
}

export const runAccessibilityScan = (html: string): { score: number; issues: A11yIssue[] } => {
  const issues: A11yIssue[] = [];
  if (typeof window === 'undefined') return { score: 100, issues: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Missing lang attribute on <html>
  const htmlEl = doc.querySelector('html');
  if (!htmlEl || !htmlEl.getAttribute('lang')) {
    issues.push({
      id: 'missing-lang',
      severity: 'error',
      wcagLevel: 'A',
      title: 'Fehlendes lang-Attribut im <html> Tag',
      selector: 'html',
      recommendation: 'Füge lang="de" (oder en) hinzu, damit Screenreader die Sprache erkennen.'
    });
  }

  // 2. Images missing alt
  const imgs = Array.from(doc.querySelectorAll('img'));
  imgs.forEach((img, idx) => {
    if (!img.hasAttribute('alt') || !img.getAttribute('alt')?.trim()) {
      issues.push({
        id: `img-alt-${idx}`,
        severity: 'error',
        wcagLevel: 'A',
        title: `Bild #${idx + 1} ohne alt-Beschreibung`,
        selector: img.id ? `#${img.id}` : img.className ? `img.${img.className.split(' ')[0]}` : `img[src*="${img.getAttribute('src')?.substring(0, 15) || ''}"]`,
        recommendation: 'Screenreader benötigen ein beschreibendes alt="Text" Attribut.'
      });
    }
  });

  // 3. Interactive elements (button, a) without label or aria-label
  const buttonsAndLinks = Array.from(doc.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]'));
  buttonsAndLinks.forEach((el, idx) => {
    const text = el.textContent?.trim();
    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    const title = el.getAttribute('title');
    const hasImageAlt = el.querySelector('img[alt]') !== null;

    if (!text && !ariaLabel && !title && !hasImageAlt) {
      issues.push({
        id: `interactive-aria-${idx}`,
        severity: 'error',
        wcagLevel: 'AA',
        title: `Interaktives Element <${el.tagName.toLowerCase()}> ohne Text oder aria-label`,
        selector: el.id ? `#${el.id}` : `<${el.tagName.toLowerCase()}>`,
        recommendation: 'Füge aria-label="Button Beschreibung" oder sichtbaren Text hinzu.'
      });
    }
  });

  // 4. Form inputs missing label
  const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]), select, textarea'));
  inputs.forEach((input, idx) => {
    const id = input.getAttribute('id');
    const hasAssociatedLabel = id ? doc.querySelector(`label[for="${id}"]`) !== null : false;
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    const hasPlaceholder = input.hasAttribute('placeholder') && !hasAssociatedLabel && !hasAriaLabel;

    if (!hasAssociatedLabel && !hasAriaLabel) {
      issues.push({
        id: `input-label-${idx}`,
        severity: hasPlaceholder ? 'warning' : 'error',
        wcagLevel: 'A',
        title: `Eingabefeld <${input.tagName.toLowerCase()}> hat kein <label>`,
        selector: id ? `#${id}` : input.getAttribute('name') ? `input[name="${input.getAttribute('name')}"]` : `Form Input #${idx + 1}`,
        recommendation: 'Jedes Eingabefeld benötigt ein <label for="..."> oder ein aria-label="...".'
      });
    }
  });

  // 5. Heading Hierarchy Check
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const h1Count = headings.filter(h => h.tagName.toLowerCase() === 'h1').length;
  if (h1Count === 0) {
    issues.push({
      id: 'no-h1',
      severity: 'warning',
      wcagLevel: 'AA',
      title: 'Keine Hauptüberschrift (<h1>) auf der Seite',
      selector: 'body',
      recommendation: 'Eine barrierefreie Struktur benötigt genau eine <h1> Überschrift.'
    });
  } else if (h1Count > 1) {
    issues.push({
      id: 'multiple-h1',
      severity: 'info',
      wcagLevel: 'AA',
      title: `Mehrere (${h1Count}) <h1> Überschriften gefunden`,
      selector: 'h1',
      recommendation: 'Es wird empfohlen, pro Seite nur eine zentrale <h1> Überschrift zu verwenden.'
    });
  }

  let prevLevel = 0;
  headings.forEach((h, idx) => {
    const level = parseInt(h.tagName.substring(1), 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      issues.push({
        id: `heading-skip-${idx}`,
        severity: 'warning',
        wcagLevel: 'AA',
        title: `Überschriftenebene übersprungen: <h${prevLevel}> direkt gefolgt von <h${level}>`,
        selector: `<${h.tagName.toLowerCase()}>`,
        recommendation: 'Überschriften sollten hierarchisch ohne Stufenverlust platziert werden (z.B. h1 -> h2 -> h3).'
      });
    }
    prevLevel = level;
  });

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 7));

  return { score, issues };
};

export interface CssVariable {
  name: string;
  value: string;
  type: 'color' | 'size' | 'text';
}

export const parseCssVariablesFromHtml = (html: string): CssVariable[] => {
  const vars: CssVariable[] = [];
  const rootRegex = /:root\s*\{([^}]+)\}/gi;
  let match;
  while ((match = rootRegex.exec(html)) !== null) {
    const blockContent = match[1];
    const lineRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = lineRegex.exec(blockContent)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();
      const isColor = value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl');
      const isSize = value.endsWith('px') || value.endsWith('rem') || value.endsWith('em') || value.endsWith('%');
      vars.push({
        name,
        value,
        type: isColor ? 'color' : isSize ? 'size' : 'text'
      });
    }
  }
  return vars;
};

export const updateCssVariableInHtml = (html: string, varName: string, newValue: string): string => {
  if (!html.includes(':root')) {
    const rootBlock = `<style>\n:root {\n  ${varName}: ${newValue};\n}\n</style>`;
    if (html.includes('</head>')) {
      return html.replace('</head>', `${rootBlock}\n</head>`);
    }
    return `${rootBlock}\n${html}`;
  }

  const varRegex = new RegExp(`(${varName}\\s*:\\s*)[^;]+;`, 'g');
  if (varRegex.test(html)) {
    return html.replace(varRegex, `$1${newValue};`);
  } else {
    return html.replace(':root {', `:root {\n  ${varName}: ${newValue};`);
  }
};

export interface StarterTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  iconName: string;
  previewBg: string;
  htmlContent: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'saas-landing',
    title: 'SaaS & App Landing Page',
    category: 'Marketing',
    description: 'Moderne Landing Page mit Dark-Mode Hero, Feature Grid, Interaktivem Preisschema & Testimonials.',
    badge: 'Popular',
    iconName: 'Zap',
    previewBg: 'from-blue-900 to-slate-900',
    htmlContent: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex SaaS & AI Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --brand-primary: #3b82f6;
      --brand-accent: #8b5cf6;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
  
  <!-- Navigation -->
  <header class="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/25">A</div>
        <span class="font-black text-xl tracking-tight text-white">APEX<span class="text-blue-500">.AI</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-blue-400 transition-colors">Features</a>
        <a href="#pricing" class="hover:text-blue-400 transition-colors">Preise</a>
        <a href="#testimonials" class="hover:text-blue-400 transition-colors">Kunden</a>
      </nav>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white">Anmelden</button>
        <button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95">Kostenlos Starten</button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative py-24 px-6 max-w-5xl mx-auto text-center flex flex-col items-center gap-6 overflow-hidden">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
      <span>✨ Apex Engine v3.0 ist Live</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl">
      Echtzeit-Analyse &amp; KI-Automatisierung für deine Workflows
    </h1>
    <p class="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
      Skaliere deine digitale Infrastruktur mit automatisierten Dashboards, intelligentem Prompt-Engineering und blazingschnellen API-Integrationen.
    </p>
    <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
      <button class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95">14 Tage Gratis Testen</button>
      <button class="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm transition-all">Demo-Video Ansehen</button>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-black text-white">Leistungsstarke Funktionen</h2>
      <p class="text-sm text-slate-400 mt-2">Alles was du für moderne Webentwicklung benötigst</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-blue-500/50 transition-all flex flex-col gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">⚡</div>
        <h3 class="text-xl font-bold text-white">Sub-Millisekunden Latenz</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Verarbeite Millionen von Datenpunkten in Echtzeit mit unserer optimierten In-Memory Engine.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-purple-500/50 transition-all flex flex-col gap-4">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl">🛡️</div>
        <h3 class="text-xl font-bold text-white">Enterprise Sicherheit</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Ende-zu-Ende Verschlüsselung, SOC2 Typ II zertifiziert mit rollenbasierten Zugriffskontrollen.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">🤖</div>
        <h3 class="text-xl font-bold text-white">Natives KI-Copilot Framework</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Integrierte GenAI-Modelle für automatische Code-Generierung und intelligentes Refactoring.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-12 px-6 text-center text-xs text-slate-500">
    <p>&copy; 2026 Apex AI Technologies. Alle Rechte vorbehalten.</p>
  </footer>

</body>
</html>`
  },
  {
    id: 'dev-portfolio',
    title: 'Developer & Creator Portfolio',
    category: 'Personal',
    description: 'Sleek dark portfolio for developers, UX designers & creators with skills timeline & showcase grid.',
    badge: 'Pro',
    iconName: 'Code2',
    previewBg: 'from-purple-900 to-slate-900',
    htmlContent: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Rivera &mdash; Senior Full-Stack Engineer</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-200 font-sans antialiased min-h-screen">
  
  <div class="max-w-4xl mx-auto px-6 py-16 flex flex-col gap-16">
    
    <!-- Hero Profile -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-12">
      <div class="flex items-center gap-5">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl">AR</div>
        <div>
          <h1 class="text-2xl font-black text-white">Alex Rivera</h1>
          <p class="text-xs text-purple-400 font-mono font-bold mt-0.5">Senior Fullstack Architect &amp; Creative Coder</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[11px] text-slate-400">Verfügbar für ausgewählte Projekte &amp; Advisory</span>
          </div>
        </div>
      </div>
      <button class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all">Kontakt Aufnehmen</button>
    </header>

    <!-- Tech Stack Grid -->
    <section class="flex flex-col gap-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Tech Stack &amp; Spezialisierung</h2>
      <div class="flex flex-wrap gap-2">
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">React / Next.js</span>
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">TypeScript</span>
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">Tailwind CSS</span>
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">Node.js / Express</span>
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">PostgreSQL</span>
        <span class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">Gemini &amp; OpenAI SDK</span>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="flex flex-col gap-6">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Ausgewählte Projekte</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 rounded-3xl bg-slate-900 border border-white/10 flex flex-col gap-3 group hover:border-purple-500/50 transition-all">
          <span class="text-[10px] uppercase font-bold text-purple-400 font-mono">SaaS Platform</span>
          <h3 class="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Quantum Editor Engine</h3>
          <p class="text-xs text-slate-400 leading-relaxed">Browserbasierter Code &amp; Design-Editor mit HMR und Echtzeit-Kollaboration.</p>
        </div>
        <div class="p-6 rounded-3xl bg-slate-900 border border-white/10 flex flex-col gap-3 group hover:border-purple-500/50 transition-all">
          <span class="text-[10px] uppercase font-bold text-purple-400 font-mono">AI Infrastructure</span>
          <h3 class="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Pulse LLM Router</h3>
          <p class="text-xs text-slate-400 leading-relaxed">Smart Multi-Model Gateway zur automatischen Kosten- und Latenzoptimierung.</p>
        </div>
      </div>
    </section>

  </div>

</body>
</html>`
  },
  {
    id: 'analytics-dashboard',
    title: 'SaaS Admin & Analytics Dashboard',
    category: 'Dashboard',
    description: 'Vollständiges Dashboard mit Sidebar, KPI-Cards Row, interaktiver Chart-Vorschau & Transaktionstabelle.',
    badge: 'Enterprise',
    iconName: 'Activity',
    previewBg: 'from-emerald-900 to-slate-900',
    htmlContent: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Portal Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 font-sans antialiased min-h-screen flex">
  
  <!-- Sidebar -->
  <aside class="w-64 bg-slate-950 border-r border-white/10 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
    <div class="flex flex-col gap-8">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">N</div>
        <span class="font-extrabold text-lg text-white">NEXUS<span class="text-emerald-400">.OPS</span></span>
      </div>
      <nav class="flex flex-col gap-1 text-xs font-bold text-slate-400">
        <a href="#" class="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center gap-2">📊 Overview</a>
        <a href="#" class="px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">👥 User Control</a>
        <a href="#" class="px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">💳 Transactions</a>
        <a href="#" class="px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">⚙️ System Settings</a>
      </nav>
    </div>
    <div class="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">ADMIN</div>
      <div>
        <h4 class="text-xs font-bold text-white">System Admin</h4>
        <span class="text-[10px] text-slate-400">admin@nexus.io</span>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-8 flex flex-col gap-8 overflow-auto">
    
    <!-- Top Header -->
    <header class="flex items-center justify-between border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl font-black text-white">System Übersicht</h1>
        <p class="text-xs text-slate-400 mt-1">Echtzeit-Metriken der letzten 24 Stunden</p>
      </div>
      <button class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg transition-all">Bericht Exportieren</button>
    </header>

    <!-- KPI Cards Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl bg-slate-950 border border-white/10 flex flex-col gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Monatlicher Umsatz (MRR)</span>
        <h2 class="text-3xl font-black text-white">€ 42.850,00</h2>
        <span class="text-[11px] text-emerald-400 font-bold">▲ +14,2% im Vergleich zum Vormonat</span>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-white/10 flex flex-col gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Aktive Nutzer</span>
        <h2 class="text-3xl font-black text-white">12.490</h2>
        <span class="text-[11px] text-emerald-400 font-bold">▲ +8,5% neue Registrierungen</span>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-white/10 flex flex-col gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Server Latency</span>
        <h2 class="text-3xl font-black text-white">18 ms</h2>
        <span class="text-[11px] text-emerald-400 font-bold">● Operational (99,99% Uptime)</span>
      </div>
    </div>

  </main>

</body>
</html>`
  },
  {
    id: 'ecommerce-product',
    title: 'E-Commerce Product Detail Page',
    category: 'Shop',
    description: 'Produkt-Detailansicht mit Bilder-Galerie, Farb- & Größen-Auswahl, Lagerbestand & Kundenbewertungen.',
    badge: 'Clean',
    iconName: 'Box',
    previewBg: 'from-amber-900 to-slate-900',
    htmlContent: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Noise Cancelling Headphones &mdash; Shop</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
  
  <div class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    
    <!-- Product Gallery -->
    <div class="flex flex-col gap-4">
      <div class="aspect-square bg-slate-900 rounded-3xl p-8 flex items-center justify-center text-6xl shadow-xl relative overflow-hidden">
        🎧
        <span class="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase">Neuheit 2026</span>
      </div>
    </div>

    <!-- Product Details -->
    <div class="flex flex-col gap-6">
      <div>
        <span class="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">AURA SOUND LABS</span>
        <h1 class="text-3xl font-black text-slate-900 mt-1">Aura Studio Pro Wireless ANC</h1>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-amber-500 text-sm">★★★★★</span>
          <span class="text-xs font-bold text-slate-600">(128 Bewertungen)</span>
        </div>
      </div>

      <div class="flex items-baseline gap-3">
        <span class="text-3xl font-black text-slate-900">€ 299,00</span>
        <span class="text-sm text-slate-400 line-through">€ 349,00</span>
      </div>

      <p class="text-xs text-slate-600 leading-relaxed">
        Aktive Geräuschunterdrückung der nächsten Generation mit bis zu 40 Stunden Akkulaufzeit, Hi-Res Audio Treibern und Ultra-Komfort Memory-Foam Ohrpolstern.
      </p>

      <div class="flex items-center gap-4 pt-2">
        <button class="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-95">In den Warenkorb</button>
        <button class="px-5 py-3.5 rounded-2xl border border-slate-300 font-bold text-sm hover:bg-slate-100 transition-all">🤍</button>
      </div>
    </div>

  </div>

</body>
</html>`
  }
];

export interface AiOptimizationTip {
  id: string;
  type: 'redundant' | 'conflict' | 'layout' | 'a11y' | 'responsive';
  severity: 'warning' | 'info' | 'suggestion';
  title: string;
  description: string;
  suggestedClasses?: string;
}

export const analyzeElementForAiOptimization = (tag: string, classesStr: string, textContent: string): AiOptimizationTip[] => {
  const tips: AiOptimizationTip[] = [];
  if (!classesStr) return tips;

  const classes = classesStr.trim().split(/\s+/);

  // 1. Redundant Padding / Margin Check
  const paddings = classes.filter(c => /^p[xytlr]?-\d+$/.test(c));
  if (paddings.length > 2) {
    tips.push({
      id: 'redundant-padding',
      type: 'redundant',
      severity: 'warning',
      title: 'Redundantes Padding entdeckt',
      description: `Es wurden mehrere Padding-Klassen (${paddings.join(', ')}) gefunden. Verwende 'px-' & 'py-' für sauberen Code.`
    });
  }

  // 2. Conflicting Flex Direction
  if (classes.includes('flex-row') && classes.includes('flex-col')) {
    tips.push({
      id: 'conflict-flex',
      type: 'conflict',
      severity: 'warning',
      title: 'Konflikt in Flex-Richtung',
      description: "'flex-row' und 'flex-col' schließen sich gegenseitig aus. Entferne die nicht gewünschte Ausrichtung."
    });
  }

  // 3. Layout Optimization: Gap vs Margin
  if (classes.includes('flex') && !classes.some(c => c.startsWith('gap-')) && (classes.includes('space-x-2') || classes.includes('space-y-2'))) {
    tips.push({
      id: 'layout-gap',
      type: 'layout',
      severity: 'suggestion',
      title: 'Empfehlung: Verwende modernere gap-Klassen',
      description: "Verwende 'gap-3' oder 'gap-4' anstelle von 'space-x-2' für flexiblere CSS-Grid & Flexbox Abstände."
    });
  }

  // 4. Accessibility Check
  if ((tag === 'button' || tag === 'a') && !textContent.trim()) {
    tips.push({
      id: 'a11y-label',
      type: 'a11y',
      severity: 'warning',
      title: 'Missing Accessibility Label',
      description: "Interaktive Elemente ohne sichtbaren Text benötigen aria-label=\"Aktionsname\" für Screenreader."
    });
  }

  // 5. Responsive Design Suggestion
  if (classes.includes('w-[500px]') || classes.includes('w-[600px]')) {
    tips.push({
      id: 'responsive-width',
      type: 'responsive',
      severity: 'suggestion',
      title: 'Feste Pixelbreite schränkt Mobile-Ansicht ein',
      description: "Nutze 'w-full max-w-lg' anstelle fester Pixelbreiten für perfekte Skalierung auf Smartphones."
    });
  }

  return tips;
};

export interface ProjectVersionSnapshot {
  id: string;
  name: string;
  timestamp: string;
  files: ProjectFile[];
  activeFileId: string;
  changeSummary: string;
}

export interface AiCodeReviewIssue {
  id: string;
  category: 'performance' | 'seo' | 'a11y' | 'clean-code';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  autoFixable: boolean;
}

export const generateAiCodeReview = (htmlContent: string): { score: number; issues: AiCodeReviewIssue[] } => {
  const issues: AiCodeReviewIssue[] = [];
  if (!htmlContent) return { score: 100, issues };

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // 1. Performance - Head Script Placement
  const headScripts = doc.querySelectorAll('head script:not([defer]):not([async])');
  if (headScripts.length > 0) {
    issues.push({
      id: 'perf-script-blocking',
      category: 'performance',
      severity: 'warning',
      title: 'Blockierendes Script im <head>',
      description: `Es wurden ${headScripts.length} Script-Tag(s) im <head> ohne 'defer' oder 'async' Attribute gefunden.`,
      impact: 'Verzögert das First Contentful Paint (FCP) für Besucher.',
      recommendation: "Ergänze `defer` oder `async` bei externen Script-Imports.",
      autoFixable: true
    });
  }

  // 2. Performance - Inline Data Images
  const inlineDataImages = doc.querySelectorAll('img[src^="data:image"]');
  if (inlineDataImages.length > 0) {
    issues.push({
      id: 'perf-inline-base64',
      category: 'performance',
      severity: 'warning',
      title: 'Inline Base64 Data-URL Bilder',
      description: `${inlineDataImages.length} Bild(er) sind direkt als Base64-String im HTML eingebettet.`,
      impact: 'Erhöht die reine HTML-Dokumentengröße massiv und erschwert Caching.',
      recommendation: 'Lagere Medien in externe WebP/SVG Asset-URLs aus.',
      autoFixable: false
    });
  }

  // 3. Performance - Missing Image Lazy Loading
  const nonLazyImages = doc.querySelectorAll('img:not([loading="lazy"])');
  if (nonLazyImages.length > 2) {
    issues.push({
      id: 'perf-lazy-loading',
      category: 'performance',
      severity: 'info',
      title: 'Fehlendes Native Lazy Loading',
      description: `${nonLazyImages.length} Bilder laden ohne loading="lazy".`,
      impact: 'Erhöht den Datenverbrauch vor der ersten Interaktion.',
      recommendation: 'Nutze `loading="lazy"` für untergeordnete Bildinhalte.',
      autoFixable: true
    });
  }

  // 4. SEO - Title tag optimization
  const titleEl = doc.querySelector('title');
  if (!titleEl || !titleEl.textContent?.trim()) {
    issues.push({
      id: 'seo-missing-title',
      category: 'seo',
      severity: 'error',
      title: 'Fehlender Seitentitel (<title>)',
      description: 'Das Dokument besitzt keinen Seitentitel im <head>.',
      impact: 'Kritischer SEO-Nachteil im Ranking & unvollständige Tab-Anzeige.',
      recommendation: 'Erstelle ein präsentes <title> Tag mit 30-60 Zeichen.',
      autoFixable: true
    });
  } else if (titleEl.textContent.length < 15 || titleEl.textContent.length > 70) {
    issues.push({
      id: 'seo-title-length',
      category: 'seo',
      severity: 'info',
      title: 'Suboptimale Titellänge',
      description: `Der Titel hat ${titleEl.textContent.length} Zeichen (Empfohlen: 30-60 Zeichen).`,
      impact: 'Titel wird in Google SERPs evtl. abgeschnitten.',
      recommendation: 'Passe die Titellänge auf ca. 50 aussagekräftige Zeichen an.',
      autoFixable: false
    });
  }

  // 5. SEO - Meta Description
  const metaDesc = doc.querySelector('meta[name="description"]');
  if (!metaDesc || !metaDesc.getAttribute('content')?.trim()) {
    issues.push({
      id: 'seo-missing-meta-desc',
      category: 'seo',
      severity: 'warning',
      title: 'Fehlende Meta Description',
      description: 'Keine Meta Description für Suchmaschinen-Snippets definiert.',
      impact: 'Google zeigt zufälligen Textausschnitt statt optimierter Beschreibung.',
      recommendation: 'Füge `<meta name="description" content="..." />` mit ca. 120-155 Zeichen ein.',
      autoFixable: true
    });
  }

  // 6. SEO - OpenGraph Meta Tags
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    issues.push({
      id: 'seo-missing-og',
      category: 'seo',
      severity: 'info',
      title: 'Fehlende OpenGraph Social Sharing Tags',
      description: 'Keine og:title oder og:image Metadaten im Dokument vorhanden.',
      impact: 'Beim Teilen auf Slack, WhatsApp oder LinkedIn fehlen Vorschaukarten.',
      recommendation: 'Ergänze og:title, og:description und og:image Tags.',
      autoFixable: true
    });
  }

  // 7. Clean Code - H1 Element Hierarchy
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length === 0) {
    issues.push({
      id: 'clean-missing-h1',
      category: 'clean-code',
      severity: 'warning',
      title: 'Fehlende <h1> Hauptüberschrift',
      description: 'Das Dokument besitzt keine eindeutige <h1> Überschrift.',
      impact: 'Erschwert die semantische Dokumentstruktur für SEO & Screenreader.',
      recommendation: 'Erstelle eine prägnante <h1> Überschrift im Hero-Bereich.',
      autoFixable: true
    });
  } else if (h1s.length > 1) {
    issues.push({
      id: 'clean-multiple-h1',
      category: 'clean-code',
      severity: 'info',
      title: 'Mehrere <h1> Überschriften',
      description: `Es wurden ${h1s.length} <h1> Elemente im Dokument gefunden.`,
      impact: 'Verwässert den semantischen Fokus der Seite.',
      recommendation: 'Wandle sekundäre Überschriften in <h2> um.',
      autoFixable: true
    });
  }

  // Calculate Score
  let score = 100;
  issues.forEach(iss => {
    if (iss.severity === 'error') score -= 25;
    else if (iss.severity === 'warning') score -= 12;
    else if (iss.severity === 'info') score -= 5;
  });
  score = Math.max(20, Math.min(100, score));

  return { score, issues };
};

// --- HSL Color Math & Theme Palette Generator ---
export interface ColorSchemeOption {
  type: 'Complementary' | 'Analogous' | 'Triadic' | 'Split-Complementary' | 'Monochromatic';
  title: string;
  colors: string[];
}

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255 || 0.2;
  const g = parseInt(c.substring(2, 4), 16) / 255 || 0.4;
  const b = parseInt(c.substring(4, 6), 16) / 255 || 0.9;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const hNorm = ((h % 360 + 360) % 360) / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  let r: number, g: number, b: number;
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    const hue2rgb = (pVal: number, qVal: number, tVal: number) => {
      let t = tVal;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return pVal + (qVal - pVal) * 6 * t;
      if (t < 1/2) return qVal;
      if (t < 2/3) return pVal + (qVal - pVal) * (2/3 - t) * 6;
      return pVal;
    };
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const generateHslThemePalettes = (htmlContent: string): { primaryHex: string; schemes: ColorSchemeOption[] } => {
  const hexMatches = htmlContent.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  const filtered = hexMatches.filter(h => !['#000', '#fff', '#ffffff', '#000000', '#111', '#222', '#18181b', '#0f172a', '#e2e8f0'].includes((h as string).toLowerCase()));
  const primaryHex = filtered[0] || '#2563eb';

  const { h, s, l } = hexToHsl(primaryHex);

  const schemes: ColorSchemeOption[] = [
    {
      type: 'Complementary',
      title: 'Komplementär (Kontrastreich & Dynamisch)',
      colors: [
        hslToHex(h, s, l),
        hslToHex(h, Math.max(20, s - 20), Math.min(90, l + 25)),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 180) % 360, Math.max(30, s - 15), Math.max(15, l - 20)),
        hslToHex(h, 10, 96)
      ]
    },
    {
      type: 'Analogous',
      title: 'Analog (Harmonisch & Ausgewogen)',
      colors: [
        hslToHex((h - 30 + 360) % 360, s, l),
        hslToHex(h, s, l),
        hslToHex((h + 30) % 360, s, l),
        hslToHex((h + 60) % 360, Math.max(20, s - 10), Math.min(85, l + 15)),
        hslToHex(h, 15, 12)
      ]
    },
    {
      type: 'Triadic',
      title: 'Triadisch (Lebendig & Vielseitig)',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
        hslToHex((h + 120) % 360, 20, 95),
        hslToHex(h, 10, 18)
      ]
    },
    {
      type: 'Split-Complementary',
      title: 'Split-Komplementär (Modern & Raffiniert)',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
        hslToHex(h, 30, 92),
        hslToHex((h + 150) % 360, 20, 15)
      ]
    },
    {
      type: 'Monochromatic',
      title: 'Monochrom (Sanft & Elegant)',
      colors: [
        hslToHex(h, s, Math.max(15, l - 30)),
        hslToHex(h, s, Math.max(25, l - 15)),
        hslToHex(h, s, l),
        hslToHex(h, Math.max(15, s - 25), Math.min(85, l + 20)),
        hslToHex(h, Math.max(10, s - 40), Math.min(96, l + 35))
      ]
    }
  ];

  return { primaryHex, schemes };
};

// --- Dependency Graph & Unused Asset Analyzer ---
export interface DependencyNode {
  id: string;
  label: string;
  type: 'file' | 'css-var' | 'component' | 'asset' | 'script';
  status?: 'active' | 'orphaned';
  details?: string;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: 'imports' | 'uses-var' | 'renders' | 'loads';
}

export const analyzeDependencyGraph = (files: { name: string; content: string; type: string }[]): { nodes: DependencyNode[]; links: DependencyLink[] } => {
  const nodes: DependencyNode[] = [];
  const links: DependencyLink[] = [];

  files.forEach(f => {
    nodes.push({ id: f.name, label: f.name, type: 'file', details: `${f.content.length} Bytes (${f.type})` });
  });

  const allContent = files.map(f => f.content).join('\n');

  const cssVarDefMatches = Array.from(allContent.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)).map(m => `--${m[1]}`);
  const uniqueCssVars = Array.from(new Set(cssVarDefMatches));

  uniqueCssVars.forEach(v => {
    const isUsed = allContent.includes(`var(${v})`) || allContent.includes(`var( ${v} )`);
    const status = isUsed ? 'active' : 'orphaned';

    nodes.push({ id: v, label: v, type: 'css-var', status, details: isUsed ? 'Aktiv via var()' : '⚠️ Unbenutzte Variable (Orphan)' });

    files.forEach(f => {
      if (f.content.includes(`${v}:`)) {
        links.push({ source: f.name, target: v, type: 'uses-var' });
      }
    });
  });

  const htmlFile = files.find(f => f.type === 'html');
  if (htmlFile) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, 'text/html');
    const sections = doc.querySelectorAll('header, nav, section, footer, main, form');

    sections.forEach((sec, idx) => {
      const compName = sec.tagName.toLowerCase() + (sec.id ? `#${sec.id}` : sec.className ? `.${sec.className.split(' ')[0]}` : `[${idx + 1}]`);
      const compId = `comp-${sec.tagName.toLowerCase()}-${idx}`;
      nodes.push({ id: compId, label: `<${compName}>`, type: 'component', details: `${sec.children.length} Kind-Elemente` });
      links.push({ source: htmlFile.name, target: compId, type: 'renders' });
    });

    const scripts = doc.querySelectorAll('script[src], link[href]');
    scripts.forEach((s, idx) => {
      const src = s.getAttribute('src') || s.getAttribute('href') || '';
      if (src && !src.includes('stylesheet')) {
        const assetId = `asset-${idx}`;
        const isCdn = src.startsWith('http');
        nodes.push({ id: assetId, label: src.split('/').pop() || src, type: isCdn ? 'script' : 'asset', details: src });
        links.push({ source: htmlFile.name, target: assetId, type: 'loads' });
      }
    });
  }

  return { nodes, links };
};

// --- Documentation & README Generator ---
export const generateProjectDocumentationMarkdown = (
  projectName: string,
  files: { name: string; content: string; type: string }[],
  healthScore: number,
  seoScore: number
): string => {
  const htmlFile = files.find(f => f.type === 'html');
  let title = projectName || 'YES Web Studio Application';
  let desc = 'Eine moderne, performante Webanwendung, erstellt mit dem YES Studio WYSIWYG Builder.';

  if (htmlFile) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, 'text/html');
    const t = doc.querySelector('title')?.textContent;
    if (t) title = t;
    const d = doc.querySelector('meta[name="description"]')?.getAttribute('content');
    if (d) desc = d;
  }

  return `# ${title}

> ${desc}

---

## 🚀 Projekt-Übersicht & Qualitäts-Audit

- **Entwickelt mit:** YES Studio WYSIWYG Code Builder
- **Code-Health Score:** ${healthScore}%
- **SEO & Performance Score:** ${seoScore}%
- **Letzte Aktualisierung:** ${new Date().toLocaleDateString('de-DE')}

---

## 📁 Dateistruktur & Projektbaum

\`\`\`text
.
${files.map(f => `├── ${f.name} (${f.content.length} Bytes)`).join('\n')}
\`\`\`

---

## 🎨 Design System & Framework Integrations

- **Tailwind CSS Integration:** CDN v3 / JIT Compiler
- **Integrierte Webfonts:** Plus Jakarta Sans / Google Fonts
- **Responsive Breakpoints:** Mobile (375px), Tablet (768px), Desktop (1280px+)

---

## 🛠️ Lokale Ausführung & Deployment Guide

1. **Option A: Direkt im Browser nutzen**
   Öffne die \`index.html\` Datei direkt in jedem modernen Webbrowser.

2. **Option B: Lokaler Live-Server (Node.js)**
   \`\`\`bash
   npx serve .
   \`\`\`

3. **Export:**
   Klicke oben auf **"ZIP Export"**, um das komplette Projekt inkl. aller HTML/CSS/JS-Dateien herunterzuladen.
`;
};

interface ProjectFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'asset';
  folder?: string;
  content: string;
  fakePath?: string;
  size?: number;
  isBinary?: boolean;
}

const DEFAULT_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'index-html',
    name: 'index.html',
    type: 'html',
    folder: 'root',
    content: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YES Studio Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
  
  <!-- Header / Navbar -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">Y</div>
        <span class="font-extrabold text-xl tracking-tight text-slate-900">YES Studio</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <a href="#features" class="hover:text-blue-600 transition-colors">Features</a>
        <a href="#showcase" class="hover:text-blue-600 transition-colors">Showcase</a>
        <a href="#contact" class="hover:text-blue-600 transition-colors">Kontakt</a>
      </nav>
      <button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all">
        Jetzt Starten
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="py-20 px-6 text-center max-w-4xl mx-auto">
    <span class="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider">
      WYSIWYG Web Builder v2.0
    </span>
    <h1 class="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mt-6 leading-tight">
      Visual Design trifft sauberen Code.
    </h1>
    <p class="text-lg md:text-xl text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">
      Erstelle responsive Websites und E-Mail Templates im visuellen WYSIWYG Canvas und bearbeite HTML/CSS in Echtzeit im Monaco Editor.
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-4">
      <button class="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5">
        Kostenlos testen
      </button>
      <button class="px-8 py-3.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-base shadow-sm transition-all">
        Dokumentation
      </button>
    </div>
  </section>

  <!-- Feature Grid -->
  <section id="features" class="py-16 px-6 max-w-6xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">⚡</div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Echtzeit-Synchronisation</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Änderungen im Code-Editor aktualisieren sofort die visuelle Vorschau und umgekehrt.
        </p>
      </div>

      <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl mb-4">🎨</div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Tailwind & CSS Inspector</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Passe Abstände, Typografie, Farben und Flexbox-Layouts mit visuellen Reglern an.
        </p>
      </div>

      <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">🛠️</div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Cross-Tool Anbindung</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Direkt verknüpft mit Component Storage, Smart Linter und Encoding Fixer.
        </p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center text-sm">
    <p>&copy; 2026 YES Media Group. Alle Rechte vorbehalten.</p>
  </footer>

</body>
</html>`
  },
  {
    id: 'styles-css',
    name: 'styles.css',
    type: 'css',
    folder: 'root',
    content: `/* Custom Project Styles */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.custom-card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.custom-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
}`
  },
  {
    id: 'email-template',
    name: 'email-template.html',
    type: 'html',
    folder: 'components',
    content: `<!-- Outlook (MSO) Compatible Email Template -->
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Arial,sans-serif;padding:24px;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding-bottom:20px;border-b:2px solid #0059FF;">
        <h2 style="color:#0059FF;margin:0;font-size:24px;">Exklusiver Newsletter</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;color:#333333;font-size:15px;line-height:1.6;">
        Hallo,<br/><br/>
        Willkommen zu unserem neuesten Update! Hier ist deine Wochenübersicht mit allen wichtigen News.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:20px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://example.com" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="#0059FF">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Jetzt Lesen</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="https://example.com" style="background-color:#0059FF;border-radius:8px;color:#ffffff;display:inline-block;font-size:15px;font-weight:bold;line-height:44px;text-align:center;text-decoration:none;width:200px;">Jetzt Lesen &rarr;</a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
</div>`
  }
];

export interface TemplateMailingItem {
  id: string;
  title: string;
  description: string;
  mainCategory: string; // 'Mailing' | 'Anzeige' | 'Landingpage' | 'Newsletter' | string
  subCategory: string;  // 'SAM' | 'Liftletter' | 'Heatup' | 'Nachfass' | 'Textanzeige' | 'Bildanzeige' | 'Redlink' | 'Linktipp' | 'NP-Anzeige' | string
  customer: string;     // 'GeVestor' | 'Investor' | 'Personalwissen' | 'MaxLQ' | 'Finanztrends' | string
  tags: string[];
  code: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TEMPLATES_STORAGE: TemplateMailingItem[] = [
  {
    id: 'tpl-gevestor-sam-1',
    title: 'GeVestor - SAM Sonderausgabe E-Mail',
    description: 'Vollständiges SAM-Mailing (Sonder-Analysen-Mailing) mit Preheader, gelber Alert Box & MSO VML Button.',
    mainCategory: 'Mailing',
    subCategory: 'SAM',
    customer: 'GeVestor',
    tags: ['E-Mail', 'SAM', 'MSO', 'Responsive', 'GeVestor'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GeVestor SAM - Eilmeldung Börse</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#f4f6f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    GeVestor Sonderausgabe: Wichtige Analyse zur aktuellen Marktlage...
  </div>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f6f9;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#003366;padding:20px 30px;text-align:left;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;letter-spacing:1px;">GeVestor <span style="color:#ffcc00;">SAM</span></h1>
              <p style="color:#b3c6ff;margin:4px 0 0 0;font-size:12px;">Sonder-Analysen-Mailing &bull; Exklusiv für Leser</p>
            </td>
          </tr>
          <tr>
            <td style="padding:25px 30px 10px 30px;">
              <div style="background-color:#fff8e6;border-left:4px solid #ff9900;padding:15px;border-radius:6px;">
                <p style="margin:0;color:#995c00;font-size:14px;font-weight:bold;">⚠️ EILMELDUNG DES CHEFANALYSTEN</p>
                <p style="margin:6px 0 0 0;color:#333333;font-size:13px;line-height:1.5;">Die neusten Quartalszahlen ändern die Prognose grundlegend. Handeln Sie jetzt vor Börsenöffnung.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:15px 30px;color:#2c3e50;font-size:15px;line-height:1.6;">
              <p>Sehr geehrte Investorin, sehr geehrter Investor,</p>
              <p>unsere Daten zeigen eine historische Wende im Markt segment. Wer jetzt die richtigen 3 Titel im Depot hat, profitiert in den kommenden Wochen überdurchschnittlich.</p>
              <ul style="padding-left:20px;margin:15px 0;">
                <li style="margin-bottom:8px;">Titel #1: Marktführer mit 12% Dividendenrendite</li>
                <li style="margin-bottom:8px;">Titel #2: Technologieführer mit Ausbruchssignal</li>
                <li style="margin-bottom:8px;">Titel #3: Unterbewertetes Substanz-Unternehmen</li>
              </ul>
              <p>Sichern Sie sich die vollständige Sonderanalyse direkt per Klick:</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:15px 30px 30px 30px;">
              <a href="https://gevestor.de" style="background-color:#003366;border-radius:8px;color:#ffffff;display:inline-block;font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:280px;box-shadow:0 4px 10px rgba(0,51,102,0.3);">Kostenlose Analyse Abrufen &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#718096;line-height:1.5;">
              <p style="margin:0;">&copy; 2026 GeVestor Publishing &bull; Alle Rechte vorbehalten.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'tpl-investor-liftletter-1',
    title: 'Investor - Personal Liftletter E-Mail',
    description: 'Persönlich aufgebautes Liftletter-Mailing von Investor mit Signatur & P.S.-Zeile.',
    mainCategory: 'Mailing',
    subCategory: 'Liftletter',
    customer: 'Investor',
    tags: ['Liftletter', 'E-Mail', 'Investor', 'Persönlich'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="max-width:580px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;font-size:16px;line-height:1.7;padding:20px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
  <p style="font-weight:bold;color:#1e3a8a;font-size:18px;margin-bottom:20px;">INVESTOR Exklusiv-Depot</p>
  <p>Liebe Leserinnen und Leser,</p>
  <p>ich wende mich heute ganz persönlich an Sie, weil mir eine aktuelle Entwicklung am Markt Sorge bereitet – aber gleichzeitig eine riesige Chance eröffnet.</p>
  <div style="background-color:#f0f7ff;border-left:4px solid #2563eb;padding:16px;margin:20px 0;font-style:italic;">
    "Wer in den nächsten Tagen versäumt, sein Depot anzupassen, könnte wertvolle Rendite-Punkte verschenken."
  </div>
  <p><a href="#" style="color:#2563eb;font-weight:bold;text-decoration:underline;">&raquo; Hier klicken, um den vollständigen Liftletter-Report zu lesen</a></p>
  <p style="margin-top:30px;">Mit besten Grüßen aus der Redaktion,</p>
  <div style="margin-top:15px;font-family:sans-serif;">
    <strong style="font-size:15px;color:#0f172a;">Ihr Investor Analystenteam</strong><br/>
    <span style="font-size:12px;color:#64748b;">Chef-Redaktion &bull; Investor Verlag</span>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0;"/>
  <p style="font-size:14px;color:#475569;background-color:#f8fafc;padding:12px;border-radius:6px;">
    <strong>P.S.:</strong> Die ersten 250 Abonnenten erhalten das Zusatz-Sonderkapitel "Inflationsschutz 2026" gratis dazu!
  </p>
</div>`
  },
  {
    id: 'tpl-finanztrends-heatup-1',
    title: 'Finanztrends - Heatup High-Conversion Mailing',
    description: 'Heatup-Mailing für Finanztrends mit hoher Aufmerksamkeit, rotem Header & CTA.',
    mainCategory: 'Mailing',
    subCategory: 'Heatup',
    customer: 'Finanztrends',
    tags: ['Heatup', 'Mailing', 'Finanztrends', 'Conversion'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:sans-serif;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(220,38,38,0.15);">
  <div style="background:linear-gradient(135deg, #dc2626 0%, #991b1b 100%);color:#ffffff;padding:24px;text-align:center;">
    <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">FINANZTRENDS HEATUP</span>
    <h1 style="margin:12px 0 0 0;font-size:24px;font-weight:800;">🔥 Hot Stock Alert Q3</h1>
  </div>
  <div style="padding:24px;color:#1f2937;font-size:15px;line-height:1.6;">
    <p><strong>Dringender Hinweis für Finanztrends-Leser:</strong></p>
    <p>Ein unentdeckter Nebenwert steht vor einer weltweiten Partnerschafts-Ankündigung. Die Fundamentaldaten zeigen eine drastische Unterbewertung.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="#" style="background:#dc2626;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(220,38,38,0.4);">
        Jetzt Heatup-Report sichern &rarr;
      </a>
    </div>
  </div>
</div>`
  },
  {
    id: 'tpl-maxlq-nachfass-1',
    title: 'MaxLQ - Nachfass-Mailing Dringlichkeit',
    description: 'Nachfass-Mailing von MaxLQ mit Fristablauf & Timer-Optik.',
    mainCategory: 'Mailing',
    subCategory: 'Nachfass',
    customer: 'MaxLQ',
    tags: ['Nachfass', 'MaxLQ', 'Mailing', 'Dringlichkeit'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="max-width:580px;margin:0 auto;background:#ffffff;padding:24px;border:2px solid #ea580c;border-radius:12px;font-family:Arial,sans-serif;">
  <div style="background:#fff7ed;color:#c2410c;padding:12px;border-radius:8px;text-align:center;font-weight:bold;font-size:14px;margin-bottom:20px;">
    ⏰ LETZTE ERINNERUNG: Angebot läuft heute um 23:59 Uhr ab!
  </div>
  <h2 style="color:#111827;margin-top:0;">Hallo lieber MaxLQ Leser,</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    wir haben gesehen, dass Sie Ihren Zugang zum MaxLQ Premium-Report noch nicht freigeschaltet haben. Dies ist unsere letzte Benachrichtigung, bevor der Sonder-Rabatt verfällt.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="#" style="background:#ea580c;color:#ffffff;padding:14px 30px;border-radius:8px;font-weight:bold;text-decoration:none;display:inline-block;">
      Jetzt Rabatt-Zugang reaktivieren &rarr;
    </a>
  </div>
</div>`
  },
  {
    id: 'tpl-personalwissen-textanzeige-1',
    title: 'Personalwissen - Textanzeige Arbeitsrecht 2026',
    description: 'Redaktionelle Textanzeige für Personalwissen Sponsoring-Newsletter.',
    mainCategory: 'Anzeige',
    subCategory: 'Textanzeige',
    customer: 'Personalwissen',
    tags: ['Textanzeige', 'Anzeige', 'Personalwissen', 'Sponsoring'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:16px;border-radius:8px;font-family:Arial,sans-serif;max-width:550px;margin:12px 0;">
  <span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:bold;letter-spacing:1px;display:block;margin-bottom:6px;">Anzeige &bull; Personalwissen</span>
  <h4 style="margin:0 0 8px 0;color:#0f172a;font-size:15px;font-weight:bold;">Neue Arbeitsrecht-Vorschriften ab 2026: Sind Ihre Arbeitsverträge rechtssicher?</h4>
  <p style="margin:0 0 12px 0;color:#334155;font-size:13px;line-height:1.5;">
    Kündigungsschutz, Zeiterfassung &amp; Mindestlohn – Personalverantwortliche müssen jetzt handeln. Laden Sie hier den kostenlosen Praxis-Leitfaden für HR-Profis herunter.
  </p>
  <a href="#" style="color:#2563eb;font-weight:bold;font-size:13px;text-decoration:none;">&raquo; Gratis-Leitfaden jetzt herunterladen</a>
</div>`
  },
  {
    id: 'tpl-gevestor-bildanzeige-1',
    title: 'GeVestor - Bildanzeige Dividenden-Banner',
    description: 'Visuelle Banner-Anzeige mit Produktgrafik & CTA.',
    mainCategory: 'Anzeige',
    subCategory: 'Bildanzeige',
    customer: 'GeVestor',
    tags: ['Bildanzeige', 'GeVestor', 'Banner', 'Dividenden'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="max-width:560px;background:#002244;color:#ffffff;border-radius:12px;padding:20px;font-family:sans-serif;display:flex;align-items:center;gap:16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
  <div style="flex:1;">
    <span style="background:#ffcc00;color:#002244;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase;">GeVestor Empfehlung</span>
    <h3 style="margin:8px 0 6px 0;font-size:16px;color:#ffffff;">Die Top 5 Dividenden-Könige für 2026</h3>
    <p style="margin:0 0 12px 0;font-size:12px;color:#cbd5e1;line-height:1.4;">Monatliche Auszahlungen mit über 8% Rendite sichern.</p>
    <a href="#" style="background:#ffcc00;color:#002244;padding:8px 16px;border-radius:6px;font-weight:bold;font-size:12px;text-decoration:none;display:inline-block;">PDF-Sonderbericht abrufen</a>
  </div>
</div>`
  },
  {
    id: 'tpl-investor-redlink-1',
    title: 'Investor - Redlink Teaser-Anzeige',
    description: 'Redaktioneller Redlink mit rotem Akzentstreifen für Newsletter-Sponsoring.',
    mainCategory: 'Anzeige',
    subCategory: 'Redlink',
    customer: 'Investor',
    tags: ['Redlink', 'Anzeige', 'Investor', 'Teaser'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="border-left:4px solid #b91c1c;padding-left:14px;margin:16px 0;font-family:Arial,sans-serif;">
  <span style="font-size:10px;color:#991b1b;font-weight:bold;text-transform:uppercase;display:block;margin-bottom:2px;">[Anzeige] Investor Redlink Tipp</span>
  <a href="#" style="color:#0f172a;font-weight:bold;font-size:14px;text-decoration:underline;line-height:1.4;display:block;">
    Börsen-Experte enthüllt: Diese 3 Aktien sollten Sie jetzt sofort verkaufen &rarr;
  </a>
</div>`
  },
  {
    id: 'tpl-finanztrends-linktipp-1',
    title: 'Finanztrends - Linktipp Kompaktanzeige',
    description: 'Kompakter Linktipp mit Icon & Ziel-URL.',
    mainCategory: 'Anzeige',
    subCategory: 'Linktipp',
    customer: 'Finanztrends',
    tags: ['Linktipp', 'Anzeige', 'Finanztrends', 'Kompakt'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="padding:10px 14px;background:#f1f5f9;border-radius:8px;font-family:sans-serif;font-size:13px;display:flex;align-items:center;gap:8px;">
  <span style="font-size:16px;">💡</span>
  <div>
    <strong style="color:#0f172a;">Linktipp von Finanztrends:</strong> 
    <a href="#" style="color:#2563eb;text-decoration:underline;margin-left:4px;">Chart-Analyse Gold &amp; Silber aktuell einsehen</a>
  </div>
</div>`
  },
  {
    id: 'tpl-maxlq-np-1',
    title: 'MaxLQ - Native Publishing (NP) Anzeige',
    description: 'Native-Publishing Anzeige im Stil eines Magazin-Artikels.',
    mainCategory: 'Anzeige',
    subCategory: 'NP-Anzeige',
    customer: 'MaxLQ',
    tags: ['NP-Anzeige', 'Native Publishing', 'MaxLQ', 'Magazin'],
    createdAt: '2026-07-29',
    updatedAt: '2026-07-29',
    code: `<div style="border:1px dashed #94a3b8;padding:20px;border-radius:12px;background:#fafafa;font-family:Georgia,serif;max-width:580px;margin:16px 0;">
  <div style="display:flex;align-items:center;justify-content:between;margin-bottom:12px;">
    <span style="font-size:10px;font-family:sans-serif;color:#64748b;font-weight:bold;text-transform:uppercase;">Native Publishing &bull; MaxLQ Spezial</span>
  </div>
  <h3 style="font-size:18px;margin:0 0 10px 0;color:#18181b;line-height:1.4;">Warum herkömmliche Geldanlagen 2026 scheitern und was kluge Investoren jetzt anders machen</h3>
  <p style="font-size:14px;color:#3f3f46;line-height:1.6;margin-bottom:14px;">
    In Zeiten von volatilen Märkten setzt ein neuer Trend aus den USA Maßstäbe. Erfahren Sie in unserem exklusiven Gastbeitrag, wie Sie Ihr Vermögen wirksam absichern.
  </p>
  <a href="#" style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#0284c7;text-decoration:none;">Lesezeit 3 Min. &bull; Artikel aufrufen &rarr;</a>
</div>`
  }
];

const PRESET_COMPONENTS = [
  {
    category: 'Layout & Struct',
    items: [
      {
        name: 'Hero Header',
        code: `<section class="py-16 px-6 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl my-6">
  <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Visual Design Platform</h2>
  <p class="text-lg opacity-90 max-w-xl mx-auto mb-6">Build responsive UI layouts without friction.</p>
  <button class="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-md hover:bg-slate-100">Get Started</button>
</section>`
      },
      {
        name: '3-Column Grid',
        code: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <h4 class="font-bold text-lg mb-2">Feature 1</h4>
    <p class="text-sm text-slate-600">High performance visual editor.</p>
  </div>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <h4 class="font-bold text-lg mb-2">Feature 2</h4>
    <p class="text-sm text-slate-600">Monaco code synchronization.</p>
  </div>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <h4 class="font-bold text-lg mb-2">Feature 3</h4>
    <p class="text-sm text-slate-600">Export clean HTML anytime.</p>
  </div>
</div>`
      },
      {
        name: 'Card Container',
        code: `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm my-4">
  <h3 class="font-bold text-xl text-slate-900 mb-2">Card Title</h3>
  <p class="text-slate-600 text-sm mb-4">This is a flexible content card block.</p>
  <button class="px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-lg">Action</button>
</div>`
      }
    ]
  },
  {
    category: 'UI Elements',
    items: [
      {
        name: 'Primary Button',
        code: `<button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all">
  Click Me
</button>`
      },
      {
        name: 'Alert Callout',
        code: `<div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 my-4">
  <span class="text-xl">⚠️</span>
  <div>
    <h5 class="font-bold text-sm">Wichtiger Hinweis</h5>
    <p class="text-xs text-amber-800">Überprüfe die E-Mail-Kompatibilität vor dem Versand.</p>
  </div>
</div>`
      },
      {
        name: 'Badge Chip',
        code: `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
  ● Aktiviert
</span>`
      }
    ]
  },
  {
    category: 'Email & MSO',
    items: [
      {
        name: 'MSO 2-Col Table',
        code: `<!--[if mso | IE]>
<table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td width="300" valign="top">
<![endif]-->
<div style="max-width:600px;margin:0 auto;background:#ffffff;padding:16px;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="50%" valign="top" style="padding:10px;">
        <h4 style="margin:0 0 8px 0;color:#0059FF;">Spalte 1</h4>
        <p style="margin:0;font-size:14px;color:#444;">Inhalt für Outlook.</p>
      </td>
      <td width="50%" valign="top" style="padding:10px;">
        <h4 style="margin:0 0 8px 0;color:#6927FA;">Spalte 2</h4>
        <p style="margin:0;font-size:14px;color:#444;">Zweite Spalte.</p>
      </td>
    </tr>
  </table>
</div>
<!--[if mso | IE]>
</td></tr></table>
<![endif]-->`
      },
      {
        name: 'Bulletproof VML Button',
        code: `<div>
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="#" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="#0059FF">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">Jetzt Kaufen</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="#" style="background-color:#0059FF;border-radius:8px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:14px;font-weight:bold;line-height:44px;text-align:center;text-decoration:none;width:200px;">Jetzt Kaufen &rarr;</a>
  <!--<![endif]-->
</div>`
      }
    ]
  }
];

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'ON_SAVE_TEMPLATE' | 'ON_CODE_SAVE' | 'ON_ZIP_EXPORT' | 'ON_A11Y_AUDIT' | 'ON_LINTER_RUN';
  action: 'AUTO_BACKUP_METADATA' | 'AUTO_FORMAT_CODE' | 'AUTO_FIX_A11Y' | 'GENERATE_README_DOC' | 'NOTIFY_STATUS';
  enabled: boolean;
  lastRun?: string;
  runCount: number;
  description: string;
}

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-tpl-backup',
    name: 'Auto-Backup to Metadata Store',
    trigger: 'ON_SAVE_TEMPLATE',
    action: 'AUTO_BACKUP_METADATA',
    enabled: true,
    runCount: 0,
    description: 'Sichert Vorlagen beim Speichern automatisch im lokalen Metadata Store & Snapshot-Verlauf.'
  },
  {
    id: 'rule-zip-readme',
    name: 'Auto-Generate README on ZIP Export',
    trigger: 'ON_ZIP_EXPORT',
    action: 'GENERATE_README_DOC',
    enabled: true,
    runCount: 0,
    description: 'Generiert vor jedem ZIP-Export automatisch eine ausführliche README.md Projekt-Dokumentation.'
  },
  {
    id: 'rule-linter-a11y',
    name: 'Auto-Fix A11y on Linter Audit',
    trigger: 'ON_LINTER_RUN',
    action: 'AUTO_FIX_A11Y',
    enabled: true,
    runCount: 0,
    description: 'Repariert fehlende Alt-Texte und ARIA Attribute automatisch bei jedem Linter-Lauf.'
  },
  {
    id: 'rule-save-format',
    name: 'Auto Prettify & Format on Code Save',
    trigger: 'ON_CODE_SAVE',
    action: 'AUTO_FORMAT_CODE',
    enabled: false,
    runCount: 0,
    description: 'Formatiert HTML & CSS automatisch mit sauberen Einrückungen beim Speichern.'
  }
];

export const WysiwygStudio: React.FC = () => {
  useToolTracking('wysiwygstudio');

  // Files & Project State
  const [files, setFiles] = useLocalStorage<ProjectFile[]>('yes-wysiwyg-files', DEFAULT_PROJECT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('index-html');

  // Active File Reference
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Canvas & Selection State
  const [rightTab, setRightTab] = useState<'inspector' | 'computed' | 'seo' | 'animation' | 'assets' | 'library' | 'ai' | 'a11y' | 'cssvars' | 'ai-inspector'>('inspector');
  const [viewMode, setViewMode] = useState<'visual' | 'split' | 'code' | 'component'>('split');
  const [viewportWidth, setViewportWidth] = useState<'desktop' | 'tablet' | 'mobile' | 'mobile-sm' | 'custom'>('desktop');
  const [customViewportPx, setCustomViewportPx] = useState<number>(1024);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string>('');
  const [selectedTextContent, setSelectedTextContent] = useState<string>('');
  const [computedStylesList, setComputedStylesList] = useState<{ [key: string]: string }>({});
  const [computedSearchFilter, setComputedSearchFilter] = useState<string>('');
  
  // Distraction-Free Preview Mode State
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Command Palette & Global Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');

  // Global Search & Replace State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalReplaceQuery, setGlobalReplaceQuery] = useState<string>('');
  const [searchMatchCase, setSearchMatchCase] = useState<boolean>(false);

  // Starter Templates Modal State
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);

  // Version History Snapshots State
  const [versionSnapshots, setVersionSnapshots] = useLocalStorage<ProjectVersionSnapshot[]>('yes-version-snapshots-history', [
    {
      id: 'snap-initial-v1',
      name: 'v1.0 Initial Setup',
      timestamp: new Date().toLocaleString('de-DE'),
      files: DEFAULT_PROJECT_FILES,
      activeFileId: 'index-html',
      changeSummary: 'System-generierter Basis Snapshot'
    }
  ]);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState<boolean>(false);
  const [snapshotNameInput, setSnapshotNameInput] = useState<string>('');
  const [snapshotSummaryInput, setSnapshotSummaryInput] = useState<string>('');

  // Canvas Snap-to-Grid & Smart Guides State
  const [isSnapToGrid, setIsSnapToGrid] = useState<boolean>(false);
  const [gridSizePx, setGridSizePx] = useState<number>(16);
  const [showSmartGuides, setShowSmartGuides] = useState<boolean>(true);

  // Multi-Device Preview Toggle
  const [isMultiDeviceView, setIsMultiDeviceView] = useState<boolean>(false);

  // AI Code Review Drawer State
  const [isAiCodeReviewOpen, setIsAiCodeReviewOpen] = useState<boolean>(false);

  // Custom Google & Local Fonts State
  const [customFontsList, setCustomFontsList] = useLocalStorage<{ id: string; name: string; url: string; category: string }[]>('yes-custom-fonts-list', [
    { id: 'font-inter', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap', category: 'Google Fonts' },
    { id: 'font-jakarta', name: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap', category: 'Google Fonts' },
    { id: 'font-outfit', name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap', category: 'Google Fonts' }
  ]);
  const [customFontNameInput, setCustomFontNameInput] = useState<string>('');
  const [customFontUrlInput, setCustomFontUrlInput] = useState<string>('');

  // 1. Theme Palette Generator State (HSL Algorithm)
  const [isThemePaletteModalOpen, setIsThemePaletteModalOpen] = useState<boolean>(false);

  // 2. Interactive Dependency Graph Modal State
  const [isDependencyGraphModalOpen, setIsDependencyGraphModalOpen] = useState<boolean>(false);

  // 3. Split-Test Simulator State
  const [isSplitTestMode, setIsSplitTestMode] = useState<boolean>(false);
  const [splitTestVariant, setSplitTestVariant] = useState<'A' | 'B'>('A');
  const [variantBContent, setVariantBContent] = useState<string>('');

  // 4. Documentation & README Generator Modal State
  const [isDocGenModalOpen, setIsDocGenModalOpen] = useState<boolean>(false);

  // 5. Layout Debugger & Baseline Grid Overlay State
  const [isLayoutDebuggerOpen, setIsLayoutDebuggerOpen] = useState<boolean>(false);
  const [layoutDebuggerGridPx, setLayoutDebuggerGridPx] = useState<number>(8);

  // 7. ZIP LP Import & Directory Tree (Baum + Fakepaths) State
  const [isZipTreeModalOpen, setIsZipTreeModalOpen] = useState<boolean>(false);
  const [zipImportLoading, setZipImportLoading] = useState<boolean>(false);
  const [zipProjectName, setZipProjectName] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'assets', 'css', 'js', 'images']));
  const zipUploadInputRef = useRef<HTMLInputElement | null>(null);

  const toggleFolderExpand = (folderName: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  };

  const handleUploadZipLp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipImportLoading(true);
    setZipProjectName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const newFiles: ProjectFile[] = [];
      const fakePathBase = `/var/www/landingpages/${file.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;

      const filePromises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const promise = (async () => {
          const pathParts = relativePath.split('/');
          const fileName = pathParts.pop() || relativePath;
          const folderPath = pathParts.length > 0 ? pathParts.join('/') : 'root';
          const ext = fileName.split('.').pop()?.toLowerCase() || '';

          const isText = ['html', 'htm', 'css', 'js', 'json', 'svg', 'txt', 'md', 'xml'].includes(ext);
          let fileContent = '';
          let isBinary = false;

          if (isText) {
            fileContent = await zipEntry.async('string');
          } else {
            isBinary = true;
            const blob = await zipEntry.async('blob');
            fileContent = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve((reader.result as string) || '');
              reader.readAsDataURL(blob);
            });
          }

          const fileType: 'html' | 'css' | 'js' | 'asset' =
            ext === 'html' || ext === 'htm' ? 'html' : ext === 'css' ? 'css' : ext === 'js' ? 'js' : 'asset';

          const fakePath = `${fakePathBase}/${relativePath}`;
          const fileSize = (await zipEntry.async('arraybuffer')).byteLength;

          newFiles.push({
            id: `zip-file-${relativePath.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
            name: fileName,
            type: fileType,
            folder: folderPath,
            content: fileContent,
            fakePath,
            size: fileSize,
            isBinary
          });
        })();

        filePromises.push(promise);
      });

      await Promise.all(filePromises);

      if (newFiles.length > 0) {
        setFiles(newFiles);
        const folderSet = new Set<string>(['root']);
        newFiles.forEach((f) => {
          if (f.folder) folderSet.add(f.folder);
        });
        setExpandedFolders(folderSet);

        const indexHtml = newFiles.find((f) => f.name.toLowerCase() === 'index.html' || f.type === 'html') || newFiles[0];
        if (indexHtml) {
          setActiveFileId(indexHtml.id);
        }

        setIsZipTreeModalOpen(true);
      } else {
        alert('❌ Die hochgeladene ZIP-Datei enthält keine gültigen Dateien.');
      }
    } catch (err: any) {
      alert(`❌ Fehler beim Lesen des ZIP-Archivs: ${err.message || err}`);
    } finally {
      setZipImportLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  // 6. Templates & Mailings Storage State
  const [templatesStorage, setTemplatesStorage] = useLocalStorage<TemplateMailingItem[]>(
    'yes-templates-mailings-storage',
    DEFAULT_TEMPLATES_STORAGE
  );
  const [isTemplateStorageModalOpen, setIsTemplateStorageModalOpen] = useState<boolean>(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [templateFilterMainCat, setTemplateFilterMainCat] = useState<string>('Alle');
  const [templateFilterSubCat, setTemplateFilterSubCat] = useState<string>('Alle');
  const [templateFilterCustomer, setTemplateFilterCustomer] = useState<string>('Alle');

  // Advanced Selection, Tag & Sort State
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [templateSortBy, setTemplateSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'titleAsc' | 'customerAsc'>('updatedDesc');
  const [templateSelectedTagFilter, setTemplateSelectedTagFilter] = useState<string | null>(null);

  // Quick Preview Modal State
  const [quickPreviewTemplate, setQuickPreviewTemplate] = useState<TemplateMailingItem | null>(null);
  const [quickPreviewViewport, setQuickPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [quickPreviewScale, setQuickPreviewScale] = useState<number>(100);
  const [quickPreviewBg, setQuickPreviewBg] = useState<'light' | 'dark' | 'checker' | 'email'>('email');

  // Toggle Selection
  const handleToggleSelectTemplate = (id: string) => {
    if (selectedTemplateIds.includes(id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter(i => i !== id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, id]);
    }
  };

  const handleSelectAllTemplates = (filtered: TemplateMailingItem[]) => {
    const allFilteredIds = filtered.map(t => t.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedTemplateIds.includes(id));
    if (isAllSelected) {
      setSelectedTemplateIds(selectedTemplateIds.filter(id => !allFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedTemplateIds, ...allFilteredIds]));
      setSelectedTemplateIds(merged);
    }
  };

  const handleClearSelectedTemplates = () => {
    setSelectedTemplateIds([]);
  };

  // Structured ZIP Export Function (Semantic Folder Grouping)
  const handleExportTemplatesZip = async (itemsToExport: TemplateMailingItem[]) => {
    if (itemsToExport.length === 0) {
      alert('Keine Templates zum Exportieren ausgewählt.');
      return;
    }

    try {
      const zip = new JSZip();

      itemsToExport.forEach(tpl => {
        const mainCatClean = (tpl.mainCategory || 'Mailing').replace(/[^a-zA-Z0-9_-]/g, '_');
        const customerClean = (tpl.customer || 'Allgemein').replace(/[^a-zA-Z0-9_-]/g, '_');
        const subCatClean = (tpl.subCategory || 'Template').replace(/[^a-zA-Z0-9_-]/g, '_');
        const titleClean = tpl.title.replace(/[^a-zA-Z0-9_äöüÄÖÜ-]/g, '_');

        const fileName = `${subCatClean}_${titleClean}.html`;
        const folderPath = zip.folder(mainCatClean)?.folder(customerClean);
        folderPath?.file(fileName, tpl.code);
      });

      // Manifest JSON with full schema
      const manifestData = {
        exportedAt: new Date().toISOString(),
        totalTemplates: itemsToExport.length,
        templates: itemsToExport.map(({ code, ...rest }) => ({
          ...rest,
          fileName: `${(rest.subCategory || 'Template').replace(/[^a-zA-Z0-9_-]/g, '_')}_${rest.title.replace(/[^a-zA-Z0-9_äöüÄÖÜ-]/g, '_')}.html`
        }))
      };
      zip.file('templates_manifest.json', JSON.stringify(manifestData, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `YES_Studio_Templates_Export_${itemsToExport.length}_Items_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP Export Error:', err);
      alert('Fehler beim Generieren der ZIP-Datei.');
    }
  };

  // Single HTML File Download
  const handleDownloadSingleTemplateHtml = (tpl: TemplateMailingItem) => {
    const blob = new Blob([tpl.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const subCatClean = (tpl.subCategory || 'Template').replace(/[^a-zA-Z0-9_-]/g, '_');
    const titleClean = tpl.title.replace(/[^a-zA-Z0-9_äöüÄÖÜ-]/g, '_');
    link.download = `${subCatClean}_${titleClean}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Backup JSON Export & Import
  const handleExportTemplatesJsonBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templatesStorage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `yes_templates_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTemplatesJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].code) {
            setTemplatesStorage(parsed);
            alert(`${parsed.length} Templates erfolgreich importiert!`);
          } else {
            alert('Ungültiges Template JSON Backup Format.');
          }
        } catch (err) {
          alert('Fehler beim Parsen der JSON Datei.');
        }
      };
    }
  };

  const handleResetTemplatesToDefaults = () => {
    if (confirm('Möchtest du wirklich alle gespeicherten Templates auf die System-Standards zurücksetzen? Eigene Templates werden dabei gelöscht.')) {
      setTemplatesStorage(DEFAULT_TEMPLATES_STORAGE);
      setSelectedTemplateIds([]);
      alert('Templates auf System-Standard zurückgesetzt.');
    }
  };

  const handleDeleteSelectedTemplates = () => {
    if (selectedTemplateIds.length === 0) return;
    if (confirm(`Möchtest du wirklich ${selectedTemplateIds.length} ausgewählte Templates löschen?`)) {
      setTemplatesStorage(templatesStorage.filter(t => !selectedTemplateIds.includes(t.id)));
      setSelectedTemplateIds([]);
    }
  };

  // Preview & Code View Toggles for Storage Cards
  const [activePreviewTplId, setActivePreviewTplId] = useState<string | null>(null);
  const [activeCodeTplId, setActiveCodeTplId] = useState<string | null>(null);

  // Form State for Creating / Editing Templates
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateMailingItem | null>(null);

  const [tplFormTitle, setTplFormTitle] = useState<string>('');
  const [tplFormDesc, setTplFormDesc] = useState<string>('');
  const [tplFormMainCat, setTplFormMainCat] = useState<string>('Mailing');
  const [tplFormSubCat, setTplFormSubCat] = useState<string>('SAM');
  const [tplFormCustomer, setTplFormCustomer] = useState<string>('GeVestor');
  const [tplFormTags, setTplFormTags] = useState<string>('E-Mail, Responsive');
  const [tplFormCode, setTplFormCode] = useState<string>('');

  // Form State for Adding Custom Category / Customer
  const [isAddMetaModalOpen, setIsAddMetaModalOpen] = useState<boolean>(false);
  const [metaTypeToAdd, setMetaTypeToAdd] = useState<'mainCat' | 'subCatAnzeige' | 'subCatMailing' | 'customer'>('customer');
  const [newMetaValueInput, setNewMetaValueInput] = useState<string>('');

  // Custom Metadata Lists
  const [customMainCategories, setCustomMainCategories] = useLocalStorage<string[]>(
    'yes-template-custom-main-cats',
    ['Mailing', 'Anzeige', 'Landingpage', 'Newsletter']
  );
  const [customAnzeigeCategories, setCustomAnzeigeCategories] = useLocalStorage<string[]>(
    'yes-template-custom-anzeige-cats',
    ['Textanzeige', 'Bildanzeige', 'Redlink', 'Linktipp', 'NP-Anzeige']
  );
  const [customMailingCategories, setCustomMailingCategories] = useLocalStorage<string[]>(
    'yes-template-custom-mailing-cats',
    ['SAM', 'Liftletter', 'Heatup', 'Nachfass']
  );
  const [customCustomersList, setCustomCustomersList] = useLocalStorage<string[]>(
    'yes-template-custom-customers',
    ['GeVestor', 'Investor', 'Personalwissen', 'MaxLQ', 'Finanztrends']
  );

  // Handlers for Template Storage
  const handleOpenSaveCurrentFileAsTemplate = () => {
    setEditingTemplate(null);
    setTplFormTitle(`${activeFile.name.replace(/\.[^/.]+$/, '')} Template`);
    setTplFormDesc('Aus aktiver Editor-Datei gespeichertes Template.');
    setTplFormMainCat('Mailing');
    setTplFormSubCat('SAM');
    setTplFormCustomer('GeVestor');
    setTplFormTags('Custom, Editor, Saved');
    setTplFormCode(activeFile.content);
    setIsCreateTemplateModalOpen(true);
  };

  const handleOpenCreateNewTemplate = () => {
    setEditingTemplate(null);
    setTplFormTitle('');
    setTplFormDesc('');
    setTplFormMainCat('Mailing');
    setTplFormSubCat('SAM');
    setTplFormCustomer('GeVestor');
    setTplFormTags('E-Mail, Responsive');
    setTplFormCode('<!-- Neues Template -->\n<div style="padding:20px;font-family:sans-serif;">\n  <h2>Dein Template Titel</h2>\n</div>');
    setIsCreateTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: TemplateMailingItem) => {
    setEditingTemplate(tpl);
    setTplFormTitle(tpl.title);
    setTplFormDesc(tpl.description);
    setTplFormMainCat(tpl.mainCategory);
    setTplFormSubCat(tpl.subCategory);
    setTplFormCustomer(tpl.customer);
    setTplFormTags(tpl.tags.join(', '));
    setTplFormCode(tpl.code);
    setIsCreateTemplateModalOpen(true);
  };

  const handleSaveTemplateSubmit = () => {
    if (!tplFormTitle.trim() || !tplFormCode.trim()) {
      alert('Bitte fülle mindestens den Titel und den Template-Code aus.');
      return;
    }

    const tagsArr = tplFormTags.split(',').map(t => t.trim()).filter(Boolean);
    const dateStr = new Date().toISOString().split('T')[0];

    if (editingTemplate) {
      const updated = templatesStorage.map(t => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            title: tplFormTitle.trim(),
            description: tplFormDesc.trim(),
            mainCategory: tplFormMainCat,
            subCategory: tplFormSubCat,
            customer: tplFormCustomer,
            tags: tagsArr,
            code: tplFormCode,
            updatedAt: dateStr
          };
        }
        return t;
      });
      setTemplatesStorage(updated);
      alert(`Template "${tplFormTitle.trim()}" erfolgreich aktualisiert!`);
    } else {
      const newItem: TemplateMailingItem = {
        id: `tpl-custom-${Date.now()}`,
        title: tplFormTitle.trim(),
        description: tplFormDesc.trim(),
        mainCategory: tplFormMainCat,
        subCategory: tplFormSubCat,
        customer: tplFormCustomer,
        tags: tagsArr,
        code: tplFormCode,
        createdAt: dateStr,
        updatedAt: dateStr
      };
      setTemplatesStorage([newItem, ...templatesStorage]);
      alert(`Template "${tplFormTitle.trim()}" erfolgreich gespeichert!`);
    }

    setIsCreateTemplateModalOpen(false);
  };

  const handleDeleteTemplateItem = (id: string, title: string) => {
    if (confirm(`Möchtest du das Template "${title}" wirklich löschen?`)) {
      setTemplatesStorage(templatesStorage.filter(t => t.id !== id));
    }
  };

  const handleLoadTemplateToActiveFile = (tpl: TemplateMailingItem) => {
    if (confirm(`Möchtest du den Inhalt von "${activeFile.name}" durch das Template "${tpl.title}" ersetzen?`)) {
      const updatedFiles = files.map(f => {
        if (f.id === activeFileId) {
          return { ...f, content: tpl.code };
        }
        return f;
      });
      setFiles(updatedFiles);
      recordHistoryState(activeFile.content);
      setIsTemplateStorageModalOpen(false);
      alert(`Template "${tpl.title}" erfolgreich in "${activeFile.name}" geladen!`);
    }
  };

  const handleAddMetaSubmit = () => {
    const val = newMetaValueInput.trim();
    if (!val) return;

    if (metaTypeToAdd === 'customer') {
      if (!customCustomersList.includes(val)) setCustomCustomersList([...customCustomersList, val]);
      setTplFormCustomer(val);
    } else if (metaTypeToAdd === 'mainCat') {
      if (!customMainCategories.includes(val)) setCustomMainCategories([...customMainCategories, val]);
      setTplFormMainCat(val);
    } else if (metaTypeToAdd === 'subCatAnzeige') {
      if (!customAnzeigeCategories.includes(val)) setCustomAnzeigeCategories([...customAnzeigeCategories, val]);
      setTplFormSubCat(val);
    } else if (metaTypeToAdd === 'subCatMailing') {
      if (!customMailingCategories.includes(val)) setCustomMailingCategories([...customMailingCategories, val]);
      setTplFormSubCat(val);
    }

    setNewMetaValueInput('');
    setIsAddMetaModalOpen(false);
  };

  // Collaboration Test Mode (?test=true) & Simulated Remote Cursors
  const [forceTestMode, setForceTestMode] = useState<boolean>(false);
  const isTestMode = (typeof window !== 'undefined' && window.location.search.includes('test=true')) || forceTestMode;

  const [remoteCursor1, setRemoteCursor1] = useState<{ x: number; y: number; name: string; color: string; action: string }>({
    x: 180,
    y: 120,
    name: 'Sarah (UX Lead)',
    color: '#ec4899',
    action: 'inspektion <header>'
  });

  const [remoteCursor2, setRemoteCursor2] = useState<{ x: number; y: number; name: string; color: string; action: string }>({
    x: 420,
    y: 350,
    name: 'Alex (Dev)',
    color: '#10b981',
    action: 'bearbeitet <button>'
  });

  // Global Keyboard Shortcuts (Ctrl+K Command Palette & Ctrl+Shift+F Global Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsGlobalSearchOpen(false);
        setIsTemplatesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remote Cursor Simulation Interval when Test Mode is Active
  useEffect(() => {
    if (!isTestMode) return;
    const pos1 = [
      { x: 120, y: 80, action: 'inspektion <header>' },
      { x: 340, y: 220, action: 'bearbeitet <h1> Title' },
      { x: 560, y: 360, action: 'styliyt <button> CTA' },
      { x: 220, y: 480, action: 'prüft <section> Spacing' }
    ];
    const pos2 = [
      { x: 480, y: 280, action: 'editiert Tailwind Klasse' },
      { x: 190, y: 420, action: 'fügt SVG Icon ein' },
      { x: 610, y: 160, action: 'prüft CSS Variable :root' },
      { x: 360, y: 580, action: 'überprüft A11y Score' }
    ];
    let step = 0;

    const interval = setInterval(() => {
      step = (step + 1) % pos1.length;
      setRemoteCursor1(prev => ({ ...prev, x: pos1[step].x, y: pos1[step].y, action: pos1[step].action }));
      setRemoteCursor2(prev => ({ ...prev, x: pos2[step].x, y: pos2[step].y, action: pos2[step].action }));
    }, 2800);

    return () => clearInterval(interval);
  }, [isTestMode]);

  // Global Search & Replace Handler
  const handlePerformGlobalReplace = (replaceAll: boolean = false) => {
    if (!globalSearchQuery.trim()) return;

    let totalReplacements = 0;
    const searchRegex = new RegExp(
      globalSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      searchMatchCase ? 'g' : 'gi'
    );

    const updatedFiles = files.map(file => {
      if (!replaceAll && file.id !== activeFile.id) {
        return file;
      }
      const matches = file.content.match(searchRegex);
      if (matches) {
        totalReplacements += matches.length;
        const newContent = file.content.replace(searchRegex, globalReplaceQuery);
        return { ...file, content: newContent };
      }
      return file;
    });

    if (totalReplacements > 0) {
      setFiles(updatedFiles);
      recordHistoryState(activeFile.content);
      alert(`Erfolgreich ${totalReplacements} Ersetzung(en) durchgeführt!`);
    } else {
      alert(`Keine Treffer für "${globalSearchQuery}" gefunden.`);
    }
  };

  // Starter Template Apply Handler
  const handleSelectStarterTemplate = (template: StarterTemplate) => {
    const updatedFiles = files.map(f => {
      if (f.id === 'index-html') {
        return { ...f, content: template.htmlContent };
      }
      return f;
    });
    setFiles(updatedFiles);
    recordHistoryState(activeFile.content);
    setIsTemplatesModalOpen(false);
    alert(`Starter Template "${template.title}" erfolgreich geladen!`);
  };

  // SEO Meta State
  const [seoData, setSeoData] = useState<SeoData>({
    title: '',
    description: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    favicon: ''
  });

  // Animation Timeline State
  const [animPreset, setAnimPreset] = useState<string>('fade-in');
  const [animDuration, setAnimDuration] = useState<string>('0.5s');
  const [animDelay, setAnimDelay] = useState<string>('0s');
  const [animEasing, setAnimEasing] = useState<string>('ease-in-out');
  const [animIteration, setAnimIteration] = useState<string>('1');

  // Asset Manager State
  const [customAssetUrl, setCustomAssetUrl] = useState<string>('');
  const [assetCategory, setAssetCategory] = useState<'images' | 'icons' | 'fonts'>('images');

  // CSS Variables State
  const [newCssVarName, setNewCssVarName] = useState<string>('--brand-primary');
  const [newCssVarValue, setNewCssVarValue] = useState<string>('#3b82f6');

  // Isolated Component View State
  const [isolatedSnippet, setIsolatedSnippet] = useState<string>(
    `<div class="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-2xl border border-white/10 max-w-md mx-auto text-center flex flex-col items-center gap-4">
  <div class="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">✨</div>
  <h3 class="text-2xl font-black tracking-tight">Isolierte Komponente</h3>
  <p class="text-xs text-slate-300 leading-relaxed">Passe hier Farbschema, Layout und Struktur an, ohne das Haupt-Canvas zu beeinflussen.</p>
  <button class="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all">Aktion ausführen</button>
</div>`
  );
  const [isolatedTitle, setIsolatedTitle] = useState<string>('Feature Card');
  const [isolatedZoom, setIsolatedZoom] = useState<number>(100);

  // Code Health Modal & Audit
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);

  // Real-time Health & A11y Audit
  // Real-time Health, A11y & AI Code Review Audits
  const healthAudit = calculateCodeHealth(activeFile.content);
  const a11yAudit = runAccessibilityScan(activeFile.content);
  const aiCodeReview = generateAiCodeReview(activeFile.content);

  // Handler: Create Version Snapshot
  const handleCreateVersionSnapshot = (name?: string, summary?: string) => {
    const snapName = name || snapshotNameInput.trim() || `Snapshot #${versionSnapshots.length + 1}`;
    const snapSummary = summary || snapshotSummaryInput.trim() || 'Manuell gespeicherter Stand';
    const newSnap: ProjectVersionSnapshot = {
      id: `snap-${Date.now()}`,
      name: snapName,
      timestamp: new Date().toLocaleString('de-DE'),
      files: JSON.parse(JSON.stringify(files)),
      activeFileId: activeFileId,
      changeSummary: snapSummary
    };
    setVersionSnapshots(prev => [newSnap, ...prev]);
    setSnapshotNameInput('');
    setSnapshotSummaryInput('');
    alert(`Version Snapshot "${snapName}" erfolgreich gespeichert!`);
  };

  // Handler: Restore Version Snapshot
  const handleRestoreVersionSnapshot = (snap: ProjectVersionSnapshot) => {
    if (confirm(`Möchtest du das gesamte Projekt auf den Version-Stand "${snap.name}" zurücksetzen?`)) {
      recordHistoryState(activeFile.content);
      setFiles(snap.files);
      if (snap.activeFileId) setActiveFileId(snap.activeFileId);
      setIsVersionHistoryModalOpen(false);
      alert(`Projekt erfolgreich auf "${snap.name}" wiederhergestellt!`);
    }
  };

  // Handler: Delete Version Snapshot
  const handleDeleteVersionSnapshot = (id: string) => {
    setVersionSnapshots(prev => prev.filter(s => s.id !== id));
  };

  // Handler: Apply Custom Font Globally
  const handleApplyFontGlobally = (fontName: string, fontUrl: string) => {
    if (activeFile.type !== 'html') {
      alert('Bitte wähle zuerst eine HTML-Datei aus.');
      return;
    }
    let html = activeFile.content;
    const linkTag = `<link rel="stylesheet" href="${fontUrl}">`;
    const fontStyleTag = `<style>\n  body {\n    font-family: '${fontName}', sans-serif;\n  }\n</style>`;

    if (!html.includes(fontUrl) && html.includes('</head>')) {
      html = html.replace('</head>', `  ${linkTag}\n  ${fontStyleTag}\n</head>`);
      updateFileContent(html, true);
      alert(`Schriftart "${fontName}" erfolgreich global eingebunden und auf <body> angewendet!`);
    } else {
      alert(`Schriftart "${fontName}" ist bereits im <head> eingebunden.`);
    }
  };

  // Handler: Add Custom Font to List
  const handleAddCustomFont = () => {
    if (!customFontNameInput.trim() || !customFontUrlInput.trim()) {
      alert('Bitte gib sowohl einen Font-Namen als auch eine CSS/Font-URL ein.');
      return;
    }
    const newFont = {
      id: `custom-font-${Date.now()}`,
      name: customFontNameInput.trim(),
      url: customFontUrlInput.trim(),
      category: 'Custom Font'
    };
    setCustomFontsList(prev => [newFont, ...prev]);
    setCustomFontNameInput('');
    setCustomFontUrlInput('');
    alert(`Custom Font "${newFont.name}" zur Asset-Bibliothek hinzugefügt!`);
  };

  // Handler: Auto-Fix AI Code Review Issues
  const handleAutoFixAiCodeReview = () => {
    let fixed = activeFile.content;
    const parser = new DOMParser();
    const doc = parser.parseFromString(fixed, 'text/html');

    // 1. Add defer to head scripts
    doc.querySelectorAll('head script:not([defer]):not([async])').forEach(script => {
      script.setAttribute('defer', 'true');
    });

    // 2. Add loading="lazy" to images
    doc.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    // 3. Add missing title
    if (!doc.querySelector('title')) {
      const title = doc.createElement('title');
      title.textContent = 'YES Studio App - Landing Page';
      let head = doc.querySelector('head');
      if (!head) {
        head = doc.createElement('head');
        doc.documentElement.insertBefore(head, doc.body || doc.documentElement.firstChild);
      }
      head.appendChild(title);
    }

    // 4. Add missing meta description
    if (!doc.querySelector('meta[name="description"]')) {
      const meta = doc.createElement('meta');
      meta.setAttribute('name', 'description');
      meta.setAttribute('content', 'Erstelle atemberaubende, performante und barrierefreie Webseiten mit dem YES Studio WYSIWYG Builder.');
      doc.querySelector('head')?.appendChild(meta);
    }

    // 5. Add OpenGraph tags
    if (!doc.querySelector('meta[property="og:title"]')) {
      const ogTitle = doc.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', doc.querySelector('title')?.textContent || 'YES Studio Web');
      doc.querySelector('head')?.appendChild(ogTitle);
    }

    // 6. Fix multiple H1s (convert second H1 to H2)
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length > 1) {
      for (let i = 1; i < h1s.length; i++) {
        const h2 = doc.createElement('h2');
        h2.innerHTML = h1s[i].innerHTML;
        Array.from(h1s[i].attributes).forEach(attr => h2.setAttribute(attr.name, attr.value));
        h1s[i].parentNode?.replaceChild(h2, h1s[i]);
      }
    }

    let newHtml = doc.documentElement.outerHTML;
    if (fixed.toLowerCase().startsWith('<!doctype html>')) {
      newHtml = `<!DOCTYPE html>\n${newHtml}`;
    }
    updateFileContent(newHtml, true);
    alert('KI Code Review Optimierungen erfolgreich auf das HTML-Dokument angewendet!');
  };

  // Real-time CSS Variables
  const cssVarsList = parseCssVariablesFromHtml(activeFile.content);

  // Auto-Parse SEO when active file changes
  useEffect(() => {
    if (activeFile.type === 'html') {
      const parsed = parseSeoFromHtml(activeFile.content);
      setSeoData(parsed);
    }
  }, [activeFile.id, activeFile.content]);

  // Handler to update SEO back to active file HTML
  const handleSaveSeo = (updatedSeo: SeoData) => {
    setSeoData(updatedSeo);
    if (activeFile.type === 'html') {
      const newHtml = updateSeoInHtml(activeFile.content, updatedSeo);
      updateFileContent(newHtml, true);
    }
  };

  // Handler to apply Animation to selected element
  const handleApplyAnimation = () => {
    if (!selectedPath) {
      alert('Bitte wähle zuerst ein Element im Canvas aus.');
      return;
    }
    const animStyle = `animation: ${animPreset} ${animDuration} ${animEasing} ${animDelay} ${animIteration} forwards;`;
    sendCommandToIframe('UPDATE_STYLE', { property: 'animation', value: `${animPreset} ${animDuration} ${animEasing} ${animDelay} ${animIteration} forwards` });

    // Ensure @keyframes CSS definition exists in styles
    const keyframeCSS = `
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes flip-in { from { transform: perspective(400deg) rotateY(90deg); opacity: 0; } to { transform: perspective(400deg) rotateY(0deg); opacity: 1; } }
`;

    // Inject keyframes into active file if missing
    if (activeFile.content && !activeFile.content.includes('@keyframes fade-in')) {
      if (activeFile.type === 'html' && activeFile.content.includes('</head>')) {
        const injected = activeFile.content.replace('</head>', `<style>${keyframeCSS}</style></head>`);
        updateFileContent(injected, true);
      }
    }
  };

  // 1-Click Health Auto-Fix
  const handleAutoFixHealth = () => {
    let fixed = activeFile.content;

    if (!fixed.toLowerCase().includes('<!doctype html>')) {
      fixed = `<!DOCTYPE html>\n${fixed}`;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(fixed, 'text/html');
    let head = doc.querySelector('head');
    if (!head) {
      head = doc.createElement('head');
      doc.documentElement.insertBefore(head, doc.body || doc.documentElement.firstChild);
    }

    if (!doc.querySelector('title')) {
      const t = doc.createElement('title');
      t.textContent = 'YES Studio Website';
      head.appendChild(t);
    }

    if (!doc.querySelector('meta[name="viewport"]')) {
      const vp = doc.createElement('meta');
      vp.setAttribute('name', 'viewport');
      vp.setAttribute('content', 'width=device-width, initial-scale=1.0');
      head.appendChild(vp);
    }

    doc.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt') || !img.getAttribute('alt')?.trim()) {
        img.setAttribute('alt', 'Bild Illustration');
      }
    });

    let newHtml = doc.documentElement.outerHTML;
    if (fixed.toLowerCase().startsWith('<!doctype html>')) {
      newHtml = `<!DOCTYPE html>\n${newHtml}`;
    }
    updateFileContent(newHtml, true);
  };

  // Auto-Fix Accessibility (A11y) Issues
  const handleAutoFixA11y = () => {
    let fixed = activeFile.content;
    const parser = new DOMParser();
    const doc = parser.parseFromString(fixed, 'text/html');

    const htmlEl = doc.querySelector('html');
    if (htmlEl && !htmlEl.getAttribute('lang')) {
      htmlEl.setAttribute('lang', 'de');
    }

    doc.querySelectorAll('img').forEach((img, idx) => {
      if (!img.hasAttribute('alt') || !img.getAttribute('alt')?.trim()) {
        img.setAttribute('alt', `Illustration Grafikelement ${idx + 1}`);
      }
    });

    doc.querySelectorAll('button, a[href]').forEach((el) => {
      if (!el.textContent?.trim() && !el.getAttribute('aria-label')) {
        el.setAttribute('aria-label', 'Interaktive Aktion');
      }
    });

    let newHtml = doc.documentElement.outerHTML;
    if (fixed.toLowerCase().startsWith('<!doctype html>')) {
      newHtml = `<!DOCTYPE html>\n${newHtml}`;
    }
    updateFileContent(newHtml, true);
  };

  // Add / Update CSS Variable Handler
  const handleUpdateCssVar = (name: string, val: string) => {
    if (activeFile.type === 'html') {
      const updated = updateCssVariableInHtml(activeFile.content, name, val);
      updateFileContent(updated, true);
    }
  };

  // Insert Breakpoint Snippet into Document <style>
  const handleInsertMediaRule = (px: number) => {
    const mediaRule = `\n@media (max-width: ${px}px) {\n  /* Responsive Styles für Max-Breite: ${px}px */\n  body {\n    /* Mobile & Responsive Overrides */\n  }\n}\n`;
    if (activeFile.content.includes('</style>')) {
      const updated = activeFile.content.replace('</style>', `${mediaRule}</style>`);
      updateFileContent(updated, true);
      alert(`Media Query @media (max-width: ${px}px) in <style> eingefügt!`);
    } else if (activeFile.content.includes('</head>')) {
      const updated = activeFile.content.replace('</head>', `<style>${mediaRule}</style>\n</head>`);
      updateFileContent(updated, true);
      alert(`Media Query @media (max-width: ${px}px) in <head> eingefügt!`);
    }
  };
  const [selectedStyles, setSelectedStyles] = useState<{
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    fontSize: number;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
    bgColor: string;
    textColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
  }>({
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    bgColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#e2e8f0',
    borderWidth: 0,
    borderRadius: 0
  });

  // Saved Snippets from ComponentStorage
  const [savedSnippets] = useLocalStorage<CodeSnippet[]>('yes-component-storage-snippets', []);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Code Editor Theme State (vs-dark, vs, hc-black, hc-light)
  const [editorTheme, setEditorTheme] = useLocalStorage<string>('yes-editor-theme', 'vs-dark');

  // Export Code Snippet Image State & Ref
  const exportImageRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);

  // Keyboard Shortcuts Modal Pressed Key Tracker
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');
  const [shortcutSearchQuery, setShortcutSearchQuery] = useState<string>('');

  // UI Modals
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLinterOpen, setIsLinterOpen] = useState(false);
  const [linterReports, setLinterReports] = useState<{ type: string; message: string }[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'editor' | 'ai' | 'automation' | 'tools' | 'cmd' | 'export'>('editor');
  const [aiAssistantModel, setAiAssistantModel] = useLocalStorage<string>('yes-ai-assistant-model', 'openrouter/auto');
  const [autoFixOnSave, setAutoFixOnSave] = useLocalStorage<boolean>('yes-autofix-on-save', false);

  // Automation Rules Engine State
  const [automationRules, setAutomationRules] = useLocalStorage<AutomationRule[]>('yes-automation-rules', DEFAULT_AUTOMATION_RULES);
  const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<AutomationRule['trigger']>('ON_SAVE_TEMPLATE');
  const [newRuleAction, setNewRuleAction] = useState<AutomationRule['action']>('AUTO_BACKUP_METADATA');
  const [newRuleDescription, setNewRuleDescription] = useState<string>('');

  // AI Settings Advisor State
  const [isAnalyzingSettings, setIsAnalyzingSettings] = useState<boolean>(false);
  const [advisorLastAnalyzed, setAdvisorLastAnalyzed] = useState<string>('Gerade eben');

  // Smart Actions & Context Menu State
  const [isSmartActionsDropdownOpen, setIsSmartActionsDropdownOpen] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuDetails, setContextMenuDetails] = useState<{ elementTag?: string; elementClasses?: string; text?: string } | null>(null);

  // Global Command Palette State
  const [commandPaletteQuery, setCommandPaletteQuery] = useState<string>('');
  const [commandPaletteCategory, setCommandPaletteCategory] = useState<string>('all');
  const [commandPaletteSelectedIndex, setCommandPaletteSelectedIndex] = useState<number>(0);

  // Global Undo / Redo Stacks (Command Pattern)
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Ref to Visual Canvas iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handler: Export Code Snippet as Styled Image using html2canvas
  const handleExportCodeSnippetImage = async () => {
    if (!exportImageRef.current) return;
    try {
      setIsExportingImage(true);
      const canvas = await html2canvas(exportImageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imageBlob = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.download = `${activeFile.name.replace(/\.[^/.]+$/, '')}-snippet.png`;
      downloadAnchor.href = imageBlob;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Code snippet image export error:', err);
      alert('Fehler beim Generieren des Snippet-Bildes.');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Push new state to undo stack
  const recordHistoryState = (previousContent: string) => {
    setUndoStack(prev => [...prev.slice(-40), previousContent]);
    setRedoStack([]); // Clear redo on new action
  };

  // Perform Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, undoStack.length - 1);
    setRedoStack(prev => [...prev, activeFile.content]);
    setUndoStack(newUndo);
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: previous } : f));
  };

  // Perform Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, redoStack.length - 1);
    setUndoStack(prev => [...prev, activeFile.content]);
    setRedoStack(newRedo);
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: next } : f));
  };

  // Update Active File Content with history recording
  const updateFileContent = (content: string, recordHistory = true) => {
    if (recordHistory && content !== activeFile.content) {
      recordHistoryState(activeFile.content);
    }
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content } : f));
  };

  // Run Encoding Fixer on active file
  const handleFixEncoding = () => {
    const fixed = fixMojibake(activeFile.content);
    updateFileContent(fixed, true);
  };

  // Beautify active file code
  const handleBeautifyCode = () => {
    try {
      if (activeFile.type === 'html') {
        let formatted = activeFile.content;
        if (typeof htmlBeautify === 'function') {
          formatted = htmlBeautify(activeFile.content, { indent_size: 2, wrap_line_length: 120 });
        } else if (htmlBeautify && typeof (htmlBeautify as any).html_beautify === 'function') {
          formatted = (htmlBeautify as any).html_beautify(activeFile.content, { indent_size: 2, wrap_line_length: 120 });
        } else {
          let indentLevel = 0;
          const tab = '  ';
          const lines = formatted
            .replace(/>\s*</g, '>\n<')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

          const result: string[] = [];
          lines.forEach(line => {
            if (line.match(/^<\//)) indentLevel = Math.max(0, indentLevel - 1);
            result.push(tab.repeat(indentLevel) + line);
            if (line.match(/^<[^\/!\?]/) && !line.match(/\/>$/) && !line.match(/<(img|br|hr|input|meta|link|col|area|base)/i) && !line.includes('</')) {
              indentLevel++;
            }
          });
          formatted = result.join('\n');
        }
        updateFileContent(formatted, true);
      } else if (activeFile.type === 'css') {
        const formatted = activeFile.content
          .replace(/\s*\{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n  ')
          .replace(/\s*\}\s*/g, '\n}\n\n')
          .replace(/\s*,\s*/g, ', ')
          .replace(/\n\s*\n\s*\n/g, '\n\n');
        updateFileContent(formatted, true);
      }
      alert('✨ Code erfolgreich mit Prettifier formatiert!');
    } catch (err) {
      console.error('Beautify error:', err);
      alert('Code konnte nicht formatiert werden.');
    }
  };

  // Quick Insert Boilerplate Structure
  const handleInsertQuickBoilerplate = (code: string, name?: string) => {
    if (!activeFile.content || activeFile.content.trim() === '') {
      updateFileContent(code.trim(), true);
    } else {
      if (activeFile.content.includes('</body>')) {
        const updated = activeFile.content.replace('</body>', `\n${code.trim()}\n</body>`);
        updateFileContent(updated, true);
      } else {
        updateFileContent(`${activeFile.content}\n\n${code.trim()}`, true);
      }
    }
    alert(`Boilerplate "${name || 'HTML Baustein'}" erfolgreich eingefügt!`);
  };

  // Save selected element snippet to Component Storage
  const handleSaveSelectedToStorage = () => {
    if (!selectedPath || !iframeRef.current || !iframeRef.current.contentWindow) {
      alert('Bitte wähle zuerst ein Element im Canvas aus.');
      return;
    }

    const code = `
      (function() {
        const el = document.querySelector(${JSON.stringify(selectedPath)});
        return el ? el.outerHTML : '';
      })();
    `;

    try {
      const elementHtml = (iframeRef.current.contentWindow as any).eval(code);
      if (!elementHtml) return;

      const title = prompt('Name für diesen Baustein in Component Storage:', `WYSIWYG ${selectedTag.toUpperCase()} Snippet`);
      if (!title) return;

      const existingSnippets: CodeSnippet[] = JSON.parse(localStorage.getItem('yes-component-storage-snippets') || '[]');
      const newSnippet: CodeSnippet = {
        id: `snippet-wysiwyg-${Date.now()}`,
        title,
        category: 'Custom',
        tags: ['wysiwyg', selectedTag],
        code: elementHtml,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('yes-component-storage-snippets', JSON.stringify([newSnippet, ...existingSnippets]));
      alert(`Baustein "${title}" erfolgreich in Component Storage gespeichert!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Create New File
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split('.').pop()?.toLowerCase();
    const type: 'html' | 'css' | 'js' = ext === 'css' ? 'css' : ext === 'js' ? 'js' : 'html';

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: newFileName.trim(),
      type,
      folder: 'root',
      content: type === 'html' ? '<div>Neu erstellter HTML-Block</div>' : '/* Neuer Code */'
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName('');
    setIsNewFileModalOpen(false);
  };

  // Export structured project as ZIP using JSZip
  const handleExportZipProject = async () => {
    const zip = new JSZip();
    const rootFolder = zip.folder('website');

    if (!rootFolder) return;

    // Add files
    files.forEach(f => {
      if (f.folder === 'components') {
        rootFolder.folder('components')?.file(f.name, f.content);
      } else {
        rootFolder.file(f.name, f.content);
      }
    });

    // Add assets directory with standard production files
    const assetsFolder = rootFolder.folder('assets');
    const cssFile = files.find(f => f.type === 'css');
    assetsFolder?.file('styles.css', cssFile ? cssFile.content : '/* Custom CSS Output */\nbody { font-family: sans-serif; }');
    assetsFolder?.file('script.js', '// Production Javascript\nconsole.log("YES Studio Website Loaded.");');

    // Add README.md documentation
    rootFolder.file(
      'README.md',
      `# Website Export - YES Studio WYSIWYG
Exportiert am: ${new Date().toLocaleString('de-DE')}

## Inhaltsstruktur:
- \`/website/index.html\` - Haupt-Landing-Page mit Tailwind CDN
- \`/website/assets/styles.css\` - Globale CSS Stylesheet-Datei
- \`/website/assets/script.js\` - JavaScript Interaktions-Skript
- \`/website/components/\` - Vorlagen & E-Mail-Templates

## Verwendung:
Öffne einfach \`index.html\` im Browser oder hoste den Ordner \`/website\` auf jedem beliebigen Webserver.`
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = 'website-project.zip';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // Automation Trigger Execution Engine
  const runAutomationTriggers = useCallback((triggerType: AutomationRule['trigger']) => {
    setAutomationRules(prevRules => {
      let hasChange = false;
      const nextRules = prevRules.map(rule => {
        if (rule.enabled && rule.trigger === triggerType) {
          hasChange = true;
          setTimeout(() => {
            if (rule.action === 'AUTO_BACKUP_METADATA') {
              handleCreateVersionSnapshot(`Auto-Backup (${rule.name})`, 'Automatisch durch Automation Rule erzeugt');
            } else if (rule.action === 'AUTO_FORMAT_CODE') {
              handleBeautifyCode();
            } else if (rule.action === 'AUTO_FIX_A11Y') {
              handleAutoFixA11y();
            } else if (rule.action === 'GENERATE_README_DOC') {
              const readmeExists = files.some(f => f.name.toLowerCase() === 'readme.md');
              if (!readmeExists) {
                const readmeContent = `# ${activeFile.name.replace(/\.[^/.]+$/, '')} Project Documentation\n\nGenerated automatically via YES Studio Automation Rules.\n\n## Structure\n- Main File: ${activeFile.name}\n- Date: ${new Date().toLocaleString('de-DE')}\n`;
                setFiles(prev => [...prev, {
                  id: `readme-${Date.now()}`,
                  name: 'README.md',
                  type: 'html' as const,
                  folder: 'root',
                  content: readmeContent
                }]);
              }
            } else if (rule.action === 'NOTIFY_STATUS') {
              alert(`⚡ Automation Rule ausgeführt: ${rule.name}`);
            }
          }, 50);

          return {
            ...rule,
            runCount: rule.runCount + 1,
            lastRun: new Date().toLocaleTimeString('de-DE')
          };
        }
        return rule;
      });
      return hasChange ? nextRules : prevRules;
    });
  }, [files, activeFile.name, setAutomationRules, setFiles]);

  // Dynamic Smart Actions based on current context
  const dynamicSmartActions = useMemo(() => {
    const actions: Array<{
      id: string;
      title: string;
      description: string;
      confidence: number;
      category: 'seo' | 'css' | 'a11y' | 'mso' | 'export' | 'code';
      icon: any;
      action: () => void;
    }> = [];

    const content = activeFile.content || '';

    // 1. SEO & OpenGraph
    if (activeFile.type === 'html') {
      const hasOgMeta = content.includes('og:title') || content.includes('og:image');
      actions.push({
        id: 'sa-seo',
        title: '🔍 SEO & Meta Tags Optimierer',
        description: !hasOgMeta ? 'Füge fehlende OpenGraph Social-Share Meta Tags in <head> ein' : 'Überprüfe SEO Metadaten & Ranking Signale',
        confidence: !hasOgMeta ? 98 : 86,
        category: 'seo',
        icon: Globe,
        action: () => {
          if (!content.includes('og:title')) {
            const ogSnippet = `\n  <meta property="og:title" content="${activeFile.name.replace(/\.[^/.]+$/, '')}">\n  <meta property="og:description" content="Erstellt mit YES Studio WYSIWYG Ecosystem">\n  <meta property="og:type" content="website">`;
            if (content.includes('</head>')) {
              updateFileContent(content.replace('</head>', `${ogSnippet}\n</head>`), true);
              alert('✓ OpenGraph SEO Meta Tags erfolgreich eingefügt!');
            } else {
              alert('Kein <head> Element im Dokument gefunden.');
            }
          } else {
            alert('✓ SEO Meta Tags sind bereits vorhanden.');
          }
        }
      });
    }

    // 2. CSS Variables
    if (content.includes('#') || content.includes('rgb') || content.includes('style=')) {
      actions.push({
        id: 'sa-css-vars',
        title: '🎨 CSS Variablen & HSL Palette Extrahieren',
        description: 'Hardcoded Hex-Farben in ein zentrales :root CSS Variablen-System umwandeln',
        confidence: 94,
        category: 'css',
        icon: Palette,
        action: () => {
          const rootCss = `\n/* YES Studio CSS Color Tokens */\n:root {\n  --color-primary: #2563eb;\n  --color-secondary: #7c3aed;\n  --color-accent: #10b981;\n  --color-[#0f172a]: #0f172a;\n}\n`;
          if (content.includes('</head>')) {
            updateFileContent(content.replace('</head>', `<style>${rootCss}</style>\n</head>`), true);
            alert('✓ :root CSS Farbtokens im <head> deklariert!');
          } else {
            alert(`CSS Farbtokens:\n${rootCss}`);
          }
        }
      });
    }

    // 3. A11y Alt-Texts & ARIA
    const missingAltMatches = (content.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
    if (missingAltMatches > 0 || !content.includes('aria-')) {
      actions.push({
        id: 'sa-a11y',
        title: '♿ Auto-Fix Accessibility (A11y)',
        description: missingAltMatches > 0 ? `${missingAltMatches} Bild(er) ohne alt-Attribute automatisch reparieren` : 'ARIA Labels & Tastaturfokus optimieren',
        confidence: 96,
        category: 'a11y',
        icon: ShieldAlert,
        action: () => {
          handleAutoFixA11y();
          runAutomationTriggers('ON_A11Y_AUDIT');
        }
      });
    }

    // 4. MSO Email Table
    if (content.includes('table') || activeFile.name.toLowerCase().includes('mail') || activeFile.name.toLowerCase().includes('newsletter')) {
      actions.push({
        id: 'sa-mso',
        title: '📧 In MSO 600px Email Table umwandeln',
        description: 'Layout in Outlook 2016-2024 kompatibles 600px Tabellen-Raster wrappen',
        confidence: 92,
        category: 'mso',
        icon: Mail,
        action: () => {
          const msoWrapper = `<!--[if mso]>\n<table width="600" align="center" cellpadding="0" cellspacing="0" border="0">\n<tr><td>\n<![endif]-->\n${content}\n<!--[if mso]>\n</td></tr></table>\n<![endif]-->`;
          updateFileContent(msoWrapper, true);
          alert('✓ MSO 600px E-Mail Tabellen-Wrapper eingefügt!');
        }
      });
    }

    // 5. Prettify Code
    actions.push({
      id: 'sa-prettify',
      title: '✨ Code Prettify & Formatieren',
      description: 'HTML/CSS automatisch mit sauberen 2-Space Einrückungen formatieren',
      confidence: 88,
      category: 'code',
      icon: Sparkles,
      action: () => {
        handleBeautifyCode();
        runAutomationTriggers('ON_CODE_SAVE');
      }
    });

    // 6. ZIP Export
    actions.push({
      id: 'sa-export-zip',
      title: '📦 Projekt als ZIP Archiv exportieren',
      description: 'Erstellt ein strukturiertes ZIP mit allen HTML, CSS & Asset-Dateien',
      confidence: 85,
      category: 'export',
      icon: Download,
      action: () => {
        handleExportZipProject();
        runAutomationTriggers('ON_ZIP_EXPORT');
      }
    });

    return actions;
  }, [activeFile.content, activeFile.name, activeFile.type, handleAutoFixA11y, handleBeautifyCode, handleExportZipProject, runAutomationTriggers, updateFileContent]);

  // Computed AI Settings Advisor Recommendations
  const advisorSuggestions = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      confidence: number;
      category: string;
      reasoning: string;
      actionLabel: string;
      apply: () => void;
    }> = [];

    const hasTableCode = activeFile.content.includes('<table');
    const autoFixActive = autoFixOnSave;
    const isAdvancedModel = aiAssistantModel === 'anthropic/claude-3.7-sonnet' || aiAssistantModel === 'openrouter/auto';

    if (hasTableCode && !isAdvancedModel) {
      list.push({
        id: 'adv-model',
        title: 'Claude 3.7 Sonnet / OpenRouter Auto für E-Mail & Tabellen-Layouts aktivieren',
        confidence: 98,
        category: '🤖 AI Model Advisor',
        reasoning: 'Dein aktiver Code enthält verschachtelte MSO HTML-Tabellen. Claude 3.7 Sonnet über OpenRouter versteht komplexe Outlook Table Rules präziser.',
        actionLabel: 'OpenRouter Auto Einstellen',
        apply: () => {
          setAiAssistantModel('openrouter/auto');
          alert('✓ OpenRouter Auto wurde als bevorzugtes AI Modell gesetzt.');
        }
      });
    }

    const backupRule = automationRules.find(r => r.id === 'rule-tpl-backup');
    if (!backupRule || !backupRule.enabled) {
      list.push({
        id: 'adv-backup',
        title: 'Auto-Backup to Metadata Store aktivieren',
        confidence: 95,
        category: '⚡ Automation Advisor',
        reasoning: 'Schützt Vorlagen bei Änderungen durch automatische Version Snapshots im Metadata Store.',
        actionLabel: 'Backup Rule Aktivieren',
        apply: () => {
          setAutomationRules(prev => prev.map(r => r.id === 'rule-tpl-backup' ? { ...r, enabled: true } : r));
          alert('✓ Auto-Backup Automation Rule aktiviert.');
        }
      });
    }

    if (!autoFixActive) {
      list.push({
        id: 'adv-autofix',
        title: 'Auto-Fix A11y & SEO auf EIN stellen',
        confidence: 93,
        category: '🛡️ Quality Advisor',
        reasoning: 'Ergänzt automatisch fehlende alt-Texte, Viewport Meta Tags und OpenGraph Attribute.',
        actionLabel: 'Auto-Fix Aktivieren',
        apply: () => {
          setAutoFixOnSave(true);
          alert('✓ Auto-Fix A11y & SEO aktiviert.');
        }
      });
    }

    const formatRule = automationRules.find(r => r.id === 'rule-save-format');
    if (!formatRule || !formatRule.enabled) {
      list.push({
        id: 'adv-format',
        title: 'Auto Prettify beim Speichern aktivieren',
        confidence: 90,
        category: '✨ Code Quality Advisor',
        reasoning: 'Formatiert HTML & CSS automatisch mit sauberen 2-Space Einrückungen beim Speichern.',
        actionLabel: 'Auto-Format Rule Aktivieren',
        apply: () => {
          setAutomationRules(prev => prev.map(r => r.id === 'rule-save-format' ? { ...r, enabled: true } : r));
          alert('✓ Auto Prettify Rule aktiviert.');
        }
      });
    }

    return list;
  }, [activeFile.content, autoFixOnSave, aiAssistantModel, automationRules, setAiAssistantModel, setAutomationRules, setAutoFixOnSave]);

  const setActiveToolContext = useCrossToolStore((s) => s.setActiveToolContext);
  const addSnippet = useCrossToolStore((s) => s.addSnippet);

  // AI Context Menu State for Editor
  const [editorContextMenu, setEditorContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);
  const [isContextAiLoading, setIsContextAiLoading] = useState<boolean>(false);
  const editorInstanceRef = useRef<any>(null);

  // Close context menu on window click or scroll
  useEffect(() => {
    const handleCloseMenu = () => setEditorContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, []);

  const handleEditorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    let text = '';
    if (editorInstanceRef.current) {
      const selection = editorInstanceRef.current.getSelection();
      text = editorInstanceRef.current.getModel()?.getValueInRange(selection) || '';
    }
    if (!text.trim()) {
      text = activeFile.content.slice(0, 1500); // fallback block
    }
    setEditorContextMenu({
      x: e.clientX,
      y: e.clientY,
      selectedText: text
    });
  };

  const handleExecuteAiQuickAction = async (
    promptType: 'refactor' | 'component' | 'tailwind' | 'mso' | 'explain'
  ) => {
    if (!editorContextMenu?.selectedText) return;
    setIsContextAiLoading(true);

    try {
      const apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        alert('Bitte hinterlege deinen OpenRouter API Key in den Einstellungen.');
        setIsContextAiLoading(false);
        setEditorContextMenu(null);
        return;
      }

      const text = editorContextMenu.selectedText;

      if (promptType === 'component') {
        const compName = prompt('Name für die neue Komponente:', 'Unbenannte Komponente') || 'Komponente';
        addSnippet({
          name: compName,
          code: text,
          type: activeFile.name.endsWith('.css') ? 'css' : 'html',
          tags: ['component', 'context-menu', activeFile.name],
          sourceTool: 'WYSIWYG Studio'
        });
        alert(`✓ Komponente "${compName}" erfolgreich im Component Storage gespeichert!`);
        setIsContextAiLoading(false);
        setEditorContextMenu(null);
        return;
      }

      let systemPrompt = '';
      if (promptType === 'refactor') {
        systemPrompt = 'Du bist ein Senior Frontend Engineer. Refactore und bereinige den folgenden HTML/CSS-Code-Block. Optimiere Semantik, Formatierung und Struktur. Gib AUSSCHLIESSLICH den fertigen, refactorten Code-Block zurück, ohne Erklärungen oder Markdown-Backticks.';
      } else if (promptType === 'tailwind') {
        systemPrompt = 'Du bist ein Tailwind CSS Experte. Optimiere, bereinige und sortiere alle Tailwind-Klassen in diesem Code-Block logisch und performant. Gib AUSSCHLIESSLICH den fertigen Code-Block zurück, ohne Erklärungen oder Markdown-Backticks.';
      } else if (promptType === 'mso') {
        systemPrompt = 'Du bist ein E-Mail HTML Spezialist. Konvertiere diesen HTML-Block in eine MSO/Outlook-kompatible E-Mail Tabellenstruktur (inkl. <!--[if mso]> Konditionen falls nötig). Gib AUSSCHLIESSLICH den fertigen HTML-Code zurück.';
      } else if (promptType === 'explain') {
        systemPrompt = 'Erkläre kurz und verständlich in 2-3 Sätzen auf Deutsch, was dieser Code-Block macht.';
      }

      const res = await callOpenRouterChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        model: getOpenRouterModel(),
        temperature: 0.3
      });

      const reply = res.choices?.[0]?.message?.content || '';

      if (promptType === 'explain') {
        alert(`🔍 **Code Erklärung:**\n\n${reply}`);
      } else if (reply.trim()) {
        let cleanCode = reply.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
        if (editorInstanceRef.current) {
          const selection = editorInstanceRef.current.getSelection();
          if (selection && !selection.isEmpty()) {
            editorInstanceRef.current.executeEdits('ai-quick-action', [
              { range: selection, text: cleanCode }
            ]);
          } else {
            updateFileContent(cleanCode, true);
          }
        } else {
          updateFileContent(cleanCode, true);
        }
      }
    } catch (err: any) {
      alert(`❌ Fehler bei der KI-Aktion: ${err.message || err}`);
    } finally {
      setIsContextAiLoading(false);
      setEditorContextMenu(null);
    }
  };

  // Sync active code to Cross-Tool Store
  useEffect(() => {
    setActiveToolContext({
      toolId: 'wysiwyg',
      toolName: 'WYSIWYG Studio',
      activeCode: activeFile.content,
      activeFileName: activeFile.name,
      language: activeFile.name.endsWith('.css') ? 'css' : activeFile.name.endsWith('.json') ? 'json' : 'html'
    });
  }, [activeFile.content, activeFile.name, setActiveToolContext]);

  // Handle global code injection event (e.g. from Embedded AI Assistant or Cross-Tool Hub)
  useEffect(() => {
    const handleInjectCode = (e: CustomEvent<{ code: string; toolId?: string }>) => {
      if (!e.detail?.code) return;
      if (!e.detail.toolId || e.detail.toolId === 'wysiwyg') {
        updateFileContent(e.detail.code, true);
      }
    };

    window.addEventListener('yes-inject-code', handleInjectCode as EventListener);
    return () => window.removeEventListener('yes-inject-code', handleInjectCode as EventListener);
  }, [updateFileContent]);

  // Listen to Keyboard Shortcuts (Ctrl+S, Ctrl+/, Ctrl+K, Ctrl+B, Ctrl+Z, Ctrl+Y, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Keypress feedback for shortcuts modal
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.metaKey) parts.push('Cmd');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
        parts.push(e.key.toUpperCase());
      }
      if (parts.length > 0) {
        setLastKeyPressed(parts.join(' + '));
      }

      // Ctrl + S -> Save & Snapshot
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCreateVersionSnapshot(
          `Save: ${activeFile.name}`,
          `Tastenkombination Ctrl+S um ${new Date().toLocaleTimeString('de-DE')}`
        );
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setViewMode(prev => prev === 'split' ? 'visual' : prev === 'visual' ? 'code' : 'split');
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedPath(null);
        setIsShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, activeFile.content, activeFile.name]);

  // Sync iframe canvas DOM selection
  const handleIframeMessage = useCallback((e: MessageEvent) => {
    if (e.data && e.data.type === 'ELEMENT_SELECTED') {
      const { path, tag, classes, text, styles, computedMap } = e.data;
      setSelectedPath(path);
      setSelectedTag(tag);
      setSelectedClasses(classes || '');
      setSelectedTextContent(text || '');
      if (styles) setSelectedStyles(styles);
      if (computedMap) setComputedStylesList(computedMap);
    } else if (e.data && e.data.type === 'DOM_CHANGED') {
      const { html } = e.data;
      if (html && activeFile.type === 'html') {
        updateFileContent(html, true);
      }
    }
  }, [activeFile.id, activeFile.type, activeFile.content]);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  // Command Palette Items & AI Semantic Search Logic
  const allCommandPaletteItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      category: 'actions' | 'templates' | 'settings' | 'tools' | 'docs';
      categoryLabel: string;
      description: string;
      keywords: string[];
      shortcut?: string;
      badge?: string;
      action: () => void;
    }> = [
      // Actions
      {
        id: 'prettify',
        title: '✨ Code Prettify & Formatting',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Formatiert aktiven HTML/CSS Code automatisch mit sauberen Einrückungen',
        keywords: ['prettify', 'format', 'beautify', 'sauber', 'einrücken', 'clean', 'indent'],
        action: () => { handleBeautifyCode(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'autofix-a11y',
        title: '♿ Auto-Fix Accessibility (A11y)',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Repariert automatisch fehlende Alt-Texte, Lang-Attribute & ARIA Labels',
        keywords: ['a11y', 'barrierefrei', 'accessibility', 'alt', 'aria', 'contrast', 'screenreader'],
        action: () => { handleAutoFixA11y(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'autofix-health',
        title: '🏥 Auto-Fix HTML Health & Metadaten',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Fügt <!DOCTYPE>, Viewport Meta, Title und OpenGraph Tags automatisch ein',
        keywords: ['health', 'doctype', 'viewport', 'seo', 'meta', 'title', 'opengraph'],
        action: () => { handleAutoFixHealth(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'export-zip',
        title: '📦 Projekt als ZIP Archiv exportieren',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Erstellt ein strukturiertes ZIP mit allen HTML, CSS, JS & Asset-Dateien',
        keywords: ['zip', 'export', 'download', 'projekt', 'archiv', 'paket'],
        shortcut: 'ZIP Export',
        action: () => { handleExportZipProject(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'export-png',
        title: '🖼️ Code-Snippet als PNG Bild exportieren',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Generiert ein hochauflösendes Bild des gewählten Code-Ausschnitts',
        keywords: ['png', 'bild', 'image', 'snippet', 'export', 'screenshot', 'grafik'],
        action: () => { handleExportCodeSnippetImage(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'toggle-grid',
        title: '📐 Layout Grid Debugger Umschalten',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Blendet das Ausrichtungs-Raster & Spalten-Grid auf dem Canvas ein/aus',
        keywords: ['grid', 'layout', 'raster', 'ausrichtung', 'lines', 'debug'],
        action: () => { setIsLayoutDebuggerOpen(prev => !prev); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'undo',
        title: '↩️ Rückgängig machen (Undo)',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Stellt den vorherigen Stand der aktiven Datei wieder her',
        keywords: ['undo', 'rückgängig', 'zurück', 'restore'],
        shortcut: 'Ctrl+Z',
        action: () => { handleUndo(); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'redo',
        title: '↪️ Wiederholen (Redo)',
        category: 'actions',
        categoryLabel: '⚡ Quick Action',
        description: 'Wiederholt die zuletzt rückgängig gemachte Änderung',
        keywords: ['redo', 'wiederholen', 'forward'],
        shortcut: 'Ctrl+Y',
        action: () => { handleRedo(); setIsCommandPaletteOpen(false); }
      },

      // Templates & Boilerplates
      {
        id: 'tpl-archive',
        title: '📑 Templates & Mailings Archiv öffnen',
        category: 'templates',
        categoryLabel: '📑 Templates',
        description: 'Verwalte gespeicherte E-Mail Sonderausgaben, SAM Liftletter & Anzeigen',
        keywords: ['templates', 'mailings', 'gevestor', 'liftletter', 'sonderausgabe', 'archiv', 'email', 'newsletter'],
        badge: `${templatesStorage.length} Vorlagen`,
        action: () => { setIsCommandPaletteOpen(false); setIsTemplateStorageModalOpen(true); }
      },
      {
        id: 'new-tpl',
        title: '➕ Aktuelle Datei als Template speichern',
        category: 'templates',
        categoryLabel: '📑 Templates',
        description: 'Speichert aktiven Code als wiederverwendbares Template im Archiv',
        keywords: ['save template', 'neues template', 'speichern', 'vorlage erstellen'],
        action: () => { setIsCommandPaletteOpen(false); setIsCreateTemplateModalOpen(true); }
      },

      // Quick Boilerplates
      ...QUICK_INSERT_BOILERPLATES.map(b => ({
        id: `insert-${b.id}`,
        title: `🧩 ${b.name} einfügen`,
        category: 'templates' as const,
        categoryLabel: '🧩 Quick Snippet',
        description: b.description,
        keywords: ['insert', 'einfügen', 'snippet', b.id, b.category.toLowerCase(), ...b.name.toLowerCase().split(' ')],
        badge: b.category,
        action: () => { handleInsertQuickBoilerplate(b.code, b.name); setIsCommandPaletteOpen(false); }
      })),

      // Custom Templates from Storage
      ...templatesStorage.map(t => ({
        id: `tpl-item-${t.id}`,
        title: `📧 ${t.title}`,
        category: 'templates' as const,
        categoryLabel: '📑 Saved Template',
        description: `${t.customer} • ${t.mainCategory} (${t.subCategory}) - ${t.description}`,
        keywords: ['template', t.title.toLowerCase(), t.customer.toLowerCase(), t.mainCategory.toLowerCase(), t.subCategory.toLowerCase()],
        badge: t.customer,
        action: () => { setQuickPreviewTemplate(t); setIsCommandPaletteOpen(false); }
      })),

      // Settings
      {
        id: 'settings-modal',
        title: '⚙️ Alle Studio-Einstellungen öffnen',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Editor-Themes, KI-Assistent Modell & System-Optionen verwalten',
        keywords: ['settings', 'einstellungen', 'options', 'konfiguration', 'theme', 'ai'],
        action: () => { setIsCommandPaletteOpen(false); setIsSettingsModalOpen(true); }
      },
      {
        id: 'theme-vs-dark',
        title: '🌙 Theme: VS Dark Mode',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Klassisches dunkles Visual Studio Syntax Highlighting Theme',
        keywords: ['dark', 'vs dark', 'dunkel', 'theme', 'editor'],
        action: () => { setEditorTheme('vs-dark'); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'theme-vs-light',
        title: '☀️ Theme: VS Light Mode',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Helles Visual Studio Theme für Tageslicht & Präsentationen',
        keywords: ['light', 'vs light', 'hell', 'theme', 'editor'],
        action: () => { setEditorTheme('vs'); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'ai-model-auto',
        title: '⚡ KI Modell: OpenRouter Auto (Standard)',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Automatische Modellauswahl für beste Performance & Preis',
        keywords: ['openrouter auto', 'ai model', 'auto', 'standard'],
        action: () => { setAiAssistantModel('openrouter/auto'); setIsCommandPaletteOpen(false); alert('OpenRouter Auto als KI-Modell gewählt.'); }
      },
      {
        id: 'ai-model-claude',
        title: '🧠 KI Modell: Claude 3.7 Sonnet',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Höchste Präzision für komplexe HTML/CSS Refactorings & Deep Audits',
        keywords: ['claude sonnet', 'openrouter', 'ai model', 'claude 3.7'],
        action: () => { setAiAssistantModel('anthropic/claude-3.7-sonnet'); setIsCommandPaletteOpen(false); alert('Claude 3.7 Sonnet als KI-Modell gewählt.'); }
      },
      {
        id: 'ai-model-free',
        title: '🆓 KI Modell: OpenRouter Free Router',
        category: 'settings',
        categoryLabel: '⚙️ Settings',
        description: 'Kostenlose OpenRouter KI-Modelle ohne Guthaben-Verbrauch',
        keywords: ['openrouter free', 'free model', 'kostenlos', 'schnell'],
        action: () => { setAiAssistantModel('openrouter/free'); setIsCommandPaletteOpen(false); alert('OpenRouter Free als KI-Modell gewählt.'); }
      },

      // Tools
      {
        id: 'tool-dependency-graph',
        title: '🌐 Dependency Graph & Asset Analyzer',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Visualisiert CSS-Variablen, Bild-Ressourcen & ungenutzte Orphans',
        keywords: ['dependency', 'graph', 'orphans', 'css var', 'verknüpfungen', 'assets'],
        action: () => { setIsCommandPaletteOpen(false); setIsDependencyGraphModalOpen(true); }
      },
      {
        id: 'tool-hsl-palette',
        title: '🎨 Theme Palette Generator (HSL)',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Erstellt harmonische HSL Farbschemata und überträgt :root Variablen',
        keywords: ['palette', 'hsl', 'farben', 'colors', 'theme', 'root', 'generator'],
        action: () => { setIsCommandPaletteOpen(false); setIsThemePaletteModalOpen(true); }
      },
      {
        id: 'tool-version-history',
        title: '⏱️ Version History & Snapshots',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Vergleiche frühere Stände, erstelle Snapshots und führe Rollbacks durch',
        keywords: ['version', 'history', 'snapshots', 'rollback', 'historie', 'stand'],
        action: () => { setIsCommandPaletteOpen(false); setIsVersionHistoryModalOpen(true); }
      },
      {
        id: 'tool-doc-gen',
        title: '📖 Tech-Docs & README Generator',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Erstellt automatische Markdown-Dokumentation für dein Projekt',
        keywords: ['docs', 'readme', 'dokumentation', 'markdown', 'generator', 'doku'],
        action: () => { setIsCommandPaletteOpen(false); setIsDocGenModalOpen(true); }
      },
      {
        id: 'tool-component-storage',
        title: '📦 Component Storage Inspector',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Isolierte HTML/CSS Komponenten-Bibliothek im rechten Inspektor',
        keywords: ['component', 'storage', 'snippets', 'bausteine', 'elemente'],
        action: () => { setRightTab('inspector'); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'tool-seo',
        title: '🔍 SEO & Meta Tag Auditor',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Analysiert Meta Title, Description, Robots, Canonical & OpenGraph Tags',
        keywords: ['seo', 'meta', 'opengraph', 'title', 'google', 'canonical'],
        action: () => { setRightTab('seo'); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'tool-a11y',
        title: '♿ Accessibility Inspector (WCAG)',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Prüft Farbkontraste, Alt-Texte und Tastatur-Navigierbarkeit',
        keywords: ['a11y', 'kontrast', 'wcag', 'alt', 'barrierefrei'],
        action: () => { setRightTab('a11y'); setIsCommandPaletteOpen(false); }
      },
      {
        id: 'tool-linter',
        title: '🏥 Code Health Linter & Diagnosen',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Echtzeit-Validierung von Syntax, doppelten IDs & HTML-Fehlern',
        keywords: ['linter', 'diagnosen', 'syntax', 'health', 'code review'],
        action: () => { setIsCommandPaletteOpen(false); setIsLinterOpen(true); }
      },
      {
        id: 'tool-global-search',
        title: '🔍 Projektweites Suchen & Ersetzen',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Sucht nach HTML/CSS Mustern über alle Dateien hinweg',
        keywords: ['search', 'replace', 'suchen', 'ersetzen', 'find', 'global'],
        shortcut: 'Ctrl+Shift+F',
        action: () => { setIsCommandPaletteOpen(false); setIsGlobalSearchOpen(true); }
      },
      {
        id: 'tool-shortcuts',
        title: '⌨️ Tastenkombinationen Übersicht',
        category: 'tools',
        categoryLabel: '🛠️ Ecosystem Tool',
        description: 'Zeigt alle globalen Hotkeys mit Live-Taste-Visualisierung an',
        keywords: ['shortcuts', 'hotkeys', 'tasten', 'tastatur', 'hilfe'],
        shortcut: 'Ctrl+/',
        action: () => { setIsCommandPaletteOpen(false); setIsShortcutsOpen(true); }
      },

      // Docs & Guides
      {
        id: 'doc-mso-email',
        title: '📫 Guide: Outlook & MSO 600px Mailings',
        category: 'docs',
        categoryLabel: '📚 Dokumentation',
        description: 'Best Practices für tabellenbasierte HTML-E-Mails in Outlook 2016-2024 & Mobile',
        keywords: ['outlook', 'mso', 'email', 'mailing', '600px', 'table', 'doku', 'guide'],
        action: () => {
          alert('📫 MSO E-Mail Guide:\n1. Verwende 600px max-width Tabellen.\n2. Inlining von CSS Styles.\n3. Keine Flexbox oder CSS Grid für reine Outlook Clients.\n4. Nutze VML für Hintergrundbilder in Outlook.');
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'doc-tailwind',
        title: '🎨 Guide: Tailwind CSS v3 Best Practices',
        category: 'docs',
        categoryLabel: '📚 Dokumentation',
        description: 'Utility Klassen, Dark Mode Modifier & Responsive Prefixing (sm, md, lg)',
        keywords: ['tailwind', 'css', 'utility', 'responsive', 'flex', 'grid', 'doku'],
        action: () => {
          alert('🎨 Tailwind CSS Guide:\n1. Mobile-First: min-width breakpoints (sm: 640px, md: 768px, lg: 1024px).\n2. Dark Mode: dark:bg-slate-900 dark:text-white.\n3. Transitions: transition-all duration-200 active:scale-95.');
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'doc-wcag',
        title: '♿ Guide: WCAG AAA Barrierefreiheit Standards',
        category: 'docs',
        categoryLabel: '📚 Dokumentation',
        description: 'Anforderungen an Farbkontrast (4.5:1), ARIA Roles & Fokus-Ringe',
        keywords: ['wcag', 'aaa', 'a11y', 'barrierefrei', 'kontrast', 'aria', 'doku'],
        action: () => {
          alert('♿ WCAG Standards:\n1. Textkontrast mindestens 4.5:1 für normalen Text.\n2. Alle interaktiven Elemente (Buttons, Links) benötigen fokussierbare Umrandung.\n3. Alle Bilder brauchen sinnvolle alt-Attribute.');
          setIsCommandPaletteOpen(false);
        }
      }
    ];

    return items;
  }, [templatesStorage, activeFile.name]);

  // AI Semantic Relevance Filtering
  const filteredCommandPaletteItems = useMemo(() => {
    let list = allCommandPaletteItems;

    if (commandPaletteCategory !== 'all') {
      list = list.filter(item => item.category === commandPaletteCategory);
    }

    if (!commandPaletteQuery.trim()) {
      return list;
    }

    const q = commandPaletteQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/);

    const synonyms: Record<string, string[]> = {
      'dark': ['dunkel', 'vs-dark', 'night', 'black'],
      'light': ['hell', 'vs-light', 'day', 'white'],
      'mail': ['email', 'mailing', 'mso', 'outlook', 'newsletter', '600px', 'sonderausgabe'],
      'email': ['mail', 'mso', 'outlook', 'newsletter'],
      'format': ['prettify', 'beautify', 'clean', 'indent', 'sauber', 'einrücken'],
      'clean': ['prettify', 'beautify', 'format', 'autofix'],
      'color': ['palette', 'hsl', 'farben', 'theme', 'root'],
      'farbe': ['palette', 'hsl', 'color', 'theme'],
      'save': ['snapshot', 'history', 'version', 'speichern', 'template'],
      'zip': ['export', 'download', 'archiv', 'paket'],
      'a11y': ['barrierefrei', 'accessibility', 'alt', 'kontrast', 'wcag'],
      'seo': ['meta', 'title', 'opengraph', 'google', 'canonical'],
      'graph': ['dependency', 'asset', 'orphan', 'css var'],
    };

    const expandedTokens = [...tokens];
    tokens.forEach(t => {
      if (synonyms[t]) {
        expandedTokens.push(...synonyms[t]);
      }
    });

    const scored = list.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const catLower = item.categoryLabel.toLowerCase();

      if (titleLower.includes(q)) score += 20;
      if (descLower.includes(q)) score += 10;
      if (catLower.includes(q)) score += 8;

      expandedTokens.forEach(token => {
        if (titleLower.includes(token)) score += 8;
        if (descLower.includes(token)) score += 4;
        if (item.keywords.some(k => k.includes(token))) score += 6;
      });

      return { item, score };
    });

    return scored
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [allCommandPaletteItems, commandPaletteQuery, commandPaletteCategory]);

  // AI Semantic Insight Generator
  const commandPaletteAiInsight = useMemo(() => {
    if (!commandPaletteQuery.trim()) return null;
    const q = commandPaletteQuery.toLowerCase().trim();
    if (q.includes('mail') || q.includes('email') || q.includes('outlook') || q.includes('600px')) {
      return '🤖 KI Match: Für E-Mail Mailings empfiehlt sich das "600px Responsive Table Layout", das "Templates Archiv" oder der MSO E-Mail Guide.';
    }
    if (q.includes('format') || q.includes('clean') || q.includes('prettify') || q.includes('einrücken')) {
      return '🤖 KI Match: Führe "Code Prettify & Formatting" aus oder aktiviere "Auto-Fix on Save" in den Einstellungen.';
    }
    if (q.includes('dark') || q.includes('theme') || q.includes('color') || q.includes('hsl')) {
      return '🤖 KI Match: Nutze das "VS Dark Mode Theme" oder starte den "Theme Palette Generator (HSL)" für globale :root Variablen.';
    }
    if (q.includes('zip') || q.includes('export') || q.includes('download')) {
      return '🤖 KI Match: Nutze "Projekt als ZIP Archiv exportieren" oder "Code-Snippet als PNG Bild exportieren".';
    }
    if (q.includes('a11y') || q.includes('contrast') || q.includes('alt')) {
      return '🤖 KI Match: Führe "Auto-Fix Accessibility" aus oder öffne den "Accessibility Inspector (WCAG)" im rechten Panel.';
    }
    return `🤖 KI Match: ${filteredCommandPaletteItems.length} passende Studio-Werkzeuge & Befehle für "${commandPaletteQuery}" gefunden.`;
  }, [commandPaletteQuery, filteredCommandPaletteItems.length]);

  // Inject script into iframe to enable visual selection, drag resizing, and computed style extraction
  const getIframeDocSrc = (htmlContent: string) => {
    const selectorScript = `
      <script>
        (function() {
          let selectedEl = null;
          let resizerHandle = null;

          function getCssPath(el) {
            if (!(el instanceof Element)) return '';
            var path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
              var selector = el.nodeName.toLowerCase();
              if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
              } else {
                var sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                  if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth != 1) selector += ":nth-of-type("+nth+")";
              }
              path.unshift(selector);
              el = el.parentNode;
            }
            return path.join(" > ");
          }

          function getComputedStyleMap(el) {
            const comp = window.getComputedStyle(el);
            const map = {};
            const keyProps = [
              'display', 'position', 'top', 'right', 'bottom', 'left',
              'width', 'height', 'min-width', 'max-width', 'flex-direction',
              'justify-content', 'align-items', 'gap', 'margin-top', 'margin-right',
              'margin-bottom', 'margin-left', 'padding-top', 'padding-right',
              'padding-bottom', 'padding-left', 'font-family', 'font-size',
              'font-weight', 'line-height', 'letter-spacing', 'text-align',
              'color', 'background-color', 'border-width', 'border-color',
              'border-radius', 'box-shadow', 'opacity', 'z-index', 'overflow'
            ];
            keyProps.forEach(p => {
              map[p] = comp.getPropertyValue(p) || 'initial';
            });
            return map;
          }

          function attachResizer(el) {
            if (!resizerHandle) {
              resizerHandle = document.createElement('div');
              resizerHandle.id = 'wysiwyg-drag-resizer';
              resizerHandle.style.cssText = 'position:fixed;width:14px;height:14px;background:#0059FF;border:2px solid #ffffff;border-radius:4px;cursor:nwse-resize;z-index:99999;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:none;';
              document.body.appendChild(resizerHandle);

              let startX = 0, startY = 0, startW = 0, startH = 0;

              resizerHandle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!selectedEl) return;
                const rect = selectedEl.getBoundingClientRect();
                startX = e.clientX;
                startY = e.clientY;
                startW = rect.width;
                startH = rect.height;

                function onMouseMove(me) {
                  const newW = Math.max(20, startW + (me.clientX - startX));
                  const newH = Math.max(20, startH + (me.clientY - startY));
                  selectedEl.style.width = newW + 'px';
                  selectedEl.style.height = newH + 'px';
                  updateResizerPosition();
                }

                function onMouseUp() {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                  window.parent.postMessage({
                    type: 'DOM_CHANGED',
                    html: document.documentElement.outerHTML
                  }, '*');
                }

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              });
            }

            updateResizerPosition();
          }

          function updateResizerPosition() {
            if (!selectedEl || !resizerHandle) return;
            const rect = selectedEl.getBoundingClientRect();
            resizerHandle.style.display = 'block';
            resizerHandle.style.left = (rect.right - 7) + 'px';
            resizerHandle.style.top = (rect.bottom - 7) + 'px';
          }

          document.addEventListener('mouseover', function(e) {
            if (e.target.tagName === 'BODY' || e.target.tagName === 'HTML' || e.target.id === 'wysiwyg-drag-resizer') return;
            e.target.style.outline = '2px dashed #3B82F6';
            e.stopPropagation();
          });

          document.addEventListener('mouseout', function(e) {
            if (e.target !== selectedEl && e.target.id !== 'wysiwyg-drag-resizer') {
              e.target.style.outline = '';
            }
          });

          document.addEventListener('click', function(e) {
            if (e.target.id === 'wysiwyg-drag-resizer') return;
            e.preventDefault();
            e.stopPropagation();

            if (selectedEl) selectedEl.style.outline = '';

            selectedEl = e.target;
            selectedEl.style.outline = '3px solid #0059FF';

            const computed = window.getComputedStyle(selectedEl);
            const path = getCssPath(selectedEl);
            const computedMap = getComputedStyleMap(selectedEl);

            attachResizer(selectedEl);

            window.parent.postMessage({
              type: 'ELEMENT_SELECTED',
              path: path,
              tag: selectedEl.tagName.toLowerCase(),
              classes: selectedEl.className || '',
              text: selectedEl.innerText || '',
              computedMap: computedMap,
              styles: {
                paddingTop: parseInt(computed.paddingTop) || 0,
                paddingRight: parseInt(computed.paddingRight) || 0,
                paddingBottom: parseInt(computed.paddingBottom) || 0,
                paddingLeft: parseInt(computed.paddingLeft) || 0,
                marginTop: parseInt(computed.marginTop) || 0,
                marginRight: parseInt(computed.marginRight) || 0,
                marginBottom: parseInt(computed.marginBottom) || 0,
                marginLeft: parseInt(computed.marginLeft) || 0,
                fontSize: parseInt(computed.fontSize) || 16,
                fontWeight: computed.fontWeight,
                textAlign: computed.textAlign,
                bgColor: computed.backgroundColor,
                textColor: computed.color,
                borderColor: computed.borderColor,
                borderWidth: parseInt(computed.borderWidth) || 0,
                borderRadius: parseInt(computed.borderRadius) || 0,
              }
            }, '*');
          });

          document.addEventListener('dblclick', function(e) {
            if (e.target.id === 'wysiwyg-drag-resizer') return;
            e.preventDefault();
            e.stopPropagation();
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
              e.target.contentEditable = 'true';
              e.target.focus();
              e.target.addEventListener('blur', function() {
                e.target.contentEditable = 'false';
                window.parent.postMessage({
                  type: 'DOM_CHANGED',
                  html: document.documentElement.outerHTML
                }, '*');
              }, { once: true });
            }
          });

          window.addEventListener('scroll', updateResizerPosition);
          window.addEventListener('resize', updateResizerPosition);
        })();
      </script>
    `;

    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${selectorScript}</body>`);
    } else {
      return `${htmlContent}${selectorScript}`;
    }
  };

  // Send modification commands to Iframe DOM
  const sendCommandToIframe = (action: string, data?: any) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow || !selectedPath) return;

    const code = `
      (function() {
        const el = document.querySelector(${JSON.stringify(selectedPath)});
        if (!el) return;

        if ('${action}' === 'UPDATE_CLASSES') {
          el.className = ${JSON.stringify(data.classes)};
        } else if ('${action}' === 'UPDATE_TEXT') {
          el.innerText = ${JSON.stringify(data.text)};
        } else if ('${action}' === 'UPDATE_STYLE') {
          el.style[${JSON.stringify(data.property)}] = ${JSON.stringify(data.value)};
        } else if ('${action}' === 'DELETE') {
          el.remove();
        } else if ('${action}' === 'DUPLICATE') {
          const clone = el.cloneNode(true);
          el.parentNode.insertBefore(clone, el.nextSibling);
        } else if ('${action}' === 'MOVE_UP') {
          if (el.previousElementSibling) {
            el.parentNode.insertBefore(el, el.previousElementSibling);
          }
        } else if ('${action}' === 'MOVE_DOWN') {
          if (el.nextElementSibling) {
            el.parentNode.insertBefore(el.nextElementSibling, el);
          }
        }

        window.parent.postMessage({
          type: 'DOM_CHANGED',
          html: document.documentElement.outerHTML
        }, '*');
      })();
    `;

    try {
      (iframeRef.current.contentWindow as any).eval(code);
    } catch (err) {
      console.error('Command failed:', err);
    }
  };

  // Insert component HTML into iframe
  const handleInsertComponent = (codeSnippet: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    const code = `
      (function() {
        let target = document.querySelector(${JSON.stringify(selectedPath)});
        if (!target) target = document.body;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = ${JSON.stringify(codeSnippet)};
        while (wrapper.firstChild) {
          target.appendChild(wrapper.firstChild);
        }

        window.parent.postMessage({
          type: 'DOM_CHANGED',
          html: document.documentElement.outerHTML
        }, '*');
      })();
    `;

    try {
      (iframeRef.current.contentWindow as any).eval(code);
    } catch (err) {
      console.error('Insert component error:', err);
    }
  };

  // AI-Powered Element Generator
  const handleGenerateAiElement = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    // AI Generation Synthesizer with rich Tailwind templates
    setTimeout(() => {
      let generatedHtml = '';
      const query = aiPrompt.toLowerCase();

      if (query.includes('preis') || query.includes('pricing') || query.includes('tarif')) {
        generatedHtml = `
<section class="py-12 px-6 max-w-6xl mx-auto my-8">
  <div class="text-center mb-10">
    <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">TRANSPARENTE PREISE</span>
    <h2 class="text-3xl font-extrabold text-slate-900 mt-3">Wähle deinen passenden Tarif</h2>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-xl text-slate-900">Starter</h3>
        <p class="text-slate-500 text-sm mt-1">Perfekt für Einzelprojekte.</p>
        <div class="my-6"><span class="text-4xl font-black text-slate-900">€19</span><span class="text-slate-500 text-sm">/Monat</span></div>
        <ul class="text-sm text-slate-600 space-y-3 mb-8">
          <li class="flex items-center gap-2">✓ 5 HTML Templates</li>
          <li class="flex items-center gap-2">✓ Export in 1-Klick</li>
          <li class="flex items-center gap-2">✓ Basic Linter Support</li>
        </ul>
      </div>
      <button class="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm">Jetzt starten</button>
    </div>
    <div class="bg-blue-600 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative transform scale-105">
      <span class="absolute -top-3 right-6 bg-amber-400 text-slate-900 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">BELIEBT</span>
      <div>
        <h3 class="font-bold text-xl">Pro Studio</h3>
        <p class="text-blue-100 text-sm mt-1">Für professionelle Web-Entwickler.</p>
        <div class="my-6"><span class="text-4xl font-black">€49</span><span class="text-blue-200 text-sm">/Monat</span></div>
        <ul class="text-sm text-blue-50 space-y-3 mb-8">
          <li class="flex items-center gap-2">✓ Unbegrenzte HTML/CSS Projekte</li>
          <li class="flex items-center gap-2">✓ Monaco Code Sync & Linter</li>
          <li class="flex items-center gap-2">✓ Component Storage Anbindung</li>
          <li class="flex items-center gap-2">✓ Premium AI Synthesizer</li>
        </ul>
      </div>
      <button class="w-full py-3 rounded-2xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 shadow-md">Kostenlos testen</button>
    </div>
    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-xl text-slate-900">Enterprise</h3>
        <p class="text-slate-500 text-sm mt-1">Für Agenturen & große Teams.</p>
        <div class="my-6"><span class="text-4xl font-black text-slate-900">€99</span><span class="text-slate-500 text-sm">/Monat</span></div>
        <ul class="text-sm text-slate-600 space-y-3 mb-8">
          <li class="flex items-center gap-2">✓ Alle Pro Funktionen</li>
          <li class="flex items-center gap-2">✓ Dedicated Support & SLA</li>
          <li class="flex items-center gap-2">✓ Outlook MSO Bulletproof Tools</li>
        </ul>
      </div>
      <button class="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm">Kontaktieren</button>
    </div>
  </div>
</section>`;
      } else if (query.includes('newsletter') || query.includes('form') || query.includes('kontakt')) {
        generatedHtml = `
<div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-10 rounded-3xl my-8 text-center max-w-3xl mx-auto shadow-2xl border border-indigo-900/50">
  <span class="text-2xl mb-2 block">📩</span>
  <h3 class="text-2xl font-extrabold mb-2">Abonniere unseren Tech-Newsletter</h3>
  <p class="text-slate-300 text-sm max-w-md mx-auto mb-6">Erhalte jeden Freitag exklusive HTML/CSS Snippets, Linter-Tricks und UI-Updates direkt in dein Postfach.</p>
  <form class="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onsubmit="event.preventDefault();">
    <input type="email" placeholder="deine.email@firma.de" class="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
    <button class="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all">Abonnieren</button>
  </form>
</div>`;
      } else {
        generatedHtml = `
<div class="p-8 bg-white rounded-3xl border border-slate-200 shadow-md my-6 flex flex-col md:flex-row items-center gap-6">
  <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-lg">✨</div>
  <div>
    <h3 class="text-xl font-bold text-slate-900">${aiPrompt}</h3>
    <p class="text-slate-600 text-sm mt-1">Automatisch generierter UI-Baustein mit responsivem Tailwind CSS und strukturiertem HTML-Layout.</p>
    <div class="mt-4 flex items-center gap-3">
      <button class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">Anpassen</button>
      <button class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all">Mehr Details</button>
    </div>
  </div>
</div>`;
      }

      handleInsertComponent(generatedHtml);
      setIsAiGenerating(false);
      setAiPrompt('');
      setRightTab('inspector');
    }, 600);
  };

  // Run Smart Linter on active file
  const handleRunLinter = () => {
    const reports: { type: string; message: string }[] = [];
    const html = activeFile.content;

    if (!html.toLowerCase().includes('<!doctype html>')) {
      reports.push({ type: 'warning', message: 'Fehlendes <!DOCTYPE html> Statement.' });
    }
    if (!html.toLowerCase().includes('<title>')) {
      reports.push({ type: 'error', message: 'Kein <title> Tag im <head> gefunden.' });
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const imgsWithoutAlt = doc.querySelectorAll('img:not([alt])');
    if (imgsWithoutAlt.length > 0) {
      reports.push({ type: 'warning', message: `${imgsWithoutAlt.length} Bilder ohne alt-Attribut gefunden (A11y Issue).` });
    }

    const emptyLinks = doc.querySelectorAll('a:empty');
    if (emptyLinks.length > 0) {
      reports.push({ type: 'info', message: `${emptyLinks.length} leere Link-Elemente gefunden.` });
    }

    setLinterReports(reports);
    setIsLinterOpen(true);
  };

  // Filtered computed styles list
  const filteredComputedEntries = Object.entries(computedStylesList).filter(([key, val]) => {
    if (!computedSearchFilter.trim()) return true;
    const term = computedSearchFilter.toLowerCase();
    return key.toLowerCase().includes(term) || val.toLowerCase().includes(term);
  });

  // Centralized Command Palette Items List
  const commandItems = [
    { id: 'template-storage', title: 'Templates & Mailings Archiv', category: 'Mailings & Anzeigen', description: 'Ganze Mailings (SAM, Liftletter, Heatup, Nachfass) & Anzeigen (Text, Bild, Redlink, Linktipp, NP) verwalten & laden', icon: <LayoutTemplate size={16} />, action: () => setIsTemplateStorageModalOpen(true) },
    { id: 'theme-palette', title: 'Theme Palette Generator (HSL)', category: 'Design Tokens', description: 'Harmonische HSL-Farbschemata basierend auf Hauptfarben generieren', icon: <Palette size={16} />, action: () => setIsThemePaletteModalOpen(true) },
    { id: 'dependency-graph', title: 'Dependency Graph & Orphan Analyzer', category: 'Project', description: 'Verknüpfungen & unbenutzte CSS-Variablen/Assets visualisieren', icon: <Network size={16} />, action: () => setIsDependencyGraphModalOpen(true) },
    { id: 'split-test', title: 'A/B Split-Test Simulator', category: 'Testing', description: 'Zwei Komponenten- oder Layout-Varianten A/B vergleichen', icon: <Split size={16} />, action: () => setIsSplitTestMode(!isSplitTestMode) },
    { id: 'doc-gen', title: 'README & Tech-Docs Generator', category: 'Project', description: 'Automatische Markdown Dokumentation basierend auf Komponentenbaum', icon: <BookOpen size={16} />, action: () => setIsDocGenModalOpen(true) },
    { id: 'layout-debugger', title: 'Layout Debugger & Grid Overlay', category: 'View', description: 'Baseline-Raster & Safe-Margin Zonen auf Canvas einblenden', icon: <LayoutGrid size={16} />, action: () => setIsLayoutDebuggerOpen(!isLayoutDebuggerOpen) },
    { id: 'version-history', title: 'Version History & Snapshots', category: 'Project', description: 'Projekt-Snapshots verwalten, erstellen & wiederherstellen', icon: <Clock size={16} />, action: () => setIsVersionHistoryModalOpen(true) },
    { id: 'templates', title: 'Starter Templates', category: 'Project', description: 'Vorgefertigte HTML5 & Tailwind Vorlagen laden', icon: <LayoutTemplate size={16} />, action: () => setIsTemplatesModalOpen(true) },
    { id: 'search', title: 'Suchen & Ersetzen', category: 'Editor', description: 'Projektweiten Search & Replace öffnen', icon: <Replace size={16} />, shortcut: 'Ctrl+Shift+F', action: () => setIsGlobalSearchOpen(true) },
    { id: 'multi-device', title: 'Multi-Device Preview Mode', category: 'View', description: 'Simultane Vorschau für Mobile, Tablet & Desktop', icon: <Smartphone size={16} />, action: () => setIsMultiDeviceView(!isMultiDeviceView) },
    { id: 'ai-code-review', title: 'AI Code Review & Performance Audit', category: 'Linter', description: 'HTML & CSS Performance & SEO Best-Practice Review', icon: <Bot size={16} />, action: () => setIsAiCodeReviewOpen(true) },
    { id: 'export', title: 'ZIP Export', category: 'Project', description: 'Projekt als ZIP-Archiv exportieren', icon: <FileArchive size={16} />, action: handleExportZipProject },
    { id: 'health', title: 'Code Health & Audit', category: 'Linter', description: 'Real-time Code Quality & A11y Audit', icon: <ShieldCheck size={16} />, action: () => setIsHealthModalOpen(true) },
    { id: 'preview', title: 'Preview Mode', category: 'View', description: 'Ablenkungsfreie Vorschau ohne Chrome', icon: <Eye size={16} />, action: () => setIsPreviewMode(true) },
    { id: 'split', title: 'Split Screen Mode', category: 'View', description: 'Visueller Canvas + Monaco Editor', icon: <SplitSquareHorizontal size={16} />, action: () => setViewMode('split') },
    { id: 'component-view', title: 'Component View', category: 'View', description: 'Isolierter Komponenten-Sandbox-Chamber', icon: <Box size={16} />, action: () => setViewMode('component') },
    { id: 'a11y-scan', title: 'A11y Audit Tab', category: 'Inspector', description: 'Barrierefreiheit Probleme scannen & reparieren', icon: <ShieldCheck size={16} />, action: () => setRightTab('a11y') },
    { id: 'css-vars', title: 'CSS Variables Tab', category: 'Inspector', description: 'Globale :root Variablen verwalten', icon: <Sliders size={16} />, action: () => setRightTab('cssvars') },
    { id: 'ai-inspector', title: 'AI Inspector', category: 'Inspector', description: 'Proaktive KI-Optimierungstipps für gewähltes Element', icon: <Bot size={16} />, action: () => setRightTab('ai-inspector') }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white overflow-hidden">
      
      {/* Top Header Navigation Bar */}
      <div className="h-14 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1A1A] px-4 flex items-center justify-between shrink-0 z-20">
        
        {/* Left: App Title & File Tabs */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <Layout size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none flex items-center gap-2">
              WYSIWYG Web Studio
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                PRO BUILDER
              </span>
            </h1>
            <span className="text-[11px] text-black/50 dark:text-white/50 font-mono">
              {activeFile.name}
            </span>
          </div>
        </div>

        {/* Center: Viewport Switcher & View Modes */}
        <div className="flex items-center gap-2">
          
          {/* Global Undo / Redo Buttons */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10 mr-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                undoStack.length > 0 ? 'hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Rückgängig (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                redoStack.length > 0 ? 'hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Wiederholen (Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'visual' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              title="Visueller Canvas Only"
            >
              <Eye size={14} /> Visual
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'split' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              title="Split Screen 50/50"
            >
              <SplitSquareHorizontal size={14} /> Split (50/50)
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'code' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              title="Monaco Code Editor Only"
            >
              <Code2 size={14} /> Code
            </button>
            <button
              onClick={() => setViewMode('component')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'component' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
              title="Isolierte Komponente Vorschau & Editor"
            >
              <Box size={14} /> Component View
            </button>
          </div>

          {/* Viewport Width (if Visual or Split) */}
          {viewMode !== 'code' && (
            <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
              <button
                onClick={() => setViewportWidth('desktop')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewportWidth === 'desktop' ? 'bg-blue-500 text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
                title="Desktop View (Full)"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewportWidth('tablet')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewportWidth === 'tablet' ? 'bg-blue-500 text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet size={14} />
              </button>
              <button
                onClick={() => setViewportWidth('mobile')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewportWidth === 'mobile' ? 'bg-blue-500 text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Cross-Tool Buttons & ZIP Export */}
        <div className="flex items-center gap-1.5">
          
          {/* Theme Palette Generator (HSL) */}
          <button
            onClick={() => setIsThemePaletteModalOpen(true)}
            className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all"
            title="Theme Palette Generator (HSL Farbschema-Analyse)"
          >
            <Palette size={16} />
          </button>

          {/* Dependency Graph & Orphan Analyzer */}
          <button
            onClick={() => setIsDependencyGraphModalOpen(true)}
            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all"
            title="Dependency Graph & Unused Asset Analyzer"
          >
            <Network size={16} />
          </button>

          {/* A/B Split-Test Simulator Toggle */}
          <button
            onClick={() => setIsSplitTestMode(!isSplitTestMode)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 border ${
              isSplitTestMode
                ? 'bg-emerald-600 text-white shadow-md border-emerald-500'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="A/B Split-Test Simulator Modus aktivieren/deaktivieren"
          >
            <Split size={14} /> Split-Test
          </button>

          {/* Technical Docs & README Generator */}
          <button
            onClick={() => setIsDocGenModalOpen(true)}
            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all"
            title="README & Technische Dokumentation generieren"
          >
            <BookOpen size={16} />
          </button>

          {/* Version History Button */}
          <button
            onClick={() => setIsVersionHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs border border-black/10 dark:border-white/10 transition-all flex items-center gap-1.5"
            title="Version History & Projekt-Snapshots"
          >
            <Clock size={14} className="text-amber-500" />
            <span className="hidden xl:inline">Versionen</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
              {versionSnapshots.length}
            </span>
          </button>

          {/* Template & Mailing Storage Tool Button */}
          <button
            onClick={() => setIsTemplateStorageModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
            title="Templates & Mailings Archiv (E-Mails, Anzeigen & SAM/Liftletter Storage)"
          >
            <LayoutTemplate size={14} />
            <span>Templates</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-white font-mono text-[10px] font-bold">
              {templatesStorage.length}
            </span>
          </button>

          {/* Multi-Device Preview Toggle */}
          <button
            onClick={() => setIsMultiDeviceView(!isMultiDeviceView)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
              isMultiDeviceView
                ? 'bg-blue-600 text-white shadow-md border-blue-500'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Multi-Device Simultane-Vorschau (Mobile + Tablet + Desktop)"
          >
            <Smartphone size={14} /> Multi-Dev
          </button>

          {/* Centralized Command Palette Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs border border-black/10 dark:border-white/10 transition-all flex items-center gap-1.5 text-black/80 dark:text-white/80"
            title="Zentrales Befehlsmenü öffnen (Ctrl+K)"
          >
            <Command size={14} className="text-blue-500" />
            <span className="hidden lg:inline">Command</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[9px]">Ctrl+K</kbd>
          </button>

          {/* Global Search & Replace Button */}
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-black/80 dark:text-white/80"
            title="Projektweit Suchen & Ersetzen (Ctrl+Shift+F)"
          >
            <Replace size={16} />
          </button>

          {/* Starter Templates Button */}
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20 transition-all flex items-center gap-1.5"
            title="Starter Templates durchsuchen"
          >
            <LayoutTemplate size={14} /> Templates
          </button>

          {/* Collaboration Test Mode Indicator / Toggle */}
          <button
            onClick={() => setForceTestMode(!forceTestMode)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 border ${
              isTestMode
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-600 dark:text-pink-300 animate-pulse'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/50 dark:text-white/50'
            }`}
            title="Simulierte Multi-User Kollaboration (?test=true)"
          >
            <Users size={14} /> {isTestMode ? 'Collab ON' : 'Collab'}
          </button>

          {/* Real-time Code Health Indicator */}
          <button
            onClick={() => setIsHealthModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
              healthAudit.score >= 90
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : healthAudit.score >= 70
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20'
            }`}
            title="Echtzeit Code Health & Barrierefreiheit Audit"
          >
            <ShieldCheck size={14} /> Health: {healthAudit.score}%
          </button>

          {/* Distraction-Free Preview Mode Toggle */}
          <button
            onClick={() => setIsPreviewMode(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Vorschau-Modus (Alle Editor-Chrome ausblenden)"
          >
            <Eye size={14} /> Preview
          </button>

          <button
            onClick={handleRunLinter}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold text-xs transition-all flex items-center gap-1.5"
            title="Smart Linter ausführen"
          >
            <TerminalSquare size={14} /> Linter
          </button>

          <button
            onClick={handleFixEncoding}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-all flex items-center gap-1.5"
            title="Umlaut- / Encoding-Fehler reparieren"
          >
            <Wand2 size={14} /> Fix Encoding
          </button>

          {/* Quick Insert Dropdown Menu */}
          <div className="relative inline-block text-left">
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                const selected = QUICK_INSERT_BOILERPLATES.find(b => b.id === e.target.value);
                if (selected) {
                  handleInsertQuickBoilerplate(selected.code, selected.name);
                }
                e.target.value = '';
              }}
              defaultValue=""
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 transition-all focus:outline-none cursor-pointer"
              title="Quick Insert: Vorlagenbausteine (Cards, Navbars, Forms) direkt in HTML einfügen"
            >
              <option value="" disabled>⚡ Quick Insert...</option>
              {QUICK_INSERT_BOILERPLATES.map(bp => (
                <option key={bp.id} value={bp.id} className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white font-medium">
                  {bp.category}: {bp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prettify Code Button */}
          <button
            onClick={handleBeautifyCode}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Prettify & HTML/CSS Code automatisch formatieren"
          >
            <Sparkles size={14} /> Prettify
          </button>

          <button
            onClick={handleExportZipProject}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Gesamtes Projekt als ZIP-Archiv exportieren"
          >
            <FileArchive size={14} /> ZIP Export
          </button>

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-xl text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
            title="Tastenkombinationen (Ctrl+/)"
          >
            <HelpCircle size={18} />
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-xl text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
            title="Einstellungen &amp; Nativ AI Ecosystem (Ctrl+,)"
          >
            <Settings size={18} />
          </button>

        </div>

      </div>

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 1. PROJECT FILE EXPLORER SIDEBAR */}
        <div className="w-60 border-r border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-md flex flex-col shrink-0">
          
          <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 flex items-center gap-1.5">
              <Folder size={14} /> Dateibaum
            </span>
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={zipUploadInputRef}
                accept=".zip,application/zip"
                onChange={handleUploadZipLp}
                className="hidden"
              />
              <button
                onClick={() => zipUploadInputRef.current?.click()}
                disabled={zipImportLoading}
                className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-all"
                title="ZIP LP hochladen & Dateibaum entpacken"
              >
                <UploadCloud size={14} />
                <span className="hidden sm:inline">ZIP</span>
              </button>
              <button
                onClick={() => setIsZipTreeModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-purple-500"
                title="ZIP Tree Inspector & Fakepaths"
              >
                <Network size={14} />
              </button>
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-blue-500"
                title="Neue Datei anlegen"
              >
                <FilePlus size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
            {zipImportLoading && (
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                <span>Entpacke ZIP LP Dateibaum...</span>
              </div>
            )}

            {/* Tree Folder Grouping */}
            {(() => {
              const folderGroups: { [folder: string]: ProjectFile[] } = {};
              files.forEach((f) => {
                const folderKey = f.folder || 'root';
                if (!folderGroups[folderKey]) folderGroups[folderKey] = [];
                folderGroups[folderKey].push(f);
              });

              return Object.entries(folderGroups).map(([folderName, folderFiles]) => {
                const isExpanded = expandedFolders.has(folderName);
                return (
                  <div key={folderName} className="flex flex-col gap-0.5">
                    {/* Folder Header */}
                    <button
                      onClick={() => toggleFolderExpand(folderName)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-black/70 dark:text-white/70 transition-all text-left"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isExpanded ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} className="opacity-50" />}
                        {isExpanded ? <FolderOpen size={14} className="text-amber-500" /> : <Folder size={14} className="text-amber-500" />}
                        <span className="truncate">{folderName === 'root' ? 'project-root/' : `${folderName}/`}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/5 text-[9px] font-mono text-black/50 dark:text-white/50">
                        {folderFiles.length}
                      </span>
                    </button>

                    {/* Files List in Folder */}
                    {isExpanded && (
                      <div className="pl-3 flex flex-col gap-0.5 border-l border-black/10 dark:border-white/10 ml-2">
                        {folderFiles.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            title={file.fakePath ? `Fake Path: ${file.fakePath}` : file.name}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all text-left group ${
                              activeFileId === file.id
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30 shadow-sm'
                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <FileCode
                                size={14}
                                className={
                                  file.type === 'html'
                                    ? 'text-amber-500 shrink-0'
                                    : file.type === 'css'
                                    ? 'text-blue-500 shrink-0'
                                    : file.type === 'js'
                                    ? 'text-yellow-500 shrink-0'
                                    : 'text-purple-500 shrink-0'
                                }
                              />
                              <div className="truncate min-w-0">
                                <div className="truncate leading-tight">{file.name}</div>
                                {file.fakePath && (
                                  <div className="text-[9px] text-black/40 dark:text-white/40 truncate font-mono">
                                    {file.fakePath}
                                  </div>
                                )}
                              </div>
                            </div>
                            {file.size && (
                              <span className="text-[9px] font-mono opacity-50 shrink-0">
                                {formatBytes(file.size)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Quick Info Box with ZIP Info & Fake Path status */}
          <div className="p-3 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[11px] text-black/60 dark:text-white/60 space-y-1">
            <div className="flex items-center justify-between font-bold text-black dark:text-white">
              <span>Baum &amp; Fakepaths</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">{files.length} Dateien</span>
            </div>
            <p className="leading-tight text-[10px] text-black/50 dark:text-white/50">
              {zipProjectName ? `Inhalte aus "${zipProjectName}"` : 'Virtuelles Dateisystem mit Server-Fakepaths active.'}
            </p>
          </div>

        </div>

        {/* 2. MAIN WORKSPACE (SPLIT OR VISUAL OR CODE) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* VISUAL CANVAS (If mode is 'visual' or 'split') */}
          {(viewMode === 'visual' || viewMode === 'split') && (
            <div className={`flex-1 flex flex-col bg-slate-200 dark:bg-slate-900 overflow-hidden relative ${viewMode === 'split' ? 'border-r border-black/10 dark:border-white/10' : ''}`}>
              
              {/* Responsive Breakpoints Toolbar Header */}
              <div className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-3 py-1.5 flex flex-wrap items-center justify-between text-xs gap-2 shrink-0">
                
                {/* Breakpoint Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 mr-1 hidden md:inline">Breakpoints:</span>
                  <button
                    onClick={() => { setViewportWidth('mobile-sm'); setCustomViewportPx(320); }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      viewportWidth === 'mobile-sm' ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Mobile Small (320px)"
                  >
                    <Smartphone size={12} /> 320px
                  </button>

                  <button
                    onClick={() => { setViewportWidth('mobile'); setCustomViewportPx(375); }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      viewportWidth === 'mobile' ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone size={12} /> 375px
                  </button>

                  <button
                    onClick={() => { setViewportWidth('tablet'); setCustomViewportPx(768); }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      viewportWidth === 'tablet' ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet size={12} /> 768px
                  </button>

                  <button
                    onClick={() => { setViewportWidth('custom'); setCustomViewportPx(1024); }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      viewportWidth === 'custom' && customViewportPx === 1024 ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Laptop (1024px)"
                  >
                    <Monitor size={12} /> 1024px
                  </button>

                  <button
                    onClick={() => { setViewportWidth('desktop'); setCustomViewportPx(1280); }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      viewportWidth === 'desktop' ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Desktop Wide (100%)"
                  >
                    <Monitor size={12} /> Full 100%
                  </button>
                </div>

                {/* Custom Pixel Input & Slider */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10">
                    <span className="text-[10px] font-mono text-black/50 dark:text-white/50">Breite:</span>
                    <input
                      type="number"
                      min={280}
                      max={1920}
                      value={customViewportPx}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1024;
                        setCustomViewportPx(val);
                        setViewportWidth('custom');
                      }}
                      className="w-14 bg-transparent text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-black/50 dark:text-white/50">px</span>
                  </div>

                  <input
                    type="range"
                    min={320}
                    max={1440}
                    value={customViewportPx}
                    onChange={(e) => {
                      setCustomViewportPx(parseInt(e.target.value, 10));
                      setViewportWidth('custom');
                    }}
                    className="w-20 sm:w-28 accent-blue-600 cursor-pointer"
                  />

                  {/* Insert Media Query Button */}
                  <button
                    onClick={() => handleInsertMediaRule(customViewportPx)}
                    className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 border border-blue-500/20 transition-all"
                    title="Erstelle eine @media query Regel für diesen Breakpoint"
                  >
                    + @media ({customViewportPx}px)
                  </button>
                  {/* Grid Snap, Smart Guides & Layout Debugger Toggles */}
                  <div className="flex items-center gap-1.5 border-l border-black/10 dark:border-white/10 pl-2 ml-1">
                    <button
                      onClick={() => setIsSnapToGrid(!isSnapToGrid)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isSnapToGrid ? 'bg-indigo-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                      }`}
                      title="Raster-Anpassung (Snap to Grid) für präzise Element-Ausrichtung"
                    >
                      <Grid3X3 size={12} /> {isSnapToGrid ? `${gridSizePx}px Grid` : 'Grid Snap'}
                    </button>

                    <button
                      onClick={() => setShowSmartGuides(!showSmartGuides)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        showSmartGuides ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                      }`}
                      title="Intelligente Ausrichtungslinien (Smart Guides)"
                    >
                      <Ruler size={12} /> Smart Guides
                    </button>

                    <button
                      onClick={() => setIsLayoutDebuggerOpen(!isLayoutDebuggerOpen)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isLayoutDebuggerOpen ? 'bg-purple-600 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                      }`}
                      title="Layout Debugger & Baseline Grid Overlay (8px/16px Baseline & Safe Margins)"
                    >
                      <LayoutGrid size={12} /> Layout Debugger
                    </button>
                  </div>
                </div>

              </div>

              {/* Iframe Viewport Container (Single or Multi-Device) */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto custom-scrollbar">
                
                {isMultiDeviceView ? (
                  /* MULTI-DEVICE SIMULTANEOUS PREVIEW MODE */
                  <div className="w-full h-full flex items-center justify-center gap-6 overflow-x-auto p-2">
                    
                    {/* Mobile Screen (375px) */}
                    <div className="w-[360px] h-[640px] bg-slate-900 rounded-[32px] p-3 shadow-2xl flex flex-col shrink-0 border-4 border-slate-700 relative">
                      <div className="h-5 bg-black rounded-t-2xl flex items-center justify-center mb-1">
                        <div className="w-16 h-3 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 rounded-xl overflow-hidden bg-white">
                        <iframe
                          title="Mobile Preview"
                          srcDoc={getIframeDocSrc(activeFile.content)}
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="mt-2 text-center font-mono text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                        <Smartphone size={10} /> Mobile (375px)
                      </div>
                    </div>

                    {/* Tablet Screen (768px) */}
                    <div className="w-[520px] h-[640px] bg-slate-900 rounded-[28px] p-3 shadow-2xl flex flex-col shrink-0 border-4 border-slate-700 relative">
                      <div className="h-4 bg-black rounded-t-xl flex items-center justify-center mb-1">
                        <div className="w-10 h-2 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 rounded-xl overflow-hidden bg-white">
                        <iframe
                          title="Tablet Preview"
                          srcDoc={getIframeDocSrc(activeFile.content)}
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="mt-2 text-center font-mono text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                        <Tablet size={10} /> Tablet (768px)
                      </div>
                    </div>

                    {/* Desktop Screen (Flexible) */}
                    <div className="flex-1 min-w-[600px] h-[640px] bg-slate-900 rounded-[24px] p-3 shadow-2xl flex flex-col border-4 border-slate-700 relative">
                      <div className="h-4 bg-black rounded-t-xl flex items-center justify-center mb-1">
                        <div className="w-12 h-2 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 rounded-xl overflow-hidden bg-white">
                        <iframe
                          title="Desktop Preview"
                          srcDoc={getIframeDocSrc(activeFile.content)}
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="mt-2 text-center font-mono text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                        <Monitor size={10} /> Desktop (Fluid 100%)
                      </div>
                    </div>

                  </div>
                ) : (
                  /* SINGLE DEVICE VIEWPORT WITH OPTIONAL GRID, SMART GUIDES & LAYOUT DEBUGGER OVERLAY */
                  <div 
                    style={{
                      width: viewportWidth === 'desktop' ? '100%' : viewportWidth === 'tablet' ? '768px' : viewportWidth === 'mobile' ? '375px' : viewportWidth === 'mobile-sm' ? '320px' : `${customViewportPx}px`,
                      maxWidth: viewportWidth === 'desktop' ? '1280px' : undefined
                    }}
                    className={`h-full bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300 relative border border-black/10 dark:border-white/10 flex flex-col ${
                      isSnapToGrid ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]' : ''
                    }`}
                  >
                    {/* Split-Test Simulator Header Bar */}
                    {isSplitTestMode && (
                      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0 z-30 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Split size={14} className="text-emerald-400" />
                          <span className="font-bold">A/B Split-Test Simulator Mode</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            Aktiv
                          </span>
                        </div>

                        {/* Variant Selector */}
                        <div className="flex items-center gap-2">
                          <div className="bg-black/40 p-0.5 rounded-lg border border-white/10 flex items-center">
                            <button
                              onClick={() => setSplitTestVariant('A')}
                              className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                                splitTestVariant === 'A' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Variante A (Original)
                            </button>
                            <button
                              onClick={() => {
                                if (!variantBContent) {
                                  setVariantBContent(
                                    activeFile.content
                                      .replace(/bg-blue-600/g, 'bg-emerald-600')
                                      .replace(/Kostenlos testen/g, 'Jetzt 14 Tage gratis starten')
                                  );
                                }
                                setSplitTestVariant('B');
                              }}
                              className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                                splitTestVariant === 'B' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Variante B (Optimiert)
                            </button>
                          </div>

                          {splitTestVariant === 'B' && (
                            <button
                              onClick={() => {
                                if (confirm('Möchtest du Variante B als neuen Standard für dieses Projekt übernehmen?')) {
                                  updateFileContent(variantBContent || activeFile.content, true);
                                  setIsSplitTestMode(false);
                                  alert('Variante B erfolgreich als Hauptcode übernommen!');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-all"
                            >
                              ✓ Variante B übernehmen
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Main Iframe Canvas */}
                    <div className="flex-1 relative">
                      <iframe
                        ref={iframeRef}
                        title="Visual Canvas"
                        srcDoc={getIframeDocSrc(
                          isSplitTestMode && splitTestVariant === 'B'
                            ? (variantBContent || activeFile.content)
                            : activeFile.content
                        )}
                        className="w-full h-full border-0 relative z-10"
                      />

                      {/* Layout Debugger & Baseline Grid Overlay */}
                      {isLayoutDebuggerOpen && (
                        <div 
                          className="absolute inset-0 pointer-events-none z-20"
                          style={{
                            backgroundImage: `
                              linear-gradient(to right, rgba(147, 51, 234, 0.15) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(147, 51, 234, 0.15) 1px, transparent 1px)
                            `,
                            backgroundSize: `${layoutDebuggerGridPx * 2}px ${layoutDebuggerGridPx * 2}px`
                          }}
                        >
                          {/* Safe Margin Zone Borders (24px padding inset) */}
                          <div className="absolute inset-6 border-2 border-dashed border-purple-500/50 rounded-lg pointer-events-none">
                            <div className="absolute top-1 left-2 px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold">
                              Safe Margin Zone (24px) &bull; Baseline {layoutDebuggerGridPx}px Grid
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Smart Alignment Guides Overlay */}
                      {showSmartGuides && selectedPath && (
                        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                          <div className="w-full h-0.5 bg-blue-500/60 absolute top-1/2 left-0 border-b border-dashed border-blue-400"></div>
                          <div className="h-full w-0.5 bg-blue-500/60 absolute left-1/2 top-0 border-r border-dashed border-blue-400"></div>
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[9px] font-bold shadow-md">
                            Smart Alignment Active &bull; {selectedPath}
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Simulated Remote User Cursors (Test & Collaboration Mode) */}
                  {isTestMode && (
                    <>
                      {/* Live Collaboration Banner */}
                      <div className="absolute top-2 left-2 z-30 px-3 py-1 rounded-full bg-slate-900/90 text-white border border-white/20 text-[10px] font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                        <span>Live Kollaboration &bull; 2 verbundene Entwickler</span>
                      </div>

                      {/* Remote Cursor 1 */}
                      <div
                        style={{
                          transform: `translate(${remoteCursor1.x}px, ${remoteCursor1.y}px)`,
                          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                        className="absolute top-0 left-0 z-30 pointer-events-none flex flex-col items-start"
                      >
                        <MousePointer size={18} className="text-pink-500 fill-pink-500 drop-shadow-md" />
                        <div className="ml-3 mt-0.5 px-2 py-0.5 rounded-md bg-pink-600 text-white font-bold text-[9px] shadow-lg whitespace-nowrap flex items-center gap-1">
                          <span>{remoteCursor1.name}</span>
                          <span className="opacity-75 font-mono text-[8px]">({remoteCursor1.action})</span>
                        </div>
                      </div>

                      {/* Remote Cursor 2 */}
                      <div
                        style={{
                          transform: `translate(${remoteCursor2.x}px, ${remoteCursor2.y}px)`,
                          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                        className="absolute top-0 left-0 z-30 pointer-events-none flex flex-col items-start"
                      >
                        <MousePointer size={18} className="text-emerald-500 fill-emerald-500 drop-shadow-md" />
                        <div className="ml-3 mt-0.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[9px] shadow-lg whitespace-nowrap flex items-center gap-1">
                          <span>{remoteCursor2.name}</span>
                          <span className="opacity-75 font-mono text-[8px]">({remoteCursor2.action})</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>

              {/* Dynamic Status Bar (Lines, Chars, Words, Size & Quick Prettify) */}
              <div className="h-8 bg-[#18181B] border-t border-white/10 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0">
                <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-1">
                  <span className="flex items-center gap-1.5 text-blue-400 font-bold shrink-0">
                    <FileCode size={13} /> {activeFile.name}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="shrink-0">Zeilen: <strong className="text-white font-bold">{activeFile.content.split('\n').length.toLocaleString()}</strong></span>
                  <span className="shrink-0">Zeichen: <strong className="text-white font-bold">{activeFile.content.length.toLocaleString()}</strong></span>
                  <span className="shrink-0">Wörter: <strong className="text-white font-bold">{activeFile.content.trim().split(/\s+/).filter(Boolean).length.toLocaleString()}</strong></span>
                  <span className="shrink-0">Größe: <strong className="text-amber-300 font-bold">{(new Blob([activeFile.content]).size / 1024).toFixed(1)} KB</strong></span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBeautifyCode}
                    className="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[10px] flex items-center gap-1 border border-blue-500/30 transition-all active:scale-95"
                    title="Code automatisch formatieren"
                  >
                    <Sparkles size={11} /> Prettify
                  </button>

                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px] pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ecosystem Live
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* COMPONENT VIEW MODE (Isolated Sandbox Chamber) */}
          {viewMode === 'component' && (
            <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden relative">
              
              {/* Top Sandbox Header Bar */}
              <div className="h-11 bg-slate-900 border-b border-white/10 px-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Box size={16} className="text-purple-400" />
                  <span className="font-extrabold text-sm">Isolierter Komponent-Editor</span>
                  <input
                    type="text"
                    value={isolatedTitle}
                    onChange={(e) => setIsolatedTitle(e.target.value)}
                    className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Komponenten Name..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] text-slate-400 font-mono">Zoom:</span>
                    <button onClick={() => setIsolatedZoom(Math.max(50, isolatedZoom - 25))} className="px-1.5 font-bold hover:text-purple-400">&minus;</button>
                    <span className="text-xs font-bold font-mono text-purple-400">{isolatedZoom}%</span>
                    <button onClick={() => setIsolatedZoom(Math.min(200, isolatedZoom + 25))} className="px-1.5 font-bold hover:text-purple-400">+</button>
                  </div>

                  <button
                    onClick={() => {
                      handleInsertComponent(isolatedSnippet);
                      setViewMode('split');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Sparkles size={14} /> In Haupt-Canvas einfügen
                  </button>
                </div>
              </div>

              {/* Main Component View Split: Isolated Stage vs Snippet Editor */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Isolated Preview Stage with Checkerboard */}
                <div className="flex-1 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900 p-8 flex items-center justify-center overflow-auto relative">
                  <div 
                    style={{ transform: `scale(${isolatedZoom / 100})` }}
                    className="transition-transform duration-200"
                    dangerouslySetInnerHTML={{ __html: isolatedSnippet }}
                  />
                </div>

                {/* Right: Live HTML/Tailwind Snippet Editor */}
                <div className="w-96 border-l border-white/10 bg-[#18181B] flex flex-col">
                  <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-purple-400">
                      <Code2 size={14} /> HTML &amp; Tailwind Code
                    </span>
                    <button
                      onClick={() => {
                        const title = prompt('Name für Component Storage:', isolatedTitle);
                        if (!title) return;
                        const existingSnippets: CodeSnippet[] = JSON.parse(localStorage.getItem('yes-component-storage-snippets') || '[]');
                        const newSnippet: CodeSnippet = {
                          id: `isolated-${Date.now()}`,
                          title,
                          category: 'Isolated',
                          tags: ['component-view', 'wysiwyg'],
                          code: isolatedSnippet,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
                        localStorage.setItem('yes-component-storage-snippets', JSON.stringify([newSnippet, ...existingSnippets]));
                        alert(`Komponente "${title}" in Storage gespeichert!`);
                      }}
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Save size={12} /> Speichern
                    </button>
                  </div>

                  <div className="flex-1 p-2">
                    <textarea
                      value={isolatedSnippet}
                      onChange={(e) => setIsolatedSnippet(e.target.value)}
                      className="w-full h-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 custom-scrollbar resize-none"
                      placeholder="HTML & Tailwind CSS Klassen..."
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* MONACO CODE EDITOR (If mode is 'code' or 'split') */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col bg-[#1E1E1E] overflow-hidden">
              
              {/* Editor Bar */}
              <div className="h-10 bg-[#252526] px-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-200 font-bold flex items-center gap-2">
                    <Code2 size={14} className="text-blue-400" /> {activeFile.name}
                  </span>

                  {/* Syntax Highlighting Theme Selector */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                    <Palette size={12} className="text-amber-400" />
                    <select
                      value={editorTheme}
                      onChange={(e) => setEditorTheme(e.target.value)}
                      className="bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none cursor-pointer"
                      title="Syntax Highlighting Theme wählen"
                    >
                      <option value="vs-dark" className="bg-[#1E1E1E] text-white">🌙 VS Dark</option>
                      <option value="vs" className="bg-[#1E1E1E] text-white">☀️ VS Light</option>
                      <option value="hc-black" className="bg-[#1E1E1E] text-white">⬛ High Contrast Dark</option>
                      <option value="hc-light" className="bg-[#1E1E1E] text-white">⬜ High Contrast Light</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save & Create Snapshot Button */}
                  <button
                    onClick={() => {
                      handleCreateVersionSnapshot(
                        `Save: ${activeFile.name}`,
                        `Manuell gespeicherter Stand um ${new Date().toLocaleTimeString('de-DE')}`
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center gap-1 border border-amber-500/30 transition-all"
                    title="Aktuellen Stand speichern & Snapshot erstellen (Ctrl+S)"
                  >
                    <Save size={12} /> Speichern &amp; Snapshot
                  </button>

                  {/* Export Code Snippet Image Button */}
                  <button
                    onClick={handleExportCodeSnippetImage}
                    disabled={isExportingImage}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 transition-all"
                    title="Code als gestaltetes Snippet-Bild exportieren (html2canvas)"
                  >
                    <ImageIcon size={12} /> {isExportingImage ? 'Exportiere...' : 'Snippet als Bild'}
                  </button>

                  {/* Keyboard Shortcuts Button */}
                  <button
                    onClick={() => setIsShortcutsOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] flex items-center gap-1 border border-white/10 transition-all"
                    title="Tastenkombinationen anzeigen (Ctrl+/)"
                  >
                    <Command size={12} /> Shortcuts
                  </button>

                  <button
                    onClick={() => setIsAiCodeReviewOpen(!isAiCodeReviewOpen)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                      isAiCodeReviewOpen
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white/5 border-white/10 text-purple-400 hover:bg-white/10'
                    }`}
                    title="KI-gestütztes Code Review & Performance Audit"
                  >
                    <Bot size={12} /> Review ({aiCodeReview.score}%)
                  </button>

                  {/* Quick Insert Dropdown Menu */}
                  <div className="relative group">
                    <button
                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-[11px] flex items-center gap-1.5 border border-purple-500/30 transition-all"
                      title="Smarte HTML-Bausteine sofort einfügen"
                    >
                      <PlusCircle size={12} className="text-purple-400" />
                      <span>Quick Insert</span>
                      <ChevronDown size={12} className="text-purple-400 opacity-70" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-72 bg-[#252526] border border-white/15 rounded-2xl shadow-2xl p-2 hidden group-hover:flex flex-col gap-1 z-50">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                        <span>Schnellbausteine</span>
                        <span className="text-[9px] text-purple-400">HTML Snippets</span>
                      </div>
                      {QUICK_INSERT_BOILERPLATES.map(b => (
                        <button
                          key={b.id}
                          onClick={() => handleInsertQuickBoilerplate(b.code, b.name)}
                          className="w-full text-left p-2 rounded-xl hover:bg-purple-600/30 text-slate-200 hover:text-white text-xs font-sans transition-all flex flex-col gap-0.5 border border-transparent hover:border-purple-500/40"
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span>{b.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-purple-300">{b.category}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{b.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBeautifyCode}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 transition-all"
                    title="Code automatisch formatieren"
                  >
                    <Sparkles size={12} /> Formatieren
                  </button>
                </div>
              </div>

              {/* Monaco Editor Instance */}
              <div 
                onContextMenu={handleEditorContextMenu}
                className="flex-1 overflow-hidden relative flex flex-col"
              >
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={activeFile.type === 'html' ? 'html' : activeFile.type === 'css' ? 'css' : 'javascript'}
                    value={activeFile.content}
                    onMount={(editor) => {
                      editorInstanceRef.current = editor;
                    }}
                    onChange={(val) => {
                      if (val !== undefined) {
                        updateFileContent(val, true);
                      }
                    }}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: 'on',
                      automaticLayout: true,
                      tabSize: 2,
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>

                {/* AI Context Menu Popup Overlay */}
                {editorContextMenu && (
                  <div
                    style={{
                      top: Math.min(window.innerHeight - 280, editorContextMenu.y),
                      left: Math.min(window.innerWidth - 260, editorContextMenu.x)
                    }}
                    className="fixed z-[100] w-64 bg-[#18181C] text-slate-200 border border-purple-500/40 rounded-2xl shadow-2xl p-2 font-sans text-xs space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="font-bold text-white text-[11px]">KI Schnell-Aktionen</span>
                      </div>
                      <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                        OpenRouter
                      </span>
                    </div>

                    {isContextAiLoading ? (
                      <div className="p-4 text-center space-y-2">
                        <Sparkles size={18} className="text-purple-400 animate-spin mx-auto" />
                        <p className="text-[11px] font-medium text-slate-300">
                          KI generiert Transformation...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5 py-1">
                        <button
                          onClick={() => handleExecuteAiQuickAction('refactor')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all flex items-center gap-2.5 font-medium"
                        >
                          <Wand2 size={14} className="text-purple-400" />
                          <span>Refactor selected block</span>
                        </button>

                        <button
                          onClick={() => handleExecuteAiQuickAction('component')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all flex items-center gap-2.5 font-medium"
                        >
                          <Layers size={14} className="text-indigo-400" />
                          <span>Convert to component</span>
                        </button>

                        <button
                          onClick={() => handleExecuteAiQuickAction('tailwind')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all flex items-center gap-2.5 font-medium"
                        >
                          <Sparkles size={14} className="text-emerald-400" />
                          <span>Optimize Tailwind Classes</span>
                        </button>

                        <button
                          onClick={() => handleExecuteAiQuickAction('mso')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all flex items-center gap-2.5 font-medium"
                        >
                          <Code2 size={14} className="text-blue-400" />
                          <span>Convert to MSO Email HTML</span>
                        </button>

                        <button
                          onClick={() => handleExecuteAiQuickAction('explain')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all flex items-center gap-2.5 font-medium border-t border-white/10 mt-1 pt-2"
                        >
                          <Bot size={14} className="text-amber-400" />
                          <span>Explain Code Block</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Code Review Drawer Panel */}
                {isAiCodeReviewOpen && (
                  <div className="h-64 bg-[#18181B] border-t border-purple-500/30 p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot size={18} className="text-purple-400" />
                        <h4 className="font-extrabold text-xs text-white">KI Code Review &amp; SEO Performance Report</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          aiCodeReview.score >= 85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          Score: {aiCodeReview.score} / 100
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAutoFixAiCodeReview}
                          className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Wand2 size={12} /> 1-Klick Auto-Fix
                        </button>
                        <button
                          onClick={() => setIsAiCodeReviewOpen(false)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Issues List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                      {aiCodeReview.issues.length === 0 ? (
                        <div className="col-span-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-400 font-bold">
                          ✨ Hervorragend! Keine KI Performance- oder SEO-Probleme im Code gefunden.
                        </div>
                      ) : (
                        aiCodeReview.issues.map(iss => (
                          <div key={iss.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                iss.category === 'performance' ? 'bg-blue-500/20 text-blue-400' :
                                iss.category === 'seo' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {iss.category} &bull; {iss.severity}
                              </span>
                              {iss.autoFixable && (
                                <span className="text-[9px] text-emerald-400 font-bold">✓ Auto-Fixbar</span>
                              )}
                            </div>
                            <h5 className="font-bold text-slate-200 text-xs">{iss.title}</h5>
                            <p className="text-[11px] text-slate-400">{iss.description}</p>
                            <p className="text-[10px] text-purple-300 italic font-sans">Empfehlung: {iss.recommendation}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* 3. RIGHT PANEL: DRAGGABLE COMPONENT LIBRARY, CONTEXTUAL INSPECTOR, COMPUTED STYLES & AI GENERATOR */}
        <div className="w-80 border-l border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1A1A] flex flex-col shrink-0">
          
          {/* Tabs Navigation Bar */}
          <div className="p-1.5 border-b border-black/10 dark:border-white/10 flex items-center gap-1 bg-black/5 dark:bg-white/5 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => {
                setRightTab('inspector');
                if (!selectedPath) setSelectedPath('body');
              }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center shrink-0 ${
                rightTab === 'inspector' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Inspector
            </button>

            <button
              onClick={() => setRightTab('ai-inspector')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'ai-inspector' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Bot size={11} /> AI Inspector
            </button>

            <button
              onClick={() => setRightTab('a11y')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'a11y' ? 'bg-emerald-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <ShieldCheck size={11} /> A11y ({a11yAudit.issues.length})
            </button>

            <button
              onClick={() => setRightTab('cssvars')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'cssvars' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sliders size={11} /> :root
            </button>

            <button
              onClick={() => setRightTab('seo')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'seo' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Globe size={11} /> SEO
            </button>

            <button
              onClick={() => setRightTab('animation')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'animation' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Film size={11} /> Anim
            </button>

            <button
              onClick={() => setRightTab('assets')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center gap-1 shrink-0 ${
                rightTab === 'assets' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <ImageLucide size={11} /> Assets
            </button>

            <button
              onClick={() => setRightTab('computed')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center shrink-0 ${
                rightTab === 'computed' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Computed
            </button>

            <button
              onClick={() => setRightTab('library')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center shrink-0 ${
                rightTab === 'library' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Bib
            </button>

            <button
              onClick={() => setRightTab('ai')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 shrink-0 ${
                rightTab === 'ai' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Bot size={11} /> AI
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">

            {/* TAB 1: CONTEXTUAL INSPECTOR PANEL */}
            {rightTab === 'inspector' && (
              selectedPath ? (
                <div className="flex flex-col gap-5">
                  
                  {/* Selected Element Title */}
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">Ausgewähltes Element</span>
                      <h4 className="font-extrabold text-sm text-black dark:text-white font-mono uppercase">
                        &lt;{selectedTag || 'div'}&gt;
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedPath(null)}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Quick Manipulate Actions */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Aktionen:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => sendCommandToIframe('DUPLICATE')}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Copy size={14} /> Duplizieren
                      </button>
                      <button
                        onClick={() => sendCommandToIframe('DELETE')}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={14} /> Löschen
                      </button>
                      <button
                        onClick={() => sendCommandToIframe('MOVE_UP')}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <ArrowUp size={14} /> Nach oben
                      </button>
                      <button
                        onClick={() => sendCommandToIframe('MOVE_DOWN')}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <ArrowDown size={14} /> Nach unten
                      </button>
                    </div>

                    <button
                      onClick={handleSaveSelectedToStorage}
                      className="mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                    >
                      <Save size={14} /> In Component Storage speichern
                    </button>
                  </div>

                  {/* CSS / Tailwind Classes Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">CSS / Tailwind Klassen:</label>
                    <textarea
                      rows={3}
                      value={selectedClasses}
                      onChange={(e) => {
                        setSelectedClasses(e.target.value);
                        sendCommandToIframe('UPDATE_CLASSES', { classes: e.target.value });
                      }}
                      placeholder="bg-blue-600 text-white p-4 rounded-xl..."
                      className="w-full p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Textinhalt:</label>
                    <input
                      type="text"
                      value={selectedTextContent}
                      onChange={(e) => {
                        setSelectedTextContent(e.target.value);
                        sendCommandToIframe('UPDATE_TEXT', { text: e.target.value });
                      }}
                      placeholder="Text des Elements..."
                      className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Spacing & Layout Sliders */}
                  <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                    <span className="text-xs font-bold text-black/80 dark:text-white/80 flex items-center gap-1">
                      <Box size={14} /> Innenabstand (Padding px):
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-black/60 dark:text-white/60 block">Oben / Unten:</span>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={selectedStyles.paddingTop}
                          onChange={(e) => {
                            const val = `${e.target.value}px`;
                            sendCommandToIframe('UPDATE_STYLE', { property: 'paddingTop', value: val });
                            sendCommandToIframe('UPDATE_STYLE', { property: 'paddingBottom', value: val });
                          }}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-black/60 dark:text-white/60 block">Links / Rechts:</span>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={selectedStyles.paddingLeft}
                          onChange={(e) => {
                            const val = `${e.target.value}px`;
                            sendCommandToIframe('UPDATE_STYLE', { property: 'paddingLeft', value: val });
                            sendCommandToIframe('UPDATE_STYLE', { property: 'paddingRight', value: val });
                          }}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Pickers */}
                  <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                    <span className="text-xs font-bold text-black/80 dark:text-white/80 flex items-center gap-1">
                      <Palette size={14} /> Farben &amp; Abrundung:
                    </span>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-black/70 dark:text-white/70">Hintergrund:</span>
                        <input
                          type="color"
                          onChange={(e) => sendCommandToIframe('UPDATE_STYLE', { property: 'backgroundColor', value: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer p-0.5"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-black/70 dark:text-white/70">Textfarbe:</span>
                        <input
                          type="color"
                          onChange={(e) => sendCommandToIframe('UPDATE_STYLE', { property: 'color', value: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-black/50 dark:text-white/50 gap-3">
                  <MousePointer size={32} className="text-blue-500" />
                  <p className="text-xs font-semibold">Klicke auf ein beliebiges Element im Canvas, um Eigenschaften anzupassen.</p>
                </div>
              )
            )}

            {/* TAB: SEO META EDITOR PANEL */}
            {rightTab === 'seo' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" /> SEO &amp; Open Graph Editor
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Definiere Meta-Titel, Suchmaschinen-Beschreibung, Favicon &amp; Social Media Vorschaubilder.
                  </p>
                </div>

                {/* Google SERP Snippet Live Preview */}
                <div className="p-3 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl shadow-sm flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-black/40 dark:text-white/40 block">Google Suche Live-Vorschau</span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    <span>https://deine-website.de</span> &rsaquo; <span>page</span>
                  </div>
                  <h4 className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline cursor-pointer truncate">
                    {seoData.title || 'Seitentitel hier eingeben...'}
                  </h4>
                  <p className="text-xs text-black/70 dark:text-white/70 line-clamp-2">
                    {seoData.description || 'Füge eine ansprechende Meta-Beschreibung hinzu, um die Klickrate in Suchmaschinen zu steigern.'}
                  </p>
                </div>

                {/* SEO Inputs */}
                <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                  <div>
                    <label className="text-xs font-bold text-black/80 dark:text-white/80 block mb-1">Page Title (&lt;title&gt;):</label>
                    <input
                      type="text"
                      value={seoData.title}
                      onChange={(e) => handleSaveSeo({ ...seoData, title: e.target.value })}
                      placeholder="z.B. Meine Agentur | Professionelles Webdesign"
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-black/80 dark:text-white/80 block mb-1">Meta Description:</label>
                    <textarea
                      rows={3}
                      value={seoData.description}
                      onChange={(e) => handleSaveSeo({ ...seoData, description: e.target.value })}
                      placeholder="Ansprechende Zusammenfassung für Google..."
                      className="w-full p-2.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-black/80 dark:text-white/80 block mb-1">Open Graph Image URL (Social Share):</label>
                    <input
                      type="text"
                      value={seoData.ogImage}
                      onChange={(e) => handleSaveSeo({ ...seoData, ogImage: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-black/80 dark:text-white/80 block mb-1">Favicon URL (&lt;link rel="icon"&gt;):</label>
                    <input
                      type="text"
                      value={seoData.favicon}
                      onChange={(e) => handleSaveSeo({ ...seoData, favicon: e.target.value })}
                      placeholder="https://deine-website.de/favicon.ico"
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSaveSeo(seoData)}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Save size={14} /> SEO Meta-Tags im Code Speichern
                </button>
              </div>
            )}

            {/* TAB: ANIMATION TIMELINE & KEYFRAME EDITOR */}
            {rightTab === 'animation' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Film size={16} className="text-blue-500" /> Visual Animation Timeline
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Wende Keyframe-Animationen, Übergänge &amp; Timing auf das gewählte Canvas-Element an.
                  </p>
                </div>

                <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                  <div>
                    <label className="text-xs font-bold text-black/80 dark:text-white/80 block mb-1">Animation Preset:</label>
                    <select
                      value={animPreset}
                      onChange={(e) => setAnimPreset(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fade-in">Fade In (Sanftes Einblenden)</option>
                      <option value="slide-up">Slide Up (Von unten hochgleiten)</option>
                      <option value="pulse">Pulse (Pulsieren / Akzent)</option>
                      <option value="bounce">Bounce (Federnde Bewegung)</option>
                      <option value="spin">Spin (Endlose Rotation)</option>
                      <option value="zoom-in">Zoom In (Vergrößern)</option>
                      <option value="flip-in">Flip In (3D Wenden)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-black/70 dark:text-white/70 block mb-1">Dauer (Duration):</label>
                      <select
                        value={animDuration}
                        onChange={(e) => setAnimDuration(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono"
                      >
                        <option value="0.2s">0.2 Sek (Sehr schnell)</option>
                        <option value="0.5s">0.5 Sek (Standard)</option>
                        <option value="1s">1.0 Sek (Langsam)</option>
                        <option value="2s">2.0 Sek (Sehr langsam)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-black/70 dark:text-white/70 block mb-1">Verzögerung (Delay):</label>
                      <select
                        value={animDelay}
                        onChange={(e) => setAnimDelay(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono"
                      >
                        <option value="0s">0.0 Sek (Sofort)</option>
                        <option value="0.2s">0.2 Sek</option>
                        <option value="0.5s">0.5 Sek</option>
                        <option value="1s">1.0 Sek</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-black/70 dark:text-white/70 block mb-1">Easing Curve:</label>
                      <select
                        value={animEasing}
                        onChange={(e) => setAnimEasing(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs"
                      >
                        <option value="ease-in-out">ease-in-out</option>
                        <option value="ease-out">ease-out</option>
                        <option value="ease-in">ease-in</option>
                        <option value="linear">linear</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-black/70 dark:text-white/70 block mb-1">Wiederholungen:</label>
                      <select
                        value={animIteration}
                        onChange={(e) => setAnimIteration(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs"
                      >
                        <option value="1">1x Abspielen</option>
                        <option value="2">2x Abspielen</option>
                        <option value="infinite">Endlosschleife (infinite)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyAnimation}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Play size={14} /> Animation auf gewähltes Element anwenden
                </button>
              </div>
            )}

            {/* TAB: ASSET MANAGER PANEL */}
            {rightTab === 'assets' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <ImageLucide size={16} className="text-blue-500" /> Asset &amp; Media Manager
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Verwalte Bilder, Vektor-Icons &amp; Web-Schriftarten. Füge sie mit einem Klick ins Canvas ein.
                  </p>
                </div>

                {/* Sub-Category Switcher */}
                <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
                  <button
                    onClick={() => setAssetCategory('images')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetCategory === 'images' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    Bilder
                  </button>
                  <button
                    onClick={() => setAssetCategory('icons')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetCategory === 'icons' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    SVGs &amp; Icons
                  </button>
                  <button
                    onClick={() => setAssetCategory('fonts')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetCategory === 'fonts' ? 'bg-blue-600 text-white shadow-sm' : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    Fonts
                  </button>
                </div>

                {/* Custom Asset URL Input */}
                <div className="flex flex-col gap-1.5 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                  <label className="text-xs font-bold text-black/80 dark:text-white/80">Eigene Asset-URL einfügen:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAssetUrl}
                      onChange={(e) => setCustomAssetUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (customAssetUrl.trim()) {
                          handleInsertComponent(`<img src="${customAssetUrl.trim()}" alt="Asset" className="w-full h-auto rounded-2xl shadow-md" />`);
                          setCustomAssetUrl('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shrink-0 shadow-sm"
                    >
                      + Einfügen
                    </button>
                  </div>
                </div>

                {/* Category 1: Stock Images */}
                {assetCategory === 'images' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                      Unsplash Kuratierte HD Stockbilder:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: 'Tech Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
                        { title: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
                        { title: 'Creative Studio', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' },
                        { title: 'Abstract Design', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleInsertComponent(`<img src="${item.url}" alt="${item.title}" class="w-full h-48 object-cover rounded-2xl shadow-lg border border-black/10 dark:border-white/10" />`)}
                          className="group relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 cursor-pointer aspect-video bg-slate-100 dark:bg-slate-800"
                        >
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                            <span className="text-white text-[10px] font-bold">+ {item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category 2: SVG Icons */}
                {assetCategory === 'icons' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                      Integrierte Lucide Vektor SVGs:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: 'Check Icon', code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500 w-6 h-6"><polyline points="20 6 9 17 4 12"/></svg>` },
                        { title: 'Sparkles Icon', code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500 w-6 h-6"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>` },
                        { title: 'Shield Icon', code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-500 w-6 h-6"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>` },
                        { title: 'Arrow Right', code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>` }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleInsertComponent(item.code)}
                          className="p-3 bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 border border-black/10 dark:border-white/10 rounded-2xl flex items-center gap-2 text-xs font-bold text-left transition-all"
                        >
                          <div dangerouslySetInnerHTML={{ __html: item.code }} />
                          <span className="truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category 3: Google & Custom Web Fonts */}
                {assetCategory === 'fonts' && (
                  <div className="flex flex-col gap-3">
                    
                    {/* Import Custom Font / Webfont */}
                    <div className="flex flex-col gap-2 p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl">
                      <span className="text-xs font-bold text-black/80 dark:text-white/80 flex items-center gap-1.5">
                        <UploadCloud size={14} className="text-blue-500" /> Eigene Font (Google / WOFF / TTF) importieren:
                      </span>
                      <input
                        type="text"
                        placeholder="Font Name (z.B. Space Grotesk)..."
                        value={customFontNameInput}
                        onChange={(e) => setCustomFontNameInput(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Font CSS / CDN URL (https://fonts.googleapis...)..."
                        value={customFontUrlInput}
                        onChange={(e) => setCustomFontUrlInput(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddCustomFont}
                        className="py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Font-Bibliothek hinzufügen
                      </button>
                    </div>

                    <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                      Verfügbare Webfonts ({customFontsList.length}):
                    </span>

                    <div className="flex flex-col gap-2">
                      {customFontsList.map((font) => (
                        <div key={font.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-black/90 dark:text-white/90">{font.name}</h4>
                              <span className="text-[9px] text-black/50 dark:text-white/50 font-mono">{font.category}</span>
                            </div>
                            <span className="text-[10px] text-blue-500 font-mono font-bold truncate max-w-[100px]" title={font.url}>CSS Link</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const fontTag = `<link href="${font.url}" rel="stylesheet">`;
                                if (activeFile.content.includes('</head>')) {
                                  updateFileContent(activeFile.content.replace('</head>', `${fontTag}\n</head>`), true);
                                  alert(`Font "${font.name}" in den <head> eingefügt!`);
                                }
                              }}
                              className="flex-1 py-1 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-black dark:text-white font-bold text-[10px]"
                            >
                              + Head Link
                            </button>

                            <button
                              onClick={() => handleApplyFontGlobally(font.name, font.url)}
                              className="flex-1 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-sm"
                            >
                              Global &lt;body&gt; Font
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REAL-TIME COMPUTED STYLES */}
            {rightTab === 'computed' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Sliders size={16} className="text-blue-500" /> Live Computed CSS
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Echtzeit berechnete CSS-Eigenschaften des ausgewählten Canvas-Elements.
                  </p>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={computedSearchFilter}
                    onChange={(e) => setComputedSearchFilter(e.target.value)}
                    placeholder="Filter (z.B. flex, font, margin)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Properties List */}
                <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto custom-scrollbar font-mono text-xs">
                  {filteredComputedEntries.length === 0 ? (
                    <p className="text-xs text-black/40 dark:text-white/40 py-4 text-center">Keine passenden CSS-Eigenschaften gefunden.</p>
                  ) : (
                    filteredComputedEntries.map(([prop, val]) => (
                      <div key={prop} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{prop}:</span>
                        <span className="text-black/80 dark:text-white/80 font-normal truncate max-w-[140px]" title={val}>{val}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ACCESSIBILITY (A11Y) SCANNER PANEL */}
            {rightTab === 'a11y' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" /> Barrierefreiheit (A11y) Scanner
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Automatisierte Prüfung auf ARIA-Label, Kontraste, Alt-Attribute &amp; Überschriftenhierarchie.
                  </p>
                </div>

                {/* Score Banner */}
                <div className="p-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 dark:text-white/50 block">WCAG A11y Score</span>
                    <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{a11yAudit.score} / 100</h2>
                  </div>
                  <button
                    onClick={handleAutoFixA11y}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Wand2 size={13} /> 1-Klick ARIA Auto-Fix
                  </button>
                </div>

                {/* Issues List */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                    Erkannte Prüfpunkte ({a11yAudit.issues.length}):
                  </span>

                  {a11yAudit.issues.length === 0 ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-emerald-600 dark:text-emerald-400 text-xs font-bold flex flex-col items-center gap-1">
                      <CheckCircle2 size={24} />
                      Perfekt! Keine Barrierefreiheits-Fehler im DOM gefunden.
                    </div>
                  ) : (
                    a11yAudit.issues.map(iss => (
                      <div key={iss.id} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            iss.severity === 'error' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            Level {iss.wcagLevel} &bull; {iss.severity}
                          </span>
                          <span className="font-mono text-[10px] text-blue-500 font-bold truncate max-w-[120px]">{iss.selector}</span>
                        </div>
                        <h4 className="font-bold text-black/90 dark:text-white/90">{iss.title}</h4>
                        <p className="text-[11px] text-black/60 dark:text-white/60">{iss.recommendation}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: GLOBAL CSS VARIABLES (:root) PANEL */}
            {rightTab === 'cssvars' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Sliders size={16} className="text-blue-500" /> CSS Variablen (:root) Manager
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Definiere &amp; bearbeite globale CSS-Variablen für projektweite Farb-, Schrift- &amp; Abstandsthemes.
                  </p>
                </div>

                {/* Create New Variable */}
                <div className="flex flex-col gap-2 p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl">
                  <span className="text-xs font-bold text-black/80 dark:text-white/80 block">Neue CSS-Variable anlegen:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCssVarName}
                      onChange={(e) => setNewCssVarName(e.target.value)}
                      placeholder="--brand-primary"
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newCssVarValue}
                      onChange={(e) => setNewCssVarValue(e.target.value)}
                      placeholder="#3b82f6"
                      className="w-24 px-2.5 py-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (newCssVarName.trim() && newCssVarValue.trim()) {
                          handleUpdateCssVar(newCssVarName.trim(), newCssVarValue.trim());
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm active:scale-95 shrink-0"
                    >
                      + Anlegen
                    </button>
                  </div>
                </div>

                {/* List of Defined Variables */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                    Aktive :root Variablen ({cssVarsList.length}):
                  </span>

                  {cssVarsList.length === 0 ? (
                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-center text-xs text-black/50 dark:text-white/50">
                      Keine :root CSS-Variablen definiert. Lege oben eine neue Variable an.
                    </div>
                  ) : (
                    cssVarsList.map((v) => (
                      <div key={v.name} className="p-3 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex flex-col truncate">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{v.name}</span>
                          <span className="font-mono text-[10px] text-black/50 dark:text-white/50 truncate">var({v.name})</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {v.type === 'color' && (
                            <input
                              type="color"
                              value={v.value.startsWith('#') && v.value.length === 7 ? v.value : '#3b82f6'}
                              onChange={(e) => handleUpdateCssVar(v.name, e.target.value)}
                              className="w-7 h-7 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
                            />
                          )}
                          <input
                            type="text"
                            value={v.value}
                            onChange={(e) => handleUpdateCssVar(v.name, e.target.value)}
                            className="w-24 px-2 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              if (selectedPath) {
                                sendCommandToIframe('UPDATE_STYLE', { property: 'color', value: `var(${v.name})` });
                              } else {
                                alert('Bitte wähle zuerst ein Element im Canvas aus.');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]"
                            title="Auf gewähltes Element anwenden (color: var(...))"
                          >
                            Anwenden
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COMPONENT LIBRARY PANEL */}
            {rightTab === 'library' && (
              <div className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Layers size={16} className="text-blue-500" /> Komponenten-Bibliothek
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Klicke auf einen Baustein, um ihn an der aktuellen Stelle im Canvas einzufügen.
                  </p>
                </div>

                {/* Saved Snippets from Component Storage */}
                {savedSnippets.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Save size={12} /> Aus Component Storage ({savedSnippets.length})
                    </span>
                    <div className="flex flex-col gap-2">
                      {savedSnippets.slice(0, 5).map(snippet => (
                        <div
                          key={snippet.id}
                          className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between hover:bg-purple-500/20 transition-all cursor-pointer group"
                          onClick={() => handleInsertComponent(snippet.code)}
                        >
                          <div>
                            <h4 className="font-bold text-xs text-black dark:text-white">{snippet.title}</h4>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">{snippet.category}</span>
                          </div>
                          <button className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[10px] shadow-sm">
                            + Einfügen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Components Categories */}
                {PRESET_COMPONENTS.map(group => (
                  <div key={group.category} className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
                      {group.category}
                    </span>
                    <div className="flex flex-col gap-2">
                      {group.items.map(item => (
                        <div
                          key={item.name}
                          onClick={() => handleInsertComponent(item.code)}
                          className="p-3 bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 border border-black/10 dark:border-white/10 hover:border-blue-500/30 rounded-2xl flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <span className="font-bold text-xs text-black/80 dark:text-white/80 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {item.name}
                          </span>
                          <button className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] shadow-sm opacity-90 group-hover:opacity-100">
                            + Einfügen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            )}

            {/* TAB 4: AI ELEMENT GENERATOR */}
            {rightTab === 'ai' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Bot size={16} className="text-purple-500" /> AI Element Synthesizer
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Generiere komplexe Tailwind UI-Bausteine aus natürlicher Sprachbeschreibung.
                  </p>
                </div>

                <div className="flex flex-col gap-2 bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-2xl">
                  <label className="text-xs font-bold text-purple-700 dark:text-purple-300">Prompt Beschreibung:</label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="z.B. Ein moderner Preistabelle mit 3 Tarifen, Feature-Listen und einem hervorgehobenen Bestseller..."
                    className="w-full p-2.5 bg-white dark:bg-[#111111] border border-purple-500/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <button
                    onClick={handleGenerateAiElement}
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className={`mt-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all ${
                      isAiGenerating || !aiPrompt.trim() ? 'bg-purple-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 active:scale-95'
                    }`}
                  >
                    {isAiGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isAiGenerating ? 'Generiere UI Component...' : 'Element Generieren'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-[11px] font-bold text-black/50 dark:text-white/50">Beispiels-Prompts:</span>
                  <button
                    onClick={() => setAiPrompt('Eine Preistabelle mit 3 Tarifen und hervorgehobenem Bestseller')}
                    className="text-left text-xs p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70 transition-colors"
                  >
                    💡 "Preistabelle mit 3 Tarifen"
                  </button>
                  <button
                    onClick={() => setAiPrompt('Ein Newsletter-Anmeldeformular mit Hintergrund-Glow')}
                    className="text-left text-xs p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70 transition-colors"
                  >
                    💡 "Newsletter-Anmeldeformular"
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: AI INSPECTOR & PROACTIVE OPTIMIZER */}
            {rightTab === 'ai-inspector' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Bot size={16} className="text-purple-500" /> AI Inspector &amp; Optimizely
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Proaktive KI-Analyse &amp; Performance-Tipps für das aktuell gewählte Element: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedPath || '<keines gewählt>'}</span>
                  </p>
                </div>

                {selectedTag ? (
                  <div className="flex flex-col gap-3">
                    {/* Current Element Summary Card */}
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-purple-600 dark:text-purple-300">&lt;{selectedTag}&gt;</span>
                        <span className="text-[10px] text-black/50 dark:text-white/50">{selectedClasses.split(' ').filter(Boolean).length} Klassen</span>
                      </div>
                      <p className="text-[11px] font-mono text-black/70 dark:text-white/70 truncate">{selectedClasses || 'Keine Klassen'}</p>
                    </div>

                    {/* AI Tips List */}
                    {analyzeElementForAiOptimization(selectedTag, selectedClasses, selectedTextContent).length === 0 ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center gap-1.5">
                        <CheckCircle2 size={24} />
                        Hervorragend! Für dieses Element wurden keine redundanten Klassen oder Layout-Konflikte gefunden.
                      </div>
                    ) : (
                      analyzeElementForAiOptimization(selectedTag, selectedClasses, selectedTextContent).map(tip => (
                        <div key={tip.id} className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded font-bold text-[9px] uppercase bg-purple-500/20 text-purple-600 dark:text-purple-300">
                              {tip.type} &bull; {tip.severity}
                            </span>
                          </div>
                          <h4 className="font-bold text-black/90 dark:text-white/90">{tip.title}</h4>
                          <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">{tip.description}</p>
                          <button
                            onClick={() => {
                              const cleaned = selectedClasses
                                .replace(/\s+/g, ' ')
                                .replace(/flex-row flex-col/g, 'flex-col')
                                .replace(/px-4 px-2/g, 'px-4')
                                .replace(/p-4 p-2/g, 'p-4')
                                .trim();
                              setSelectedClasses(cleaned);
                              sendCommandToIframe('UPDATE_CLASSES', { classes: cleaned });
                              alert('Element Klassen erfolgreich per KI optimiert!');
                            }}
                            className="mt-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Sparkles size={12} /> Tipp automatisch anwenden
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-center text-xs text-black/50 dark:text-white/50 flex flex-col items-center gap-2">
                    <MousePointer size={24} className="text-purple-400 animate-bounce" />
                    Klicke auf ein Element im Canvas, um proaktive KI-Optimierungstipps zu erhalten.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL: KEYBOARD SHORTCUTS (Ctrl+/) */}
      {/* MODAL: KEYBOARD SHORTCUTS OVERLAY */}
      {isShortcutsOpen && (() => {
        const shortcutsList = [
          { key: 'Ctrl + S / Cmd + S', desc: 'Datei Speichern & Snapshot erstellen', category: 'Snapshots & Storage', action: () => handleCreateVersionSnapshot(`Save: ${activeFile.name}`, 'Tastenkombination Ctrl+S') },
          { key: 'Ctrl + Z / Cmd + Z', desc: 'Aktion Rückgängig machen (Undo)', category: 'Editor & Code', action: handleUndo },
          { key: 'Ctrl + Shift + Z / Ctrl + Y', desc: 'Aktion Wiederholen (Redo)', category: 'Editor & Code', action: handleRedo },
          { key: 'Ctrl + K / Cmd + K', desc: 'Command Palette / Schnellbefehle öffnen', category: 'Canvas & Navigation', action: () => setIsCommandPaletteOpen(true) },
          { key: 'Ctrl + Shift + F', desc: 'Projektweiter Suchen & Ersetzen', category: 'Editor & Code', action: () => setIsGlobalSearchOpen(true) },
          { key: 'Ctrl + Shift + P', desc: 'Distraction-Free Live Preview Mode', category: 'Canvas & Navigation', action: () => setIsPreviewMode(true) },
          { key: 'Ctrl + B', desc: 'Split Screen View Mode umschalten', category: 'Canvas & Navigation', action: () => setViewMode(prev => prev === 'split' ? 'visual' : prev === 'visual' ? 'code' : 'split') },
          { key: 'Ctrl + /', desc: 'Tastenkombinationen Overlay anzeigen', category: 'Canvas & Navigation', action: () => setIsShortcutsOpen(true) },
          { key: 'Escape', desc: 'Modal schließen / Elementauswahl aufheben', category: 'Canvas & Navigation', action: () => setSelectedPath(null) }
        ];

        const filteredShortcuts = shortcutsList.filter(s => {
          if (!shortcutSearchQuery.trim()) return true;
          const query = shortcutSearchQuery.toLowerCase();
          return s.desc.toLowerCase().includes(query) || s.key.toLowerCase().includes(query) || s.category.toLowerCase().includes(query);
        });

        return (
          <div 
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsShortcutsOpen(false)}
          >
            <div 
              className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    <Command size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                      Tastenkombinationen &amp; Shortcuts
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60">Arbeite schneller mit Tastenkürzeln für den Studio-Editor.</p>
                  </div>
                </div>
                <button onClick={() => setIsShortcutsOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Search & Keypress Indicator */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search size={15} className="absolute left-3 top-3 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={shortcutSearchQuery}
                    onChange={(e) => setShortcutSearchQuery(e.target.value)}
                    placeholder="Shortcut oder Funktion suchen..."
                    className="w-full pl-9 pr-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {lastKeyPressed && (
                  <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-mono text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 shrink-0">
                    <span>Gedrückt:</span>
                    <kbd className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] shadow-sm">{lastKeyPressed}</kbd>
                  </div>
                )}
              </div>

              {/* Shortcuts List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1">
                {filteredShortcuts.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      s.action();
                      setIsShortcutsOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold uppercase">
                        {s.category}
                      </span>
                      <span className="text-xs font-bold text-black/90 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {s.desc}
                      </span>
                    </div>

                    <kbd className="px-2.5 py-1 rounded-xl bg-white dark:bg-black border border-black/10 dark:border-white/20 font-mono text-xs font-bold shadow-sm shrink-0">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-black/50 dark:text-white/50">
                <span>Tipp: Klicke auf eine Tastenkombination, um die Aktion direkt auszuführen.</span>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hidden Render Container for Export Code Snippet Image (html2canvas) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div
          ref={exportImageRef}
          className="w-[800px] p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 rounded-3xl shadow-2xl border border-white/20 font-mono text-xs"
        >
          {/* Mac Window Control Dots Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm" />
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
              <span className="ml-3 text-xs font-bold text-slate-300 font-sans tracking-wide">
                {activeFile.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-blue-500/30">
                {activeFile.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                YES Studio
              </span>
            </div>
          </div>

          {/* Styled Formatted Code Box */}
          <div className="p-5 bg-black/60 rounded-2xl border border-white/10 overflow-hidden leading-relaxed text-slate-200 font-mono text-[12px] whitespace-pre-wrap break-all shadow-inner">
            {activeFile.content.slice(0, 2200)}
            {activeFile.content.length > 2200 ? '\n\n/* ... (Ausschnitt aus ' + activeFile.name + ') ... */' : ''}
          </div>

          {/* Footer Watermark & Date */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="font-extrabold flex items-center gap-1.5 text-blue-400">
              ⚡ YES Studio WYSIWYG &bull; Code Snippet Generator
            </span>
            <span className="font-mono text-slate-500">
              {new Date().toLocaleDateString('de-DE')} {new Date().toLocaleTimeString('de-DE')}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL: SMART LINTER REPORT */}
      {isLinterOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLinterOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TerminalSquare size={20} className="text-cyan-500" /> Smart Linter Report
              </h3>
              <button onClick={() => setIsLinterOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {linterReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500 gap-2">
                <CheckCircle2 size={40} />
                <p className="font-bold text-sm">Keine kritischen Syntax- oder A11y-Fehler gefunden!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                {linterReports.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{r.message}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsLinterOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* FULL-SCREEN DISTRACTION-FREE PREVIEW MODE OVERLAY */}
      {isPreviewMode && (
        <div className="fixed inset-0 z-[99999] bg-slate-900 flex flex-col">
          {/* Floating Exit Top Bar */}
          <div className="absolute top-4 right-4 z-[100000] flex items-center gap-2 bg-black/80 text-white backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-2xl">
            <span className="text-xs font-bold flex items-center gap-2">
              <Eye size={14} className="text-emerald-400 animate-pulse" /> Live Preview-Modus (Aktiv)
            </span>
            <button
              onClick={() => setIsPreviewMode(false)}
              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition-all ml-2"
            >
              Vorschau beenden (ESC)
            </button>
          </div>

          <iframe
            title="Clean Live Preview"
            srcDoc={activeFile.content}
            className="w-full h-full border-0 bg-white"
          />
        </div>
      )}

      {/* MODAL: CODE HEALTH AUDIT */}
      {isHealthModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsHealthModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} className="text-blue-500" />
                <h3 className="font-bold text-lg">Code Health &amp; Barrierefreiheit Audit</h3>
              </div>
              <button onClick={() => setIsHealthModalOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Score Banner */}
            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">Gesamt-Score</span>
                <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400">{healthAudit.score} / 100</h2>
              </div>
              <button
                onClick={handleAutoFixHealth}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Wand2 size={14} /> 1-Klick Auto-Fix
              </button>
            </div>

            {healthAudit.issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500 gap-2">
                <CheckCircle2 size={44} />
                <p className="font-bold text-sm">Ausgezeichnet! Dein Code ist 100% valides, barrierefreies HTML5.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                {healthAudit.issues.map(iss => (
                  <div key={iss.id} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="font-bold">{iss.title}</h4>
                      <p className="text-[11px] opacity-80">{iss.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsHealthModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NEW FILE */}
      {isNewFileModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsNewFileModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg">Neue Datei erstellen</h3>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">Dateiname (z.B. header.html, custom.css):</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="header.html"
                className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewFileModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border">
                Abbrechen
              </button>
              <button onClick={handleCreateFile} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CENTRALIZED COMMAND PALETTE (CTRL+K) */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 p-4"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3">
              <Command size={20} className="text-blue-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Tippe ein Kommando (z.B. 'Template', 'Search', 'ZIP', 'A11y')..."
                className="flex-1 bg-transparent text-sm font-semibold text-black dark:text-white focus:outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
              />
              <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-mono text-black/50 dark:text-white/50">
                ESC
              </span>
            </div>

            {/* Commands List */}
            <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {commandItems
                .filter(cmd => cmd.title.toLowerCase().includes(commandQuery.toLowerCase()) || cmd.category.toLowerCase().includes(commandQuery.toLowerCase()) || cmd.description.toLowerCase().includes(commandQuery.toLowerCase()))
                .map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full p-3 rounded-2xl hover:bg-blue-500/10 text-left flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {cmd.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{cmd.title}</h4>
                        <span className="text-[10px] text-black/50 dark:text-white/50">{cmd.category} &bull; {cmd.description}</span>
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] font-mono text-black/50 dark:text-white/50">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GLOBAL SEARCH AND REPLACE */}
      {isGlobalSearchOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsGlobalSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Replace size={22} className="text-blue-500" />
                <h3 className="font-extrabold text-lg">Projektweiter Suchen &amp; Ersetzen</h3>
              </div>
              <button onClick={() => setIsGlobalSearchOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-black/70 dark:text-white/70 block mb-1">Suchen nach (Klassen, Text, Attribute):</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3.5 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    autoFocus
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="z.B. bg-blue-600 oder YES Studio"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black/70 dark:text-white/70 block mb-1">Ersetzen durch:</label>
                <div className="relative">
                  <Replace size={16} className="absolute left-3 top-3.5 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={globalReplaceQuery}
                    onChange={(e) => setGlobalReplaceQuery(e.target.value)}
                    placeholder="z.B. bg-purple-600"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-black/70 dark:text-white/70">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchMatchCase}
                    onChange={(e) => setSearchMatchCase(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  Gross-/Kleinschreibung beachten (Match Case)
                </label>
              </div>
            </div>

            {/* File Matches Preview */}
            {globalSearchQuery.trim() && (
              <div className="p-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Gefundene Treffer in Projektdateien:</span>
                {files.map(file => {
                  const regex = new RegExp(globalSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), searchMatchCase ? 'g' : 'gi');
                  const matches = file.content.match(regex);
                  if (!matches) return null;
                  return (
                    <div key={file.id} className="p-2.5 rounded-xl bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{file.name}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold">{matches.length} Treffer</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handlePerformGlobalReplace(false)}
                className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs border border-black/10 dark:border-white/10 transition-all"
              >
                In aktiver Datei ersetzen
              </button>
              <button
                onClick={() => handlePerformGlobalReplace(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                In ALLEN Projektdateien ersetzen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STARTER TEMPLATES */}
      {isTemplatesModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsTemplatesModalOpen(false)}
        >
          <div 
            className="w-full max-w-4xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Starter Templates</h3>
                  <p className="text-xs text-black/60 dark:text-white/60">Initialisiere dein Projekt mit vorgefertigten, responsive HTML5 &amp; Tailwind Vorlagen.</p>
                </div>
              </div>
              <button onClick={() => setIsTemplatesModalOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-1">
              {STARTER_TEMPLATES.map(tpl => (
                <div 
                  key={tpl.id}
                  className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {tpl.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {tpl.badge}
                      </span>
                    </div>
                    <h4 className="font-black text-lg text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectStarterTemplate(tpl)}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} /> Template Laden &amp; Anwenden
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERSION HISTORY SNAPSHOTS */}
      {isVersionHistoryModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsVersionHistoryModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Clock size={22} className="text-amber-500" />
                <div>
                  <h3 className="font-extrabold text-lg">Version History &amp; Snapshots</h3>
                  <p className="text-xs text-black/60 dark:text-white/60">Speichere Stände deines Projekts und stelle frühere Iterationen per 1-Klick wieder her.</p>
                </div>
              </div>
              <button onClick={() => setIsVersionHistoryModalOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Save New Snapshot Input Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-3">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Plus size={14} /> Aktuellen Projektstand als Snapshot speichern:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Snapshot Name (z.B. v1.2 Redesign Complete)..."
                  value={snapshotNameInput}
                  onChange={(e) => setSnapshotNameInput(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Kurze Zusammenfassung (optional)..."
                  value={snapshotSummaryInput}
                  onChange={(e) => setSnapshotSummaryInput(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => handleCreateVersionSnapshot()}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> Snapshot jetzt erstellen
              </button>
            </div>

            {/* Saved Snapshots Timeline List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-1">
              <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                Gespeicherte Versionen ({versionSnapshots.length}):
              </span>

              {versionSnapshots.length === 0 ? (
                <p className="text-center py-8 text-xs text-black/40 dark:text-white/40">Keine gespeicherten Versionen vorhanden.</p>
              ) : (
                versionSnapshots.map((snap) => (
                  <div key={snap.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-black/90 dark:text-white/90">{snap.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                          {snap.files.length} Datei(en)
                        </span>
                      </div>
                      <span className="text-[11px] text-black/50 dark:text-white/50 font-mono flex items-center gap-1">
                        <Clock size={11} /> {snap.timestamp} &bull; {snap.changeSummary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreVersionSnapshot(snap)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <History size={13} /> Wiederherstellen
                      </button>
                      <button
                        onClick={() => handleDeleteVersionSnapshot(snap.id)}
                        className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Snapshot löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THEME PALETTE GENERATOR (HSL) */}
      {isThemePaletteModalOpen && (() => {
        const { primaryHex, schemes } = generateHslThemePalettes(activeFile.content);
        return (
          <div 
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsThemePaletteModalOpen(false)}
          >
            <div 
              className="w-full max-w-3xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Palette size={22} className="text-purple-500" />
                  <div>
                    <h3 className="font-extrabold text-lg">Theme Palette Generator (HSL Algorithm)</h3>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Erkennt deine primäre Farbe ({primaryHex}) und generiert harmonische Farbschemata.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsThemePaletteModalOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Base Primary Color Banner */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shadow-inner border border-white/20" style={{ backgroundColor: primaryHex }}></div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">Primäre Hauptfarbe</span>
                    <h4 className="font-mono font-extrabold text-sm text-black/90 dark:text-white/90">{primaryHex}</h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cssVarsTag = `<style>\n:root {\n  --primary: ${primaryHex};\n  --primary-complement: ${schemes[0].colors[2]};\n  --surface: ${schemes[0].colors[4]};\n}\n</style>`;
                    if (activeFile.content.includes('</head>')) {
                      updateFileContent(activeFile.content.replace('</head>', `${cssVarsTag}\n</head>`), true);
                      alert('CSS :root Farb-Variablen erfolgreich in den <head> eingefügt!');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  + Farbschema als CSS :root Variablen
                </button>
              </div>

              {/* Generated Schemes Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 p-1">
                {schemes.map((scheme, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-purple-600 dark:text-purple-400">{scheme.title}</h4>
                      <span className="text-[10px] font-mono text-black/50 dark:text-white/50">{scheme.type}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {scheme.colors.map((hex, cIdx) => (
                        <div 
                          key={cIdx} 
                          onClick={() => {
                            navigator.clipboard.writeText(hex);
                            alert(`Farbcode ${hex} in Zwischenablage kopiert!`);
                          }}
                          className="group cursor-pointer flex flex-col gap-1"
                        >
                          <div 
                            className="h-16 rounded-xl shadow-sm border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform relative flex items-end p-1.5"
                            style={{ backgroundColor: hex }}
                          >
                            <span className="text-[9px] font-mono font-bold bg-black/60 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              Kopieren
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-center text-black/80 dark:text-white/80">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: INTERACTIVE DEPENDENCY GRAPH */}
      {isDependencyGraphModalOpen && (() => {
        const { nodes, links } = analyzeDependencyGraph(files);
        const orphanedCount = nodes.filter(n => n.status === 'orphaned').length;
        return (
          <div 
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDependencyGraphModalOpen(false)}
          >
            <div 
              className="w-full max-w-4xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Network size={22} className="text-indigo-500" />
                  <div>
                    <h3 className="font-extrabold text-lg">Interactive Dependency Graph &amp; Orphan Analyzer</h3>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Visualisiert Verknüpfungen zwischen Dateien, Komponenten, CSS-Variablen und Assets.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDependencyGraphModalOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
                  <span className="text-[10px] font-bold text-black/50 dark:text-white/50 block uppercase">Projektdateien</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{files.length}</span>
                </div>
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
                  <span className="text-[10px] font-bold text-black/50 dark:text-white/50 block uppercase">Komponenten</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{nodes.filter(n => n.type === 'component').length}</span>
                </div>
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
                  <span className="text-[10px] font-bold text-black/50 dark:text-white/50 block uppercase">CSS-Variablen</span>
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400">{nodes.filter(n => n.type === 'css-var').length}</span>
                </div>
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
                  <span className="text-[10px] font-bold text-black/50 dark:text-white/50 block uppercase">Orphaned / Unbenutzt</span>
                  <span className={`text-lg font-black ${orphanedCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{orphanedCount}</span>
                </div>
              </div>

              {/* Node Graph Cards Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-1">
                <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 block">
                  Analysierte Knoten &amp; Abhängigkeiten ({nodes.length}):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nodes.map((node) => (
                    <div 
                      key={node.id} 
                      className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                        node.status === 'orphaned'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                          node.type === 'file' ? 'bg-blue-500/20 text-blue-500' :
                          node.type === 'component' ? 'bg-indigo-500/20 text-indigo-500' :
                          node.type === 'css-var' ? 'bg-purple-500/20 text-purple-500' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {node.type}
                        </span>
                        {node.status && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            node.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                          }`}>
                            {node.status === 'active' ? '✓ Aktiv' : '⚠️ Orphan'}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-xs font-mono text-black/90 dark:text-white/90">{node.label}</h4>
                      {node.details && <p className="text-[11px] text-black/60 dark:text-white/60">{node.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: DOCUMENTATION & README GENERATOR */}
      {isDocGenModalOpen && (() => {
        const docsMd = generateProjectDocumentationMarkdown('YES Studio Projekt', files, healthAudit.score, aiCodeReview.score);
        return (
          <div 
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDocGenModalOpen(false)}
          >
            <div 
              className="w-full max-w-3xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={22} className="text-blue-500" />
                  <div>
                    <h3 className="font-extrabold text-lg">README &amp; Technische Dokumentation Generator</h3>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Erstellt automatisch eine vollumfängliche Dokumentation für dein Projekt.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDocGenModalOpen(false)} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const existingReadme = files.find(f => f.name.toLowerCase() === 'readme.md');
                    if (existingReadme) {
                      updateFileContent(docsMd, true);
                      alert('README.md im Projekt aktualisiert!');
                    } else {
                      const newFile: ProjectFile = {
                        id: `readme-${Date.now()}`,
                        name: 'README.md',
                        type: 'js',
                        folder: 'root',
                        content: docsMd
                      };
                      setFiles([...files, newFile]);
                      alert('README.md wurde erfolgreich zu deinen Projektdateien hinzugefügt!');
                    }
                    setIsDocGenModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <FilePlus size={14} /> Als README.md im Projekt speichern
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(docsMd);
                    alert('Markdown Dokumentation in Zwischenablage kopiert!');
                  }}
                  className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-black dark:text-white font-bold text-xs transition-all"
                >
                  In Zwischenablage kopieren
                </button>
              </div>

              {/* Code Box Preview */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {docsMd}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: TEMPLATES & MAILINGS STORAGE ARCHIV */}
      {isTemplateStorageModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsTemplateStorageModalOpen(false)}
        >
          <div 
            className="w-full max-w-6xl bg-white dark:bg-[#161616] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg font-bold">
                  <LayoutTemplate size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-xl text-black dark:text-white">Templates &amp; Mailings Storage</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                      {templatesStorage.length} Vorlagen
                    </span>
                    {selectedTemplateIds.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 font-mono text-xs font-bold border border-blue-500/30 flex items-center gap-1">
                        <CheckSquare size={12} /> {selectedTemplateIds.length} ausgewählt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Semantisches Archiv für komplette Mailings (SAM, Liftletter, Heatup, Nachfass) &amp; Anzeigen (Text-, Bild-, Redlink, Linktipp, NP).
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleExportTemplatesZip(selectedTemplateIds.length > 0 ? templatesStorage.filter(t => selectedTemplateIds.includes(t.id)) : templatesStorage)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                  title="Strukturierte ZIP-Datei mit Ordner-Gruppierung exportieren"
                >
                  <FolderDown size={14} /> {selectedTemplateIds.length > 0 ? `ZIP Export (${selectedTemplateIds.length})` : 'Alle ZIP Export'}
                </button>

                {/* Backup JSON dropdown or direct button */}
                <div className="relative group">
                  <button
                    onClick={handleExportTemplatesJsonBackup}
                    className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                    title="Sicherheitskopie als JSON herunterladen"
                  >
                    <Download size={13} /> Backup JSON
                  </button>
                </div>

                <label className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer">
                  <UploadCloud size={13} /> JSON Import
                  <input type="file" accept=".json" onChange={handleImportTemplatesJsonBackup} className="hidden" />
                </label>

                <button
                  onClick={handleOpenSaveCurrentFileAsTemplate}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                  title="Aktiven Editor-Code direkt als neues Template speichern"
                >
                  <Save size={14} /> Aktiven Code speichern
                </button>

                <button
                  onClick={handleOpenCreateNewTemplate}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={14} /> Neues Template
                </button>

                <button
                  onClick={() => setIsAddMetaModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-300 hover:bg-purple-600/25 font-bold text-xs border border-purple-500/30 transition-all flex items-center gap-1.5"
                  title="Dynamische Kategorien & Kunden erweitern oder löschen"
                >
                  <FolderPlus size={14} /> Kategorien &amp; Kunden
                </button>

                <button onClick={() => setIsTemplateStorageModalOpen(false)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={16} className="absolute left-3.5 top-3 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Suche nach Titel, Code, Keyword, Tag, Kunde..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {templateSearchQuery && (
                    <button
                      onClick={() => setTemplateSearchQuery('')}
                      className="absolute right-3 top-2.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter: Main Category */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black/60 dark:text-white/60">Typ:</span>
                  <select
                    value={templateFilterMainCat}
                    onChange={(e) => setTemplateFilterMainCat(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Alle">Alle Typen</option>
                    {customMainCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Filter: Sub Category */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black/60 dark:text-white/60">Format:</span>
                  <select
                    value={templateFilterSubCat}
                    onChange={(e) => setTemplateFilterSubCat(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Alle">Alle Formate</option>
                    <optgroup label="Mailings">
                      {customMailingCategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Anzeigen">
                      {customAnzeigeCategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Filter: Customer */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black/60 dark:text-white/60">Kunde/Brand:</span>
                  <select
                    value={templateFilterCustomer}
                    onChange={(e) => setTemplateFilterCustomer(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Alle">Alle Kunden</option>
                    {customCustomersList.map(cust => (
                      <option key={cust} value={cust}>{cust}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black/60 dark:text-white/60">Sortierung:</span>
                  <select
                    value={templateSortBy}
                    onChange={(e) => setTemplateSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="updatedDesc">Neueste zuerst</option>
                    <option value="updatedAsc">Älteste zuerst</option>
                    <option value="titleAsc">Titel (A-Z)</option>
                    <option value="customerAsc">Kunde (A-Z)</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(templateSearchQuery || templateFilterMainCat !== 'Alle' || templateFilterSubCat !== 'Alle' || templateFilterCustomer !== 'Alle' || templateSelectedTagFilter) && (
                  <button
                    onClick={() => {
                      setTemplateSearchQuery('');
                      setTemplateFilterMainCat('Alle');
                      setTemplateFilterSubCat('Alle');
                      setTemplateFilterCustomer('Alle');
                      setTemplateSelectedTagFilter(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <X size={12} /> Filter zurücksetzen
                  </button>
                )}
              </div>

              {/* Tag Filters Cloud Row */}
              {(() => {
                const allTags = Array.from(new Set(templatesStorage.flatMap(t => t.tags)));
                if (allTags.length === 0) return null;
                return (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                    <span className="text-[11px] font-bold text-black/50 dark:text-white/50 flex items-center gap-1">
                      <Tag size={12} /> Popular Tags:
                    </span>
                    {allTags.map(tag => {
                      const isSelected = templateSelectedTagFilter === tag;
                      return (
                        <button
                          key={tag}
                          onClick={() => setTemplateSelectedTagFilter(isSelected ? null : tag)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                            isSelected 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'bg-black/5 dark:bg-white/10 hover:bg-amber-500/20 text-black/70 dark:text-white/70'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Template Cards Grid & Multi-Select Bar */}
            {(() => {
              // Filtering
              let filtered = templatesStorage.filter(tpl => {
                if (templateFilterMainCat !== 'Alle' && tpl.mainCategory !== templateFilterMainCat) return false;
                if (templateFilterSubCat !== 'Alle' && tpl.subCategory !== templateFilterSubCat) return false;
                if (templateFilterCustomer !== 'Alle' && tpl.customer !== templateFilterCustomer) return false;
                if (templateSelectedTagFilter && !tpl.tags.includes(templateSelectedTagFilter)) return false;
                if (templateSearchQuery.trim()) {
                  const q = templateSearchQuery.toLowerCase();
                  const matchTitle = tpl.title.toLowerCase().includes(q);
                  const matchDesc = tpl.description.toLowerCase().includes(q);
                  const matchCust = tpl.customer.toLowerCase().includes(q);
                  const matchSub = tpl.subCategory.toLowerCase().includes(q);
                  const matchMain = tpl.mainCategory.toLowerCase().includes(q);
                  const matchTags = tpl.tags.some(t => t.toLowerCase().includes(q));
                  const matchCode = tpl.code.toLowerCase().includes(q);
                  if (!matchTitle && !matchDesc && !matchCust && !matchSub && !matchMain && !matchTags && !matchCode) return false;
                }
                return true;
              });

              // Sorting
              filtered = [...filtered].sort((a, b) => {
                if (templateSortBy === 'updatedDesc') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
                if (templateSortBy === 'updatedAsc') return (a.updatedAt || '').localeCompare(b.updatedAt || '');
                if (templateSortBy === 'titleAsc') return a.title.localeCompare(b.title);
                if (templateSortBy === 'customerAsc') return a.customer.localeCompare(b.customer);
                return 0;
              });

              const isAllFilteredSelected = filtered.length > 0 && filtered.every(t => selectedTemplateIds.includes(t.id));

              return (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  {/* Multi-Select Toolbar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectAllTemplates(filtered)}
                        className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
                      >
                        {isAllFilteredSelected ? <CheckSquare size={16} className="text-amber-500" /> : <Square size={16} className="text-black/40 dark:text-white/40" />}
                        <span>{isAllFilteredSelected ? 'Alle Abwählen' : 'Alle Auswählen'}</span>
                      </button>
                      <span className="text-black/50 dark:text-white/50">
                        Zeige {filtered.length} von {templatesStorage.length} Templates
                      </span>
                    </div>

                    {selectedTemplateIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 dark:text-amber-400 font-mono">
                          {selectedTemplateIds.length} Markiert
                        </span>
                        <button
                          onClick={() => handleExportTemplatesZip(templatesStorage.filter(t => selectedTemplateIds.includes(t.id)))}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <FolderDown size={12} /> Ausgewählte als ZIP
                        </button>
                        <button
                          onClick={handleDeleteSelectedTemplates}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Trash2 size={12} /> Löschen ({selectedTemplateIds.length})
                        </button>
                        <button
                          onClick={handleClearSelectedTemplates}
                          className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-[11px]"
                        >
                          Aufheben
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-3 text-black/50 dark:text-white/50">
                        <LayoutTemplate size={48} className="stroke-1 text-amber-500/60" />
                        <p className="font-bold text-sm">Keine passenden Templates für deine Suchfilter gefunden.</p>
                        <button
                          onClick={handleOpenCreateNewTemplate}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                        >
                          Neues Template erstellen
                        </button>
                      </div>
                    ) : (
                      filtered.map(tpl => {
                        const isSelected = selectedTemplateIds.includes(tpl.id);
                        const isCodeOpen = activeCodeTplId === tpl.id;

                        return (
                          <div 
                            key={tpl.id}
                            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-md relative ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-500/60 dark:bg-amber-500/15' 
                                : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-amber-500/50'
                            }`}
                          >
                            {/* Card Header & Badges */}
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between flex-wrap gap-1.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleSelectTemplate(tpl.id)}
                                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                                    title="Für Multi-Export auswählen"
                                  >
                                    {isSelected ? <CheckSquare size={18} className="text-amber-500 fill-amber-500/20" /> : <Square size={18} className="text-black/30 dark:text-white/30" />}
                                  </button>
                                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-500/30">
                                    {tpl.customer}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold text-[10px]">
                                    {tpl.mainCategory}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                    {tpl.subCategory}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 
                                  onClick={() => setQuickPreviewTemplate(tpl)}
                                  className="font-extrabold text-base text-black dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer flex items-center justify-between gap-2"
                                  title="Klicken für Quick Preview Modal"
                                >
                                  <span>{tpl.title}</span>
                                  <Eye size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </h4>
                                <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2 mt-1 leading-relaxed">
                                  {tpl.description}
                                </p>
                              </div>

                              {/* Tags */}
                              {tpl.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tpl.tags.map(t => (
                                    <span 
                                      key={t} 
                                      onClick={() => setTemplateSelectedTagFilter(templateSelectedTagFilter === t ? null : t)}
                                      className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] font-mono text-black/60 dark:text-white/60 cursor-pointer hover:bg-amber-500 hover:text-white transition-colors"
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Code Container when active */}
                            {isCodeOpen && (
                              <div className="w-full max-h-48 overflow-y-auto custom-scrollbar p-3 bg-slate-900 text-amber-300 rounded-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800">
                                {tpl.code}
                              </div>
                            )}

                            {/* Card Action Controls */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setQuickPreviewTemplate(tpl)}
                                    className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                    title="Öffne sandboxed Iframe Quick Preview Modal"
                                  >
                                    <Eye size={12} /> Quick Preview
                                  </button>
                                  <button
                                    onClick={() => setActiveCodeTplId(isCodeOpen ? null : tpl.id)}
                                    className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                      isCodeOpen ? 'bg-amber-500 text-white' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 hover:bg-black/10'
                                    }`}
                                    title="HTML-Quellcode einblenden"
                                  >
                                    <FileCode size={12} /> {isCodeOpen ? 'Zu' : 'Code'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(tpl.code);
                                      alert(`Code von "${tpl.title}" in Zwischenablage kopiert!`);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                                    title="Code kopieren"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSingleTemplateHtml(tpl)}
                                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                                    title="Als .html Datei herunterladen"
                                  >
                                    <Download size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditTemplate(tpl)}
                                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                                    title="Template bearbeiten"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTemplateItem(tpl.id, tpl.title)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                                    title="Template löschen"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => handleLoadTemplateToActiveFile(tpl)}
                                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                              >
                                <Download size={13} /> In Editor-Datei "{activeFile.name}" laden
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: QUICK PREVIEW MODAL */}
      {quickPreviewTemplate && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setQuickPreviewTemplate(null)}
        >
          <div 
            className="w-full max-w-5xl bg-white dark:bg-[#161616] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col gap-4 p-6 max-h-[94vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Preview Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md font-bold">
                  <Eye size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-black dark:text-white">
                      {quickPreviewTemplate.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-500/30">
                      {quickPreviewTemplate.customer}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold text-[10px]">
                      {quickPreviewTemplate.mainCategory}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                      {quickPreviewTemplate.subCategory}
                    </span>
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {quickPreviewTemplate.description}
                  </p>
                </div>
              </div>

              <button onClick={() => setQuickPreviewTemplate(null)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60">
                <X size={20} />
              </button>
            </div>

            {/* Viewport & Device Toolbar */}
            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              {/* Device Viewport Buttons */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#111111] p-1 rounded-xl border border-black/10 dark:border-white/10">
                <button
                  onClick={() => setQuickPreviewViewport('desktop')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    quickPreviewViewport === 'desktop' ? 'bg-amber-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Monitor size={14} /> Desktop (100%)
                </button>
                <button
                  onClick={() => setQuickPreviewViewport('tablet')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    quickPreviewViewport === 'tablet' ? 'bg-amber-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Tablet size={14} /> Tablet (768px)
                </button>
                <button
                  onClick={() => setQuickPreviewViewport('mobile')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    quickPreviewViewport === 'mobile' ? 'bg-amber-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Smartphone size={14} /> Mobile (375px)
                </button>
              </div>

              {/* Background Canvas Selector */}
              <div className="flex items-center gap-2">
                <span className="text-black/60 dark:text-white/60">Hintergrund:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-[#111111] p-1 rounded-xl border border-black/10 dark:border-white/10">
                  <button
                    onClick={() => setQuickPreviewBg('email')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${quickPreviewBg === 'email' ? 'bg-amber-500 text-white font-bold' : 'text-black/60 dark:text-white/60'}`}
                    title="E-Mail Standard (#f4f6f9)"
                  >
                    E-Mail Grau
                  </button>
                  <button
                    onClick={() => setQuickPreviewBg('light')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${quickPreviewBg === 'light' ? 'bg-amber-500 text-white font-bold' : 'text-black/60 dark:text-white/60'}`}
                    title="Rein Weiß (#ffffff)"
                  >
                    Weiß
                  </button>
                  <button
                    onClick={() => setQuickPreviewBg('dark')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${quickPreviewBg === 'dark' ? 'bg-amber-500 text-white font-bold' : 'text-black/60 dark:text-white/60'}`}
                    title="Dunkler Canvas (#0f172a)"
                  >
                    Dunkel
                  </button>
                  <button
                    onClick={() => setQuickPreviewBg('checker')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${quickPreviewBg === 'checker' ? 'bg-amber-500 text-white font-bold' : 'text-black/60 dark:text-white/60'}`}
                    title="Transparent Grid"
                  >
                    Grid
                  </button>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-black/60 dark:text-white/60">Zoom:</span>
                {[100, 85, 70, 50].map(scale => (
                  <button
                    key={scale}
                    onClick={() => setQuickPreviewScale(scale)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono ${
                      quickPreviewScale === scale ? 'bg-amber-500 text-white font-bold' : 'bg-white dark:bg-[#111111] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {scale}%
                  </button>
                ))}
              </div>
            </div>

            {/* Sandboxed Iframe Container */}
            <div 
              className={`flex-1 overflow-auto p-6 rounded-2xl border border-black/10 dark:border-white/10 flex justify-center items-start min-h-[400px] max-h-[60vh] transition-colors ${
                quickPreviewBg === 'email' ? 'bg-[#f4f6f9]' :
                quickPreviewBg === 'light' ? 'bg-white' :
                quickPreviewBg === 'dark' ? 'bg-[#0f172a]' :
                'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]'
              }`}
            >
              <div 
                className="transition-all duration-300 shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-200"
                style={{
                  width: quickPreviewViewport === 'desktop' ? '100%' : quickPreviewViewport === 'tablet' ? '768px' : '375px',
                  maxWidth: '100%',
                  transform: `scale(${quickPreviewScale / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:0;padding:0;font-family:Arial,sans-serif;}</style></head><body>${quickPreviewTemplate.code}</body></html>`}
                  className="w-full border-none min-h-[500px]"
                  title={`Quick Preview - ${quickPreviewTemplate.title}`}
                />
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleLoadTemplateToActiveFile(quickPreviewTemplate);
                    setQuickPreviewTemplate(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={14} /> In Editor-Datei "{activeFile.name}" laden
                </button>
                <button
                  onClick={() => handleDownloadSingleTemplateHtml(quickPreviewTemplate)}
                  className="px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <FileDown size={14} /> HTML Datei herunterladen
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quickPreviewTemplate.code);
                    alert(`Code von "${quickPreviewTemplate.title}" kopiert!`);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Copy size={14} /> Code kopieren
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditTemplate(quickPreviewTemplate);
                    setQuickPreviewTemplate(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600/25 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Template Bearbeiten
                </button>
                <button
                  onClick={() => setQuickPreviewTemplate(null)}
                  className="px-4 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-black dark:text-white font-bold text-xs"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT TEMPLATE */}
      {isCreateTemplateModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsCreateTemplateModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <h3 className="font-extrabold text-lg text-black dark:text-white">
                {editingTemplate ? `Template "${editingTemplate.title}" bearbeiten` : 'Neues Template / Mailing speichern'}
              </h3>
              <button onClick={() => setIsCreateTemplateModalOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs font-bold text-black/80 dark:text-white/80">
              <div>
                <label className="block mb-1">Titel des Templates *</label>
                <input
                  type="text"
                  value={tplFormTitle}
                  onChange={(e) => setTplFormTitle(e.target.value)}
                  placeholder="z.B. GeVestor SAM Sonderausgabe E-Mail"
                  className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1">Haupt-Kategorie (Typ)</label>
                  <select
                    value={tplFormMainCat}
                    onChange={(e) => setTplFormMainCat(e.target.value)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                  >
                    {customMainCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Sub-Kategorie (Format)</label>
                  <select
                    value={tplFormSubCat}
                    onChange={(e) => setTplFormSubCat(e.target.value)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                  >
                    <optgroup label="Mailings">
                      {customMailingCategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Anzeigen">
                      {customAnzeigeCategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Kunde / Brand</label>
                  <select
                    value={tplFormCustomer}
                    onChange={(e) => setTplFormCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                  >
                    {customCustomersList.map(cust => (
                      <option key={cust} value={cust}>{cust}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Beschreibung</label>
                <input
                  type="text"
                  value={tplFormDesc}
                  onChange={(e) => setTplFormDesc(e.target.value)}
                  placeholder="Kurze Beschreibung des Mailing-Zwecks..."
                  className="w-full px-3.5 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Tags (Komma getrennt)</label>
                <input
                  type="text"
                  value={tplFormTags}
                  onChange={(e) => setTplFormTags(e.target.value)}
                  placeholder="E-Mail, SAM, MSO, Responsive"
                  className="w-full px-3.5 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Template HTML / CSS Code *</label>
                <textarea
                  rows={8}
                  value={tplFormCode}
                  onChange={(e) => setTplFormCode(e.target.value)}
                  placeholder="<!-- HTML / CSS Code hier einfügen -->"
                  className="w-full p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 hover:bg-black/5"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveTemplateSubmit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Speichern &amp; Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM CATEGORY / CUSTOMER */}
      {isAddMetaModalOpen && (
        <div 
          className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsAddMetaModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-black dark:text-white">
                Neue Kategorie oder Kunde hinzufügen
              </h3>
              <button onClick={() => setIsAddMetaModalOpen(false)} className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs font-bold text-black/80 dark:text-white/80">
              <div>
                <label className="block mb-1">Typ auswählen:</label>
                <select
                  value={metaTypeToAdd}
                  onChange={(e: any) => setMetaTypeToAdd(e.target.value)}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none"
                >
                  <option value="customer">Neuer Kunde / Brand</option>
                  <option value="subCatMailing">Neue Mailing Sub-Kategorie (z.B. Liftletter)</option>
                  <option value="subCatAnzeige">Neue Anzeigen Sub-Kategorie (z.B. Redlink)</option>
                  <option value="mainCat">Neue Haupt-Kategorie (z.B. Newsletter)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Name / Bezeichnung *</label>
                <input
                  type="text"
                  value={newMetaValueInput}
                  onChange={(e) => setNewMetaValueInput(e.target.value)}
                  placeholder="z.B. Aktien-Kompass oder Videoanzeige"
                  className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddMetaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddMetaSubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTINGS & NATIVE AI ECOSYSTEM */}
      {isSettingsModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-black dark:text-white leading-tight">
                    Studio &amp; Nativ AI Ecosystem Einstellungen
                  </h3>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Anpassung von Editor-Themes, KI-Assistenten &amp; systemweiten Tool-Verbindungen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2 bg-black/2 dark:bg-white/2 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setSettingsTab('editor')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'editor'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Palette size={14} /> Editor &amp; Prettifier
              </button>
              <button
                onClick={() => setSettingsTab('ai')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'ai'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Bot size={14} /> Nativ AI &amp; Advisor
              </button>
              <button
                onClick={() => setSettingsTab('automation')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'automation'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Workflow size={14} /> Automation Rules
              </button>
              <button
                onClick={() => setSettingsTab('cmd')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'cmd'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Command size={14} /> KI Command Palette (Ctrl+K)
              </button>
              <button
                onClick={() => setSettingsTab('tools')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'tools'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Network size={14} /> Inter-Tool Connectivity
              </button>
              <button
                onClick={() => setSettingsTab('export')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                  settingsTab === 'export'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1A1A1A]'
                    : 'border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <Sliders size={14} /> Preferences
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              {/* TAB 1: EDITOR & PRETTIFIER */}
              {settingsTab === 'editor' && (
                <div className="space-y-5">
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Syntax Highlighting Theme
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'vs-dark', name: '🌙 VS Dark', desc: 'Dunkler Standard mit gewohntem Visual Studio Feeling' },
                        { id: 'vs', name: '☀️ VS Light', desc: 'Heller Modus für Tageslicht & Präsentationen' },
                        { id: 'hc-black', name: '⬛ High Contrast Dark', desc: 'Hoher Kontrast für maximale Lesbarkeit' },
                        { id: 'hc-light', name: '⬜ High Contrast Light', desc: 'Heller hoher Kontrast für optimale A11y' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setEditorTheme(t.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            editorTheme === t.id
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black/80 dark:text-white/80'
                          }`}
                        >
                          <div className="text-xs font-bold mb-1">{t.name}</div>
                          <div className="text-[10px] text-black/50 dark:text-white/50">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-black dark:text-white">Automatische Formatierung (Prettify on Save)</h4>
                        <p className="text-[11px] text-black/50 dark:text-white/50">Wendet beim Speichern &amp; Snapshot automatisch HTML &amp; CSS Beautifier-Regeln an</p>
                      </div>
                      <button
                        onClick={handleBeautifyCode}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Sparkles size={12} /> JETZT FORMATIEREN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NATIVE AI ECOSYSTEM & ADVISOR */}
              {settingsTab === 'ai' && (
                <div className="space-y-5">
                  {/* AI Settings Advisor Banner & Recommendations */}
                  <div className="bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-blue-600/15 p-4 rounded-2xl border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                          <Lightbulb size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-black dark:text-white flex items-center gap-2">
                            <span>AI Settings Advisor</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-mono">
                              {advisorSuggestions.length} Empfehlungen
                            </span>
                          </h4>
                          <p className="text-[10px] text-black/50 dark:text-white/50">
                            Analysiert deine Arbeitsabläufe, MSO-Tabellenstrukturen &amp; Tool-Nutzung
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsAnalyzingSettings(true);
                          setTimeout(() => {
                            setIsAnalyzingSettings(false);
                            setAdvisorLastAnalyzed(new Date().toLocaleTimeString('de-DE'));
                            alert('✓ KI-Analyse abgeschlossen. Konfigurationsempfehlungen wurden aktualisiert.');
                          }, 400);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                      >
                        <Sparkles size={12} className={isAnalyzingSettings ? "animate-spin" : ""} />
                        <span>Neu Analysieren</span>
                      </button>
                    </div>

                    {/* Advisor Recommendations List */}
                    <div className="space-y-2 pt-1">
                      {advisorSuggestions.length === 0 ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2">
                          <ShieldCheck size={16} />
                          <span>Optimal konfiguriert! Keine ausstehenden KI-Empfehlungen für deine aktuellen Vorlagen.</span>
                        </div>
                      ) : (
                        advisorSuggestions.map(adv => (
                          <div
                            key={adv.id}
                            className="p-3 rounded-xl bg-white dark:bg-[#252526] border border-black/10 dark:border-white/10 flex items-start justify-between gap-3 shadow-sm hover:border-purple-500/30 transition-all"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                                  {adv.category}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                                  {adv.confidence}% KI Match
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-black dark:text-white">{adv.title}</h5>
                              <p className="text-[11px] text-black/60 dark:text-white/60 mt-0.5 leading-relaxed">
                                {adv.reasoning}
                              </p>
                            </div>
                            <button
                              onClick={adv.apply}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all shrink-0 active:scale-95"
                            >
                              {adv.actionLabel}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Bot size={16} /> OpenRouter KI Modell für Studio Assistent
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                        openrouter.ai
                      </span>
                    </div>
                    <select
                      value={aiAssistantModel}
                      onChange={(e) => setAiAssistantModel(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#252526] border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="openrouter/auto">⚡ OpenRouter Auto (Standard &amp; Empfohlen)</option>
                      <option value="openrouter/free">🆓 OpenRouter Free (Kostenfrei)</option>
                      <option value="anthropic/claude-3.7-sonnet">🧠 Claude 3.7 Sonnet (Höchste Code-Qualität)</option>
                      <option value="anthropic/claude-3.5-sonnet">🎨 Claude 3.5 Sonnet (HTML &amp; Email Performance)</option>
                      <option value="openai/gpt-4o">🚀 OpenAI GPT-4o (High Speed Multimodal)</option>
                      <option value="google/gemini-2.0-flash-001">✨ Gemini 2.0 Flash (Super Schnell)</option>
                      <option value="deepseek/deepseek-r1">🧪 DeepSeek R1 (Deep Reasoning)</option>
                      <option value="meta-llama/llama-3.3-70b-instruct">🦙 Llama 3.3 70B Instruct</option>
                    </select>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-black dark:text-white">Auto-Fix A11y &amp; SEO Optimierung</h4>
                        <p className="text-[11px] text-black/50 dark:text-white/50">Ergänzt automatisch fehlende alt-Attribute, defer-Skripte und OpenGraph Meta Tags</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoFixOnSave}
                        onChange={(e) => setAutoFixOnSave(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: AUTOMATION RULES & TRIGGER FLOWS */}
              {settingsTab === 'automation' && (
                <div className="space-y-5">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-blue-600/15 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
                        <Workflow size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-black dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Automatisierte Trigger-Action Flows</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                            {automationRules.filter(r => r.enabled).length} / {automationRules.length} Aktiv
                          </span>
                        </h4>
                        <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed mt-0.5">
                          Definiere automatische Studio-Arbeitsabläufe (z.B. Auto-Backup im Metadata Store bei Vorlagen-Speicherung oder Auto-Formatierung).
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewRuleName('');
                        setNewRuleTrigger('ON_SAVE_TEMPLATE');
                        setNewRuleAction('AUTO_BACKUP_METADATA');
                        setNewRuleDescription('');
                        setIsCreateRuleModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Plus size={14} /> Neue Regel erstellen
                    </button>
                  </div>

                  {/* List of Automation Rules */}
                  <div className="space-y-3">
                    {automationRules.map(rule => (
                      <div
                        key={rule.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                          rule.enabled
                            ? 'bg-white dark:bg-[#252526] border-emerald-500/30 shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => {
                                setAutomationRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-black dark:text-white flex items-center gap-2 flex-wrap">
                                <span>{rule.name}</span>
                                {rule.lastRun && (
                                  <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                                    • Zuletzt ausgeführt: {rule.lastRun}
                                  </span>
                                )}
                              </h5>
                              <p className="text-[11px] text-black/60 dark:text-white/60 mt-0.5">
                                {rule.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                runAutomationTriggers(rule.trigger);
                                alert(`⚡ Trigger '${rule.trigger}' manuell ausgelöst für Rule: ${rule.name}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold text-black/70 dark:text-white/70 transition-all flex items-center gap-1"
                              title="Manuell testen"
                            >
                              <Play size={12} className="text-emerald-500" /> Testen
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Regel "${rule.name}" wirklich löschen?`)) {
                                  setAutomationRules(prev => prev.filter(r => r.id !== rule.id));
                                }
                              }}
                              className="p-1 rounded-lg text-black/40 dark:text-white/40 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Trigger -> Action Visual Flow Diagram */}
                        <div className="flex items-center gap-2 text-[10px] font-mono pt-2 border-t border-black/5 dark:border-white/5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                            ⚡ Trigger: {rule.trigger}
                          </span>
                          <ArrowRight size={12} className="text-black/30 dark:text-white/30" />
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                            🚀 Action: {rule.action}
                          </span>
                          <span className="ml-auto text-black/40 dark:text-white/40 font-semibold">
                            Ausgeführt: {rule.runCount}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: COMMAND PALETTE & ECOSYSTEM HUB */}
              {settingsTab === 'cmd' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-600/15 via-blue-600/10 to-purple-600/15 p-4 rounded-2xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                        <Command size={16} /> Globales KI Command Palette (Ctrl+K)
                      </div>
                      <button
                        onClick={() => {
                          setIsSettingsModalOpen(false);
                          setIsCommandPaletteOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Zap size={13} /> Overlay jetzt öffnen
                      </button>
                    </div>
                    <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">
                      Sucht semantisch über alle Vorlagen, E-Mail Sonderausgaben, Editor-Themes, Snippets, A11y &amp; SEO Inspektoren sowie Entwickler-Dokumentationen.
                    </p>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-black dark:text-white flex items-center justify-between">
                      <span>⚡ Schnellzugriff &amp; Tastenkombinationen</span>
                      <span className="text-[10px] text-black/40 dark:text-white/40 font-mono">Hotkeys</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'Ctrl + K', action: 'Globales KI Command Palette öffnen' },
                        { key: 'Ctrl + S', action: 'Projekt Speichern & Snapshot erstellen' },
                        { key: 'Ctrl + /', action: 'Tastenkombinationen-Übersicht anzeigen' },
                        { key: 'Ctrl + B', action: 'Ansicht umschalten (Split / Visual / Code)' },
                        { key: 'Ctrl + Z', action: 'Rückgängig (Undo)' },
                        { key: 'Ctrl + Y', action: 'Wiederholen (Redo)' },
                        { key: 'Ctrl + Shift + F', action: 'Projektweites Suchen & Ersetzen' }
                      ].map((hk, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#252526] border border-black/10 dark:border-white/10 flex items-center justify-between">
                          <span className="text-[11px] text-black/70 dark:text-white/70 font-sans">{hk.action}</span>
                          <kbd className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px] font-bold text-indigo-500">{hk.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-black dark:text-white">🚀 Vernetzte Ecosystem-Werkzeuge</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {allCommandPaletteItems.filter(i => i.category === 'tools' || i.category === 'templates').slice(0, 8).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setIsSettingsModalOpen(false);
                            item.action();
                          }}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#252526] hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-left transition-all flex flex-col gap-0.5"
                        >
                          <div className="font-bold text-[11px] text-black dark:text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-black/50 dark:text-white/50 truncate">{item.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: INTER-TOOL CONNECTIVITY */}
              {settingsTab === 'tools' && (
                <div className="space-y-4">
                  <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
                    Alle Studio-Werkzeuge sind miteinander vernetzt und tauschen Live-Zustände, Vorlagen und Inspektor-Ergebnisse aus:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: '📑 Templates & Mailings Archiv', desc: 'Speichert Vorlagen mit Metadaten & Tags', action: () => { setIsSettingsModalOpen(false); setIsTemplateStorageModalOpen(true); } },
                      { name: '📦 Component Storage', desc: 'Isolierte HTML/CSS UI Bausteine', action: () => { setIsSettingsModalOpen(false); setRightTab('inspector'); } },
                      { name: '🌐 Dependency Graph & Orphans', desc: 'Visualisiert CSS-Variablen & Verknüpfungen', action: () => { setIsSettingsModalOpen(false); setIsDependencyGraphModalOpen(true); } },
                      { name: '🎨 HSL Theme Palette Generator', desc: 'Farbschemata direkt auf :root übertragen', action: () => { setIsSettingsModalOpen(false); setIsThemePaletteModalOpen(true); } },
                      { name: '⏱️ Snapshot & Version History', desc: 'Local Storage Versionen & Rollbacks', action: () => { setIsSettingsModalOpen(false); setIsVersionHistoryModalOpen(true); } },
                      { name: '📖 Tech-Docs & README Generator', desc: 'Generiert Markdown-Dokumentation', action: () => { setIsSettingsModalOpen(false); setIsDocGenModalOpen(true); } }
                    ].map((tool, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-xs text-black dark:text-white">{tool.name}</h5>
                          <p className="text-[10px] text-black/50 dark:text-white/50">{tool.desc}</p>
                        </div>
                        <button
                          onClick={tool.action}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shadow transition-all"
                        >
                          Öffnen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PREFERENCES */}
              {settingsTab === 'export' && (
                <div className="space-y-4">
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-black dark:text-white">Visual Canvas Raster &amp; Alignment</h4>
                    <p className="text-[11px] text-black/50 dark:text-white/50">Raster-Ausrichtung &amp; Hilfslinien für präzises Drag &amp; Drop Styling</p>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => setIsLayoutDebuggerOpen(!isLayoutDebuggerOpen)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                          isLayoutDebuggerOpen
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 border-black/10 dark:border-white/10'
                        }`}
                      >
                        {isLayoutDebuggerOpen ? 'Layout Grid Aktiv' : 'Grid Overlay Einblenden'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-black/50 dark:text-white/50">
                YES Studio Ecosystem v3.5 • Ready
              </span>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Fertig &amp; Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GLOBAL AI COMMAND PALETTE (Ctrl+K) */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white dark:bg-[#1C1C1E] border border-black/15 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5 relative">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                <Command size={20} />
              </div>
              <input
                type="text"
                autoFocus
                value={commandPaletteQuery}
                onChange={(e) => {
                  setCommandPaletteQuery(e.target.value);
                  setCommandPaletteSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCommandPaletteSelectedIndex(prev => Math.min(prev + 1, filteredCommandPaletteItems.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCommandPaletteSelectedIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCommandPaletteItems[commandPaletteSelectedIndex]) {
                      filteredCommandPaletteItems[commandPaletteSelectedIndex].action();
                    }
                  } else if (e.key === 'Escape') {
                    setIsCommandPaletteOpen(false);
                  }
                }}
                placeholder="🔍 KI-Suche nach Templates, Settings, Tools, Snippets, A11y, Dokus..."
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 text-[10px] font-mono font-bold text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10">
                  ESC zum Schließen
                </kbd>
                <button
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* AI Semantic Insight Banner */}
            {commandPaletteAiInsight && (
              <div className="px-5 py-2.5 bg-gradient-to-r from-purple-600/15 via-blue-600/15 to-indigo-600/15 border-b border-purple-500/20 text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles size={14} className="text-purple-400 shrink-0 animate-pulse" />
                  <span className="truncate">{commandPaletteAiInsight}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold uppercase tracking-wider shrink-0">
                  Semantic Engine
                </span>
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="px-4 py-2 border-b border-black/10 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-black/2 dark:bg-white/2">
              {[
                { id: 'all', label: 'Alle', icon: Zap, count: allCommandPaletteItems.length },
                { id: 'actions', label: 'Aktionen', icon: Sparkles, count: allCommandPaletteItems.filter(i => i.category === 'actions').length },
                { id: 'templates', label: 'Templates', icon: LayoutTemplate, count: allCommandPaletteItems.filter(i => i.category === 'templates').length },
                { id: 'settings', label: 'Settings', icon: Settings, count: allCommandPaletteItems.filter(i => i.category === 'settings').length },
                { id: 'tools', label: 'Tools', icon: Network, count: allCommandPaletteItems.filter(i => i.category === 'tools').length },
                { id: 'docs', label: 'Dokus', icon: BookOpen, count: allCommandPaletteItems.filter(i => i.category === 'docs').length }
              ].map(cat => {
                const IconComponent = cat.icon;
                const isActive = commandPaletteCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCommandPaletteCategory(cat.id);
                      setCommandPaletteSelectedIndex(0);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <IconComponent size={12} />
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Items List */}
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 max-h-[50vh] space-y-1">
              {filteredCommandPaletteItems.length === 0 ? (
                <div className="py-12 text-center text-black/50 dark:text-white/50 space-y-2">
                  <Search size={32} className="mx-auto text-black/30 dark:text-white/30" />
                  <p className="text-sm font-bold">Keine KI-Suchergebnisse für "{commandPaletteQuery}"</p>
                  <p className="text-xs">Versuche Begriffe wie "Template", "Format", "Dark Mode", "ZIP", "A11y" oder "Graph"</p>
                </div>
              ) : (
                filteredCommandPaletteItems.map((item, idx) => {
                  const isSelected = idx === commandPaletteSelectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setCommandPaletteSelectedIndex(idx)}
                      className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/40 text-black dark:text-white shadow-sm transform translate-x-1'
                          : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black/80 dark:text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl text-xs font-bold ${
                          item.category === 'actions' ? 'bg-amber-500/20 text-amber-500' :
                          item.category === 'templates' ? 'bg-purple-500/20 text-purple-400' :
                          item.category === 'settings' ? 'bg-blue-500/20 text-blue-400' :
                          item.category === 'tools' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {item.categoryLabel}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[9px] font-mono text-black/60 dark:text-white/60">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-black/50 dark:text-white/50 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <kbd className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 font-mono text-[10px] font-bold text-black/70 dark:text-white/70 border border-black/10 dark:border-white/10">
                            {item.shortcut}
                          </kbd>
                        )}
                        <ChevronRight size={16} className={`transition-transform ${isSelected ? 'translate-x-1 text-blue-500' : 'opacity-30'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between text-[11px] font-mono text-black/50 dark:text-white/50">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigieren</span>
                <span>↵ Auswählen</span>
                <span>ESC Schließen</span>
              </div>
              <span className="font-bold text-blue-500">
                YES Studio Ecosystem • KI-Match Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZIP LP TREE INSPECTOR & FAKEPATHS */}
      {isZipTreeModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsZipTreeModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#1C1C1E] border border-black/15 dark:border-white/15 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
                  <FolderTree size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-black dark:text-white">ZIP Landing Page Dateibaum &amp; Fakepaths</h3>
                  <p className="text-xs text-black/50 dark:text-white/50">Visualisierung der entpackten Ordnerstruktur mit Server-Pfade</p>
                </div>
              </div>
              <button
                onClick={() => setIsZipTreeModalOpen(false)}
                className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tree Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 dark:text-white/50">Gesamt-Dateien</div>
                <div className="text-lg font-extrabold text-black dark:text-white mt-0.5">{files.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 dark:text-white/50">Gesamt-Größe</div>
                <div className="text-lg font-extrabold text-blue-500 mt-0.5">
                  {formatBytes(files.reduce((acc, f) => acc + (f.size || f.content.length), 0))}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 dark:text-white/50">HTML / CSS / JS</div>
                <div className="text-lg font-extrabold text-emerald-500 mt-0.5">
                  {files.filter((f) => ['html', 'css', 'js'].includes(f.type)).length} Code-Files
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 dark:text-white/50">Bilder &amp; Assets</div>
                <div className="text-lg font-extrabold text-purple-500 mt-0.5">
                  {files.filter((f) => f.type === 'asset' || f.isBinary).length} Assets
                </div>
              </div>
            </div>

            {/* Tree File List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-2 font-mono text-xs">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    setActiveFileId(file.id);
                    setIsZipTreeModalOpen(false);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-[#252528] border border-black/5 dark:border-white/5 hover:border-blue-500/50 cursor-pointer flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode
                      size={16}
                      className={
                        file.type === 'html'
                          ? 'text-amber-500 shrink-0'
                          : file.type === 'css'
                          ? 'text-blue-500 shrink-0'
                          : file.type === 'js'
                          ? 'text-yellow-500 shrink-0'
                          : 'text-purple-500 shrink-0'
                      }
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-black dark:text-white truncate">{file.name}</div>
                      <div className="text-[10px] text-blue-500 dark:text-blue-400 truncate">
                        {file.fakePath || `/${file.folder}/${file.name}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {file.size && <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">{formatBytes(file.size)}</span>}
                    <button className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold">
                      Öffnen
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => zipUploadInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
              >
                <UploadCloud size={14} /> Neue ZIP LP hochladen
              </button>
              <button
                onClick={() => setIsZipTreeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-black dark:text-white text-xs font-bold"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM AUTOMATION RULE */}
      {isCreateRuleModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsCreateRuleModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] border border-black/15 dark:border-white/15 rounded-3xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
                  <Workflow size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-black dark:text-white">Neue Automation Rule definieren</h3>
                  <p className="text-xs text-black/50 dark:text-white/50">Verknüpfe ein Studio-Event mit einer automatischen Aktion</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateRuleModalOpen(false)}
                className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                  Regel-Bezeichnung
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="z.B. Mail-Snapshot vor Export erstellen"
                  className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                  ⚡ Auslösender Trigger
                </label>
                <select
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value as AutomationRule['trigger'])}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black dark:text-white"
                >
                  <option value="ON_SAVE_TEMPLATE">ON_SAVE_TEMPLATE (Beim Speichern im Vorlagen-Archiv)</option>
                  <option value="ON_CODE_SAVE">ON_CODE_SAVE (Beim Speichern/Formatieren von Code)</option>
                  <option value="ON_ZIP_EXPORT">ON_ZIP_EXPORT (Beim ZIP-Export des Projekts)</option>
                  <option value="ON_A11Y_AUDIT">ON_A11Y_AUDIT (Beim Ausführen des Barrierefreiheits-Audits)</option>
                  <option value="ON_LINTER_RUN">ON_LINTER_RUN (Beim Linter/Health Check)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                  🚀 Automatisch auszuführende Aktion
                </label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value as AutomationRule['action'])}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black dark:text-white"
                >
                  <option value="AUTO_BACKUP_METADATA">AUTO_BACKUP_METADATA (Auto-Backup im Metadata Store)</option>
                  <option value="AUTO_FORMAT_CODE">AUTO_FORMAT_CODE (Prettify &amp; HTML/CSS Einrückungen)</option>
                  <option value="AUTO_FIX_A11Y">AUTO_FIX_A11Y (Auto-Fix Alt-Texte &amp; ARIA Attribute)</option>
                  <option value="GENERATE_README_DOC">GENERATE_README_DOC (README.md Tech-Doku generieren)</option>
                  <option value="NOTIFY_STATUS">NOTIFY_STATUS (Status-Benachrichtigung anzeigen)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder="Kurze Notiz zur Funktionsweise..."
                  className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => setIsCreateRuleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (!newRuleName.trim()) {
                    alert('Bitte gib eine Regel-Bezeichnung an.');
                    return;
                  }
                  const createdRule: AutomationRule = {
                    id: `rule-${Date.now()}`,
                    name: newRuleName.trim(),
                    trigger: newRuleTrigger,
                    action: newRuleAction,
                    enabled: true,
                    runCount: 0,
                    description: newRuleDescription.trim() || `Führt ${newRuleAction} aus, wenn ${newRuleTrigger} getriggert wird.`
                  };
                  setAutomationRules(prev => [...prev, createdRule]);
                  setIsCreateRuleModalOpen(false);
                  alert(`✓ Neue Automation Rule "${createdRule.name}" erfolgreich erstellt!`);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Regel Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Right-Click Context Menu Overlay */}
      {contextMenuPosition && (
        <div
          className="fixed inset-0 z-[10000] bg-transparent"
          onClick={() => setContextMenuPosition(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
          }}
        >
          <div
            style={{
              left: Math.min(contextMenuPosition.x, window.innerWidth - 300),
              top: Math.min(contextMenuPosition.y, window.innerHeight - 380)
            }}
            className="fixed w-72 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-black/15 dark:border-white/15 rounded-2xl shadow-2xl p-2 space-y-1 text-xs z-[10001] animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-black/80 dark:text-white/80">
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Zap size={13} className="text-yellow-400 fill-yellow-400" />
                {contextMenuDetails?.elementTag ? `<${contextMenuDetails.elementTag.toLowerCase()}> Smart Actions` : 'Studio Smart Actions'}
              </span>
              <span className="text-[9px] font-mono text-black/40 dark:text-white/40">Context AI</span>
            </div>

            {/* Contextual Smart Actions */}
            <div className="space-y-0.5 pt-1">
              <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-500 font-mono">
                ⚡ KI-Aktionen für aktuellen Kontext
              </div>
              {dynamicSmartActions.slice(0, 4).map(sa => {
                const IconComp = sa.icon;
                return (
                  <button
                    key={sa.id}
                    onClick={() => {
                      setContextMenuPosition(null);
                      sa.action();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300 text-left font-semibold flex items-center justify-between text-black/80 dark:text-white/80 transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <IconComp size={13} className="text-purple-500 shrink-0" />
                      <span className="truncate">{sa.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-500 font-bold">{sa.confidence}%</span>
                  </button>
                );
              })}
            </div>

            <div className="my-1 border-t border-black/10 dark:border-white/10"></div>

            {/* Quick Editor Actions */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  handleBeautifyCode();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center justify-between text-black/80 dark:text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-blue-500" />
                  <span>Code Prettify &amp; Formatieren</span>
                </div>
                <kbd className="text-[9px] font-mono text-black/40 dark:text-white/40">Ctrl+Shift+I</kbd>
              </button>

              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  navigator.clipboard.writeText(activeFile.content);
                  alert('✓ Code in die Zwischenablage kopiert!');
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center justify-between text-black/80 dark:text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Copy size={13} className="text-emerald-500" />
                  <span>Gesamten HTML Code kopieren</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  handleUndo();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center justify-between text-black/80 dark:text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Undo size={13} className="text-amber-500" />
                  <span>Rückgängig (Undo)</span>
                </div>
                <kbd className="text-[9px] font-mono text-black/40 dark:text-white/40">Ctrl+Z</kbd>
              </button>
            </div>

            <div className="my-1 border-t border-black/10 dark:border-white/10"></div>

            {/* Studio Tools & Settings */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  setIsCommandPaletteOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center gap-2 text-black/80 dark:text-white/80"
              >
                <Command size={13} className="text-indigo-500" />
                <span>KI Command Palette (Ctrl+K)</span>
              </button>

              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  setSettingsTab('automation');
                  setIsSettingsModalOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center gap-2 text-black/80 dark:text-white/80"
              >
                <Workflow size={13} className="text-emerald-500" />
                <span>Automation Rules &amp; Triggers</span>
              </button>

              <button
                onClick={() => {
                  setContextMenuPosition(null);
                  setSettingsTab('ai');
                  setIsSettingsModalOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left font-semibold flex items-center gap-2 text-black/80 dark:text-white/80"
              >
                <Settings size={13} className="text-purple-500" />
                <span>AI Settings Advisor öffnen</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WysiwygStudio;
