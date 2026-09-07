import * as cheerio from 'cheerio';
import beautify from 'js-beautify';

export interface BrizyAnimation {
  id: string;
  type: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce' | 'pulse' | 'none';
  duration: string;
  delay: string;
  targetTag: string;
  targetContent?: string;
  framerMotionJsx: string;
}

export interface BrizyMultiPageFile {
  filename: string;
  pageTitle: string;
  slug: string;
  originalHtml: string;
  parseResult: BrizyParseResult;
  rewrittenLinksCount: number;
  detectedAnimations: BrizyAnimation[];
}

export interface BrizySitemapEntry {
  title: string;
  slug: string;
  targetFile: string;
  internalLinks: string[];
}

export interface BrizyMultiPageProject {
  pages: BrizyMultiPageFile[];
  sitemap: BrizySitemapEntry[];
  sharedCss: string;
  allAssets: BrizyAsset[];
  totalRewrittenLinks: number;
  totalAnimationsTranspiled: number;
}

export interface BrizyParseOptions {
  customClassMappings?: Record<string, 'hero' | 'header' | 'footer' | 'features' | 'cta' | 'content' | 'gallery' | 'navigation'>;
  resolveAssets?: boolean;
  transpileAnimations?: boolean;
  pageSlugMap?: Record<string, string>;
}

export interface BrizyAsset {
  originalUrl: string;
  localPath: string;
  filename: string;
}

export interface BrizyIRNode {
  id: string;
  type: 'section' | 'container' | 'row' | 'column' | 'heading' | 'text' | 'button' | 'image' | 'wrapper' | 'element';
  semanticRole?: 'hero' | 'header' | 'footer' | 'features' | 'cta' | 'content' | 'gallery' | 'navigation';
  tag: string;
  classes: string[];
  cleanClasses: string[];
  attributes: Record<string, string>;
  inlineStyle?: Record<string, string>;
  content?: string;
  children: BrizyIRNode[];
}

export interface BrizyCssRule {
  selector: string;
  cleanSelector: string;
  declarations: Record<string, string>;
  mediaQuery?: string;
}

export interface BrizyIRTree {
  title: string;
  meta: {
    originalDomCount: number;
    cleanedDomCount: number;
    parsedSectionsCount: number;
    purgedClassesCount: number;
    unwrappedContainersCount: number;
  };
  sections: BrizyIRNode[];
  cssRules: BrizyCssRule[];
  resolvedAssets: BrizyAsset[];
}

export interface BrizyParseResult {
  ir: BrizyIRTree;
  cleanHtml: string;
  cleanCss: string;
  stats: {
    originalDomCount: number;
    cleanedDomCount: number;
    sizeReductionPercent: number;
    purgedClassesCount: number;
    unwrappedContainersCount: number;
    resolvedAssetsCount: number;
  };
}

/**
 * Asset Resolver Module: Identifies remote Brizy images and converts src attributes to local references
 */
export function resolveBrizyAssets(html: string): { resolvedHtml: string; assets: BrizyAsset[] } {
  const $ = cheerio.load(html);
  const assets: BrizyAsset[] = [];
  const urlMap = new Map<string, string>();
  let assetCounter = 1;

  // Process <img> tags
  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.includes('/wp-content/'))) {
      if (!urlMap.has(src)) {
        const urlParts = src.split('?')[0].split('/');
        let rawFilename = urlParts[urlParts.length - 1] || `image-${assetCounter}.png`;
        if (!rawFilename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          rawFilename = `asset-${assetCounter}.png`;
        }
        const filename = `${assetCounter}_${rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
        const localPath = `./assets/images/${filename}`;
        
        urlMap.set(src, localPath);
        assets.push({ originalUrl: src, localPath, filename });
        assetCounter++;
      }
      $img.attr('src', urlMap.get(src)!);
    }
  });

  // Process inline background-image styles
  $('[style*="background-image"]').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';
    const bgMatch = style.match(/background-image\s*:\s*url\((['"]?)([^'"]+)\1\)/i);
    if (bgMatch && bgMatch[2]) {
      const src = bgMatch[2];
      if (src.startsWith('http://') || src.startsWith('https://') || src.includes('/wp-content/')) {
        if (!urlMap.has(src)) {
          const urlParts = src.split('?')[0].split('/');
          let rawFilename = urlParts[urlParts.length - 1] || `image-${assetCounter}.png`;
          if (!rawFilename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            rawFilename = `asset-${assetCounter}.png`;
          }
          const filename = `${assetCounter}_${rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
          const localPath = `./assets/images/${filename}`;
          urlMap.set(src, localPath);
          assets.push({ originalUrl: src, localPath, filename });
          assetCounter++;
        }
        const newStyle = style.replace(src, urlMap.get(src)!);
        $el.attr('style', newStyle);
      }
    }
  });

  return {
    resolvedHtml: $.html(),
    assets,
  };
}

/**
 * 1. DOM Traverser & IR Tree Generator for Brizy HTML
 */
export function parseBrizyToIR(
  htmlInput: string,
  rawCssInputs: string[] = [],
  options: BrizyParseOptions = {}
): BrizyParseResult {
  // Step 0: Resolve assets if enabled
  const { resolvedHtml, assets } = resolveBrizyAssets(htmlInput);
  const htmlToParse = options.resolveAssets !== false ? resolvedHtml : htmlInput;

  const $ = cheerio.load(htmlToParse);
  const originalDomCount = $('*').length;

  let purgedClassesCount = 0;
  let unwrappedContainersCount = 0;

  // Extract page title
  const title = $('title').text().trim() || 'Migrated Brizy Landing Page';

  // Extract raw CSS from embedded <style> tags
  const embeddedCssList: string[] = [];
  $('style').each((_, el) => {
    embeddedCssList.push($(el).html() || '');
  });
  $('style').remove();
  $('script').remove();

  // Combine embedded and raw CSS inputs
  const allCssText = [...embeddedCssList, ...rawCssInputs].join('\n');

  // Class Map for brz-css-xxx -> .clean-style-x
  const cssClassMap = new Map<string, string>();

  // Find all .brz-section elements (or fallback to body children if none exist)
  let sectionElements = $('.brz-section').toArray();
  if (sectionElements.length === 0) {
    sectionElements = $('body > div, body > section, body > header, body > footer').toArray();
  }

  const irSections: BrizyIRNode[] = [];

  // Traverse each section and construct IR
  sectionElements.forEach((secEl, secIdx) => {
    const $sec = $(secEl);
    const secNode = traverseElement($sec, $, secIdx, 'section', cssClassMap, (count) => {
      purgedClassesCount += count.classes;
      unwrappedContainersCount += count.unwraps;
    });

    if (secNode) {
      // Determine Semantic Role with custom mappings if provided
      secNode.semanticRole = detectSemanticRole(
        secNode,
        secIdx,
        sectionElements.length,
        options.customClassMappings
      );
      irSections.push(secNode);
    }
  });

  // 2. Refactor and Extract CSS
  let { cleanCssRules, cleanCssOutput } = refactorBrizyCss(allCssText, $, cssClassMap);

  // Append Animation Keyframe Styles if transpiling is enabled
  if (options.transpileAnimations !== false) {
    const { animationCss } = transpileBrizyAnimations(htmlToParse);
    if (animationCss) {
      cleanCssOutput += `\n\n${animationCss}`;
    }
  }

  // 3. Generate Clean HTML5 output from IR
  const cleanBodyHtml = irSections.map((sec) => renderIRNodeToHtml(sec)).join('\n\n');

  const fullCleanHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
${cleanBodyHtml}
</body>
</html>`;

  const formattedHtml = beautify.html(fullCleanHtml, {
    indent_size: 2,
    unformatted: ['code', 'pre', 'em', 'strong', 'span'],
  });

  const cleanedDomCount = (formattedHtml.match(/<[a-z1-6]+/gi) || []).length;
  const originalBytes = new Blob([htmlInput]).size;
  const cleanedBytes = new Blob([formattedHtml]).size;
  const sizeReductionPercent =
    originalBytes > 0 ? Math.max(0, Math.round(((originalBytes - cleanedBytes) / originalBytes) * 100)) : 0;

  const irTree: BrizyIRTree = {
    title,
    meta: {
      originalDomCount,
      cleanedDomCount,
      parsedSectionsCount: irSections.length,
      purgedClassesCount,
      unwrappedContainersCount,
    },
    sections: irSections,
    cssRules: cleanCssRules,
    resolvedAssets: assets,
  };

  return {
    ir: irTree,
    cleanHtml: formattedHtml,
    cleanCss: cleanCssOutput,
    stats: {
      originalDomCount,
      cleanedDomCount,
      sizeReductionPercent,
      purgedClassesCount,
      unwrappedContainersCount,
      resolvedAssetsCount: assets.length,
    },
  };
}

/**
 * Regenerates HTML & CSS Output directly from a modified IR Tree
 */
export function renderIRTreeToOutput(irTree: BrizyIRTree): { cleanHtml: string; cleanCss: string } {
  const cleanBodyHtml = irTree.sections.map((sec) => renderIRNodeToHtml(sec)).join('\n\n');

  const fullCleanHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(irTree.title)}</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
${cleanBodyHtml}
</body>
</html>`;

  const formattedHtml = beautify.html(fullCleanHtml, {
    indent_size: 2,
    unformatted: ['code', 'pre', 'em', 'strong', 'span'],
  });

  let cssOutput = `/* Cleaned & Refactored CSS extracted from Brizy Builder */\n\n`;
  cssOutput += `/* Universal Structural Grid */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 16px;
  padding-right: 16px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -16px;
  margin-right: -16px;
}

.col-12 { flex: 0 0 100%; max-width: 100%; padding: 0 16px; }
.col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 16px; }
.col-4 { flex: 0 0 33.3333%; max-width: 33.3333%; padding: 0 16px; }
.col-3 { flex: 0 0 25%; max-width: 25%; padding: 0 16px; }

.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

`;

  irTree.cssRules.forEach((rule) => {
    cssOutput += `${rule.cleanSelector} {\n`;
    Object.entries(rule.declarations).forEach(([prop, val]) => {
      cssOutput += `  ${prop}: ${val};\n`;
    });
    cssOutput += `}\n\n`;
  });

  return {
    cleanHtml: formattedHtml,
    cleanCss: cssOutput,
  };
}

/**
 * Recursive Element Traverser into IR Node
 */
function traverseElement(
  $el: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
  idx: number,
  parentType: string,
  cssClassMap: Map<string, string>,
  trackCount: (c: { classes: number; unwraps: number }) => void
): BrizyIRNode | null {
  const nodeEl = $el.get(0);
  if (!nodeEl || nodeEl.type !== 'tag') return null;

  const tagName = nodeEl.tagName.toLowerCase();
  const rawClasses = ($el.attr('class') || '').split(/\s+/).filter(Boolean);

  // Identify Brizy structural node type
  let type: BrizyIRNode['type'] = 'element';
  if (rawClasses.some((c) => c.includes('brz-section'))) type = 'section';
  else if (rawClasses.some((c) => c.includes('brz-container'))) type = 'container';
  else if (rawClasses.some((c) => c.includes('brz-row'))) type = 'row';
  else if (rawClasses.some((c) => c.includes('brz-column') || c.includes('brz-col'))) type = 'column';
  else if (rawClasses.some((c) => c.includes('brz-wrapper'))) type = 'wrapper';
  else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) type = 'heading';
  else if (tagName === 'a' || rawClasses.some((c) => c.includes('brz-btn'))) type = 'button';
  else if (tagName === 'img' || rawClasses.some((c) => c.includes('brz-image'))) type = 'image';
  else if (tagName === 'p' || rawClasses.some((c) => c.includes('brz-text'))) type = 'text';

  // Process & Purge Classes
  const cleanClasses: string[] = [];
  let purgedCount = 0;

  rawClasses.forEach((cls) => {
    if (cls.startsWith('brz-css-')) {
      const cleanCls = cssClassMap.get(cls) || `style-${cssClassMap.size + 1}`;
      cssClassMap.set(cls, cleanCls);
      cleanClasses.push(cleanCls);
    } else if (
      cls === 'brz-section' ||
      cls === 'brz-section__content' ||
      cls === 'brz-container' ||
      cls === 'brz-row' ||
      cls === 'brz-column' ||
      cls === 'brz-wrapper' ||
      cls === 'brz-wrapper-inner' ||
      cls === 'brz-column__content' ||
      cls === 'brz-text' ||
      cls === 'brz-text__content' ||
      cls.startsWith('brz-reset')
    ) {
      purgedCount++;
      if (cls === 'brz-container') cleanClasses.push('container');
      if (cls === 'brz-row') cleanClasses.push('row');
      if (cls === 'brz-btn' || cls === 'brz-button') cleanClasses.push('btn');
    } else if (cls.startsWith('brz-col-')) {
      const colNum = cls.replace(/brz-col-(lg|md|sm)-/, '');
      cleanClasses.push(`col-${colNum}`);
    } else if (!cls.startsWith('brz-')) {
      cleanClasses.push(cls);
    } else {
      purgedCount++;
    }
  });

  // Collect clean attributes
  const attributes: Record<string, string> = {};
  const rawAttrs = $el.attr() || {};
  Object.entries(rawAttrs).forEach(([attr, val]) => {
    if (
      !attr.startsWith('data-brz') &&
      !attr.startsWith('data-uid') &&
      !attr.startsWith('data-node') &&
      attr !== 'data-id' &&
      attr !== 'class' &&
      attr !== 'style'
    ) {
      attributes[attr] = val;
    }
  });

  // Handle inline styles
  let inlineStyle: Record<string, string> | undefined;
  const styleAttr = $el.attr('style');
  if (styleAttr) {
    inlineStyle = parseInlineStyle(styleAttr);
  }

  // Traverse Children
  const children: BrizyIRNode[] = [];
  let unwrapsCount = 0;

  $el.children().each((_, child) => {
    const $child = $(child);
    const childClasses = ($child.attr('class') || '').split(/\s+/);

    // Un-wrap pass-through containers (.brz-wrapper, .brz-column__content)
    const isPassThroughWrapper =
      childClasses.some(
        (c) =>
          c === 'brz-wrapper' ||
          c === 'brz-wrapper-inner' ||
          c === 'brz-column__content' ||
          c === 'brz-section__content'
      ) && $child.children().length > 0;

    if (isPassThroughWrapper) {
      unwrapsCount++;
      $child.children().each((_, subChild) => {
        const subNode = traverseElement($(subChild), $, idx, type, cssClassMap, trackCount);
        if (subNode) children.push(subNode);
      });
    } else {
      const childNode = traverseElement($child, $, idx, type, cssClassMap, trackCount);
      if (childNode) children.push(childNode);
    }
  });

  trackCount({ classes: purgedCount, unwraps: unwrapsCount });

  // Extract direct text content if it's a leaf node or heading/text
  let content: string | undefined;
  if (['heading', 'text', 'button'].includes(type) || children.length === 0) {
    content = $el.clone().children().remove().end().text().trim() || $el.text().trim();
  }

  return {
    id: `node-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    tag: tagName,
    classes: rawClasses,
    cleanClasses: Array.from(new Set(cleanClasses)),
    attributes,
    inlineStyle,
    content: content || undefined,
    children,
  };
}

/**
 * Heuristic for detecting semantic section role (hero, header, features, footer, cta, content)
 */
function detectSemanticRole(
  node: BrizyIRNode,
  secIdx: number,
  totalSections: number,
  customClassMappings?: Record<string, 'hero' | 'header' | 'footer' | 'features' | 'cta' | 'content' | 'gallery' | 'navigation'>
): BrizyIRNode['semanticRole'] {
  // Check custom class mappings first if provided (matches classes, tag, or data-attributes)
  if (customClassMappings) {
    const attrValues = Object.values(node.attributes).join(' ').toLowerCase();
    for (const [classPattern, role] of Object.entries(customClassMappings)) {
      const lowerPattern = classPattern.toLowerCase();
      if (
        node.classes.some((c) => c.toLowerCase().includes(lowerPattern)) ||
        node.cleanClasses.some((c) => c.toLowerCase().includes(lowerPattern)) ||
        node.tag.toLowerCase() === lowerPattern ||
        attrValues.includes(lowerPattern)
      ) {
        return role;
      }
    }
  }

  const allText = JSON.stringify(node).toLowerCase();

  if (secIdx === 0 && (allText.includes('header') || allText.includes('logo') || allText.includes('nav'))) {
    return 'header';
  }
  if (secIdx === 0 || secIdx === 1) {
    if (allText.includes('willkommen') || allText.includes('hero') || node.children.some((c) => c.type === 'heading')) {
      return 'hero';
    }
  }
  if (secIdx === totalSections - 1 || allText.includes('copyright') || allText.includes('footer')) {
    return 'footer';
  }
  if (allText.includes('feature') || allText.includes('vorteile') || node.children.length >= 3) {
    return 'features';
  }
  if (allText.includes('jetzt') || allText.includes('kontakt') || allText.includes('buchen') || allText.includes('cta')) {
    return 'cta';
  }
  return 'content';
}

/**
 * 2. CSS Extraction & Refactoring Module
 */
export function refactorBrizyCss(
  rawCss: string,
  $: cheerio.CheerioAPI,
  cssClassMap: Map<string, string>
): { cleanCssRules: BrizyCssRule[]; cleanCssOutput: string } {
  const cleanRules: BrizyCssRule[] = [];

  // Parse CSS rules using regex matching
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(rawCss)) !== null) {
    const rawSelector = match[1].trim();
    const declsString = match[2].trim();

    if (!rawSelector || !declsString) continue;

    // Filter declarations
    const declarations: Record<string, string> = {};
    declsString.split(';').forEach((pair) => {
      const colonIdx = pair.indexOf(':');
      if (colonIdx !== -1) {
        const prop = pair.substring(0, colonIdx).trim().toLowerCase();
        const val = pair.substring(colonIdx + 1).trim();
        if (prop && val && !prop.startsWith('-webkit-') && !prop.startsWith('-moz-')) {
          declarations[prop] = val;
        }
      }
    });

    if (Object.keys(declarations).length === 0) continue;

    // Refactor selector by replacing brz-css-xxx with clean mapped names
    let cleanSelector = rawSelector;
    cssClassMap.forEach((cleanName, origName) => {
      const reg = new RegExp(`\\.${origName}\\b`, 'g');
      cleanSelector = cleanSelector.replace(reg, `.${cleanName}`);
    });

    // Remove remaining .brz-* prefixes if purely builder layout
    cleanSelector = cleanSelector
      .replace(/\.brz-section\b/g, 'section')
      .replace(/\.brz-container\b/g, '.container')
      .replace(/\.brz-row\b/g, '.row')
      .replace(/\.brz-column\b/g, '.col')
      .replace(/\.brz-wrapper\b/g, '');

    cleanSelector = cleanSelector.trim();
    if (cleanSelector) {
      cleanRules.push({
        selector: rawSelector,
        cleanSelector,
        declarations,
      });
    }
  }

  // Construct Clean CSS Output
  let cssOutput = `/* Cleaned & Refactored CSS extracted from Brizy Builder */\n\n`;

  cssOutput += `/* Universal Structural Grid */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 16px;
  padding-right: 16px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -16px;
  margin-right: -16px;
}

.col-12 { flex: 0 0 100%; max-width: 100%; padding: 0 16px; }
.col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 16px; }
.col-4 { flex: 0 0 33.3333%; max-width: 33.3333%; padding: 0 16px; }
.col-3 { flex: 0 0 25%; max-width: 25%; padding: 0 16px; }

.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

`;

  cleanRules.forEach((rule) => {
    cssOutput += `${rule.cleanSelector} {\n`;
    Object.entries(rule.declarations).forEach(([prop, val]) => {
      cssOutput += `  ${prop}: ${val};\n`;
    });
    cssOutput += `}\n\n`;
  });

  return {
    cleanCssRules: cleanRules,
    cleanCssOutput: cssOutput,
  };
}

/**
 * 3. Render IR Node back to Clean Semantic HTML5
 */
function renderIRNodeToHtml(node: BrizyIRNode): string {
  // Determine HTML Tag
  let tag = node.tag;
  if (node.type === 'section') {
    if (node.semanticRole === 'header') tag = 'header';
    else if (node.semanticRole === 'footer') tag = 'footer';
    else tag = 'section';
  }

  const classAttr = node.cleanClasses.length > 0 ? ` class="${node.cleanClasses.join(' ')}"` : '';

  const otherAttrs = Object.entries(node.attributes)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(' ');
  const attrString = otherAttrs ? ` ${otherAttrs}` : '';

  // Render Children
  const innerHtml = node.children.map((child) => renderIRNodeToHtml(child)).join('\n');
  const textContent = node.content ? escapeXml(node.content) : '';

  const bodyContent = innerHtml || textContent;

  if (['img', 'hr', 'br', 'input'].includes(tag)) {
    return `<${tag}${classAttr}${attrString} />`;
  }

  return `<${tag}${classAttr}${attrString}>${bodyContent}</${tag}>`;
}

function parseInlineStyle(styleString: string): Record<string, string> {
  const result: Record<string, string> = {};
  styleString.split(';').forEach((pair) => {
    const colon = pair.indexOf(':');
    if (colon !== -1) {
      const p = pair.substring(0, colon).trim().toLowerCase();
      const v = pair.substring(colon + 1).trim();
      if (p && v) result[p] = v;
    }
  });
  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Transpiles Brizy Scroll Animations (data-brz-animate) to native CSS Keyframes & IntersectionObserver
 */
export function transpileBrizyAnimations(htmlInput: string): {
  cleanHtml: string;
  animations: BrizyAnimation[];
  animationCss: string;
} {
  const $ = cheerio.load(htmlInput);
  const animations: BrizyAnimation[] = [];
  let animCounter = 1;

  $('[data-brz-animate], [class*="brz-animate-"], [class*="fadeIn"], [class*="slideIn"], [class*="zoomIn"]').each((_, el) => {
    const $el = $(el);
    const rawAnim = $el.attr('data-brz-animate') || $el.attr('class') || '';
    const rawDur = $el.attr('data-brz-anim-duration') || '0.8s';
    const rawDelay = $el.attr('data-brz-anim-delay') || '0.1s';

    let animType: BrizyAnimation['type'] = 'fade-in';
    const lower = rawAnim.toLowerCase();

    if (lower.includes('slideup') || lower.includes('fadeinup') || lower.includes('slide-up')) animType = 'slide-up';
    else if (lower.includes('slideleft') || lower.includes('fadeinleft') || lower.includes('slide-left')) animType = 'slide-left';
    else if (lower.includes('slideright') || lower.includes('fadeinright') || lower.includes('slide-right')) animType = 'slide-right';
    else if (lower.includes('zoomin') || lower.includes('zoom-in')) animType = 'zoom-in';
    else if (lower.includes('bounce')) animType = 'bounce';
    else if (lower.includes('pulse')) animType = 'pulse';
    else animType = 'fade-in';

    const duration = rawDur.endsWith('s') || rawDur.endsWith('ms') ? rawDur : `${rawDur}s`;
    const delay = rawDelay.endsWith('s') || rawDelay.endsWith('ms') ? rawDelay : `${rawDelay}s`;

    // Clean up old attributes and classes
    $el.removeAttr('data-brz-animate');
    $el.removeAttr('data-brz-anim-duration');
    $el.removeAttr('data-brz-anim-delay');
    $el.removeAttr('data-brz-anim-repeat');

    const cleanClasses = ($el.attr('class') || '')
      .split(/\s+/)
      .filter((c) => !c.startsWith('brz-animate-') && !c.includes('fadeIn') && !c.includes('slideIn'))
      .join(' ');

    if (cleanClasses) $el.attr('class', cleanClasses);
    else $el.removeAttr('class');

    // Attach lightweight data attributes for native CSS IntersectionObserver
    $el.attr('data-anim', animType);
    $el.attr('style', `--anim-dur: ${duration}; --anim-delay: ${delay}; ${$el.attr('style') || ''}`);

    const tag = el.type === 'tag' ? el.tagName.toLowerCase() : 'div';
    const content = $el.text().trim().substring(0, 30) || 'Animated Component';

    // Build Framer Motion JSX Snippet
    const durNum = parseFloat(duration) || 0.8;
    const delayNum = parseFloat(delay) || 0.1;
    let initialProps = '{ opacity: 0 }';
    let animateProps = '{ opacity: 1 }';

    if (animType === 'slide-up') {
      initialProps = '{ opacity: 0, y: 35 }';
      animateProps = '{ opacity: 1, y: 0 }';
    } else if (animType === 'slide-left') {
      initialProps = '{ opacity: 0, x: -40 }';
      animateProps = '{ opacity: 1, x: 0 }';
    } else if (animType === 'slide-right') {
      initialProps = '{ opacity: 0, x: 40 }';
      animateProps = '{ opacity: 1, x: 0 }';
    } else if (animType === 'zoom-in') {
      initialProps = '{ opacity: 0, scale: 0.85 }';
      animateProps = '{ opacity: 1, scale: 1 }';
    }

    const framerMotionJsx = `<motion.div
  initial=${initialProps}
  whileInView=${animateProps}
  transition={{ duration: ${durNum}, delay: ${delayNum} }}
  viewport={{ once: true }}
>
  <${tag}>${escapeXml(content)}...</${tag}>
</motion.div>`;

    animations.push({
      id: `anim-${animCounter++}`,
      type: animType,
      duration,
      delay,
      targetTag: tag,
      targetContent: content,
      framerMotionJsx,
    });
  });

  // Inject lightweight IntersectionObserver Script
  if ($('script#brizy-anim-engine').length === 0 && animations.length > 0) {
    const script = `<script id="brizy-anim-engine">
document.addEventListener('DOMContentLoaded', function() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-animated');
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-anim]').forEach(function(el) { obs.observe(el); });
});
</script>`;
    $('body').append(script);
  }

  const animationCss = `/* Transpiled Brizy Motion & Scroll Animation Keyframes */
[data-anim] {
  opacity: 0;
  transition: opacity var(--anim-dur, 0.8s) ease-out var(--anim-delay, 0s),
              transform var(--anim-dur, 0.8s) ease-out var(--anim-delay, 0s);
  will-change: opacity, transform;
}

[data-anim="fade-in"].is-animated { opacity: 1; }

[data-anim="slide-up"] { transform: translateY(35px); }
[data-anim="slide-up"].is-animated { opacity: 1; transform: translateY(0); }

[data-anim="slide-left"] { transform: translateX(-40px); }
[data-anim="slide-left"].is-animated { opacity: 1; transform: translateX(0); }

[data-anim="slide-right"] { transform: translateX(40px); }
[data-anim="slide-right"].is-animated { opacity: 1; transform: translateX(0); }

[data-anim="zoom-in"] { transform: scale(0.85); }
[data-anim="zoom-in"].is-animated { opacity: 1; transform: scale(1); }

[data-anim="bounce"] { transform: translateY(20px); }
[data-anim="bounce"].is-animated {
  opacity: 1;
  animation: brzBounce var(--anim-dur, 0.8s) ease-in-out var(--anim-delay, 0s) forwards;
}

@keyframes brzBounce {
  0% { transform: translateY(20px); opacity: 0; }
  50% { transform: translateY(-8px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}

[data-anim="pulse"].is-animated {
  opacity: 1;
  animation: brzPulse 1.5s infinite ease-in-out;
}

@keyframes brzPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
`;

  return {
    cleanHtml: $.html(),
    animations,
    animationCss,
  };
}

/**
 * Internal Link Rewriter Module: Converts WordPress/Brizy permalinks to clean relative HTML links
 */
export function rewriteBrizyInternalLinks(
  htmlInput: string,
  pageSlugMap?: Record<string, string>
): { rewrittenHtml: string; rewrittenCount: number } {
  const $ = cheerio.load(htmlInput);
  let rewrittenCount = 0;

  $('a[href]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href) return;

    // Skip external links, mailto, tel, anchor hashes, javascript
    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      (href.startsWith('http') && !href.includes('localhost') && !href.includes('wp-') && !href.includes('.local') && !href.includes('brizy'))
    ) {
      return;
    }

    // Rewrite internal WordPress/Brizy permalinks
    let targetFile: string | undefined;

    // Check explicit page slug map first
    if (pageSlugMap) {
      for (const [slugPattern, fileName] of Object.entries(pageSlugMap)) {
        if (href.endsWith(slugPattern) || href.includes(slugPattern)) {
          targetFile = fileName;
          break;
        }
      }
    }

    // Heuristic slug rewriting fallback if no explicit map match
    if (!targetFile) {
      if (href === '/' || href.endsWith('/#') || href === '#') {
        targetFile = 'index.html';
      } else {
        const cleanHref = href.split('?')[0].split('#')[0];
        const parts = cleanHref.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];

        if (lastPart && !lastPart.includes('.')) {
          targetFile = `${lastPart.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.html`;
        }
      }
    }

    if (targetFile && targetFile !== href) {
      $a.attr('href', targetFile);
      rewrittenCount++;
    }
  });

  return {
    rewrittenHtml: $.html(),
    rewrittenCount,
  };
}

/**
 * Multi-Page & Sitemap Batch Migrator: Parses entire ZIP website archives
 */
export function parseBrizyMultiPageZip(
  htmlFilesMap: Record<string, string>,
  rawCssInputs: string[] = [],
  options: BrizyParseOptions = {}
): BrizyMultiPageProject {
  const pageFiles = Object.keys(htmlFilesMap).filter((f) => f.endsWith('.html') && !f.startsWith('__MACOSX'));

  // 1. Build initial Page Slug Map
  const pageSlugMap: Record<string, string> = {};
  pageFiles.forEach((file) => {
    const baseName = file.split('/').pop() || file;
    const slugName = baseName.replace(/\.html$/i, '');
    pageSlugMap[`/${slugName}`] = baseName;
    pageSlugMap[`/${slugName}/`] = baseName;
    if (baseName === 'index.html') {
      pageSlugMap['/'] = 'index.html';
    }
  });

  const mergedOptions: BrizyParseOptions = {
    ...options,
    pageSlugMap,
    transpileAnimations: true,
  };

  const pages: BrizyMultiPageFile[] = [];
  const sitemap: BrizySitemapEntry[] = [];
  const allAssets: BrizyAsset[] = [];
  let totalRewrittenLinks = 0;
  let totalAnimationsTranspiled = 0;

  const aggregatedCssRules: BrizyCssRule[] = [];

  pageFiles.forEach((filename) => {
    const originalHtml = htmlFilesMap[filename];
    const parseResult = parseBrizyToIR(originalHtml, rawCssInputs, mergedOptions);

    // Run Link Rewriting
    const { rewrittenHtml, rewrittenCount } = rewriteBrizyInternalLinks(parseResult.cleanHtml, pageSlugMap);
    parseResult.cleanHtml = rewrittenHtml;

    // Run Animation Transpiling
    const { cleanHtml: animHtml, animations } = transpileBrizyAnimations(parseResult.cleanHtml);
    parseResult.cleanHtml = animHtml;

    totalRewrittenLinks += rewrittenCount;
    totalAnimationsTranspiled += animations.length;

    // Collect Assets
    if (parseResult.ir.resolvedAssets) {
      parseResult.ir.resolvedAssets.forEach((ast) => {
        if (!allAssets.some((a) => a.filename === ast.filename)) {
          allAssets.push(ast);
        }
      });
    }

    // Collect CSS Rules
    parseResult.ir.cssRules.forEach((rule) => {
      if (!aggregatedCssRules.some((r) => r.cleanSelector === rule.cleanSelector)) {
        aggregatedCssRules.push(rule);
      }
    });

    const slug = filename === 'index.html' ? '/' : `/${filename.replace('.html', '')}`;

    pages.push({
      filename,
      pageTitle: parseResult.ir.title,
      slug,
      originalHtml,
      parseResult,
      rewrittenLinksCount: rewrittenCount,
      detectedAnimations: animations,
    });

    sitemap.push({
      title: parseResult.ir.title,
      slug,
      targetFile: filename,
      internalLinks: Object.values(pageSlugMap),
    });
  });

  // Re-render Unified Global CSS
  const dummyIrTree: BrizyIRTree = {
    title: 'Shared CSS',
    meta: {
      originalDomCount: 0,
      cleanedDomCount: 0,
      parsedSectionsCount: 0,
      purgedClassesCount: 0,
      unwrappedContainersCount: 0,
    },
    sections: [],
    cssRules: aggregatedCssRules,
    resolvedAssets: allAssets,
  };

  const { cleanCss: sharedCss } = renderIRTreeToOutput(dummyIrTree);

  return {
    pages,
    sitemap,
    sharedCss,
    allAssets,
    totalRewrittenLinks,
    totalAnimationsTranspiled,
  };
}
