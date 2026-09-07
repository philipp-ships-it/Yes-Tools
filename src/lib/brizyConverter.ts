import beautify from 'js-beautify';

export interface BrizyConverterOptions {
  removeWrapperDivs: boolean;
  semanticUpgrade: boolean;
  cleanAttributes: boolean;
  extractStylesToCss: boolean;
  renameClasses: boolean;
  consolidateMediaQueries: boolean;
  cleanAssetPaths: boolean;
}

export interface BrizyConvertResult {
  cleanHtml: string;
  cleanCss: string;
  stats: {
    originalDomCount: number;
    cleanedDomCount: number;
    domReductionPercent: number;
    originalBytes: number;
    cleanedBytes: number;
    sizeReductionPercent: number;
    purgedBrzClassesCount: number;
    removedWrapperDivsCount: number;
    extractedCssRulesCount: number;
  };
  auditLogs: {
    type: 'wrapper_removed' | 'semantic_upgrade' | 'class_purged' | 'css_extracted' | 'path_fixed';
    title: string;
    description: string;
  }[];
}

export const defaultOptions: BrizyConverterOptions = {
  removeWrapperDivs: true,
  semanticUpgrade: true,
  cleanAttributes: true,
  extractStylesToCss: true,
  renameClasses: true,
  consolidateMediaQueries: true,
  cleanAssetPaths: true,
};

/**
 * Deterministic Brizy -> Clean HTML/CSS Transpiler Engine
 */
export function convertBrizyToCleanHtml(
  rawInput: string,
  options: BrizyConverterOptions = defaultOptions
): BrizyConvertResult {
  const auditLogs: BrizyConvertResult['auditLogs'] = [];
  const startTime = performance.now();

  // 1. Initial DOM Parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawInput, 'text/html');

  // Count original nodes
  const allOriginalElements = doc.querySelectorAll('*');
  const originalDomCount = allOriginalElements.length;
  const originalBytes = new Blob([rawInput]).size;

  let purgedBrzClassesCount = 0;
  let removedWrapperDivsCount = 0;
  const extractedCssRulesMap = new Map<string, Map<string, string>>(); // selector -> (prop -> val)
  const mediaQueriesMap = new Map<string, Map<string, Map<string, string>>>(); // media -> (selector -> (prop -> val))

  // 2. Extract embedded <style> tags & inline styles
  const styleElements = doc.querySelectorAll('style');
  styleElements.forEach((styleEl) => {
    const cssText = styleEl.textContent || '';
    parseAndCollectCss(cssText, extractedCssRulesMap, mediaQueriesMap);
    styleEl.remove(); // Remove raw Brizy <style> tags
  });

  // Also remove Brizy JS scripts / link tags if present
  const scripts = doc.querySelectorAll('script');
  scripts.forEach((s) => {
    if (s.src.includes('brizy') || (s.textContent && s.textContent.includes('Brizy'))) {
      s.remove();
    }
  });

  const links = doc.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((l) => {
    if (l.getAttribute('href')?.includes('brizy')) {
      l.remove();
    }
  });

  // 3. Process DOM Tree for Brizy Artifacts
  const rootContainer = doc.body.children.length > 0 ? doc.body : doc.documentElement;

  // Class Name Mapping Table (.brz-css-12345 -> .hero-title)
  const classNameMap = new Map<string, string>();
  let classCounter = 1;

  function generateCleanClassName(originalClass: string, roleHint: string): string {
    if (classNameMap.has(originalClass)) {
      return classNameMap.get(originalClass)!;
    }
    const cleanName = `${roleHint}-${classCounter++}`;
    classNameMap.set(originalClass, cleanName);
    return cleanName;
  }

  // Recursive AST Transformer
  function transformNode(element: Element): void {
    // Process children first (bottom-up transformation)
    const children = Array.from(element.children);
    children.forEach((child) => transformNode(child));

    const tagName = element.tagName.toLowerCase();
    const classList = Array.from(element.classList);
    const hasBrzClass = classList.some((c) => c.startsWith('brz-') || c.startsWith('brz'));

    // Detect Brizy Role
    let roleHint = 'block';
    if (classList.some((c) => c.includes('section'))) roleHint = 'section';
    else if (classList.some((c) => c.includes('header'))) roleHint = 'header';
    else if (classList.some((c) => c.includes('footer'))) roleHint = 'footer';
    else if (classList.some((c) => c.includes('container'))) roleHint = 'container';
    else if (classList.some((c) => c.includes('row'))) roleHint = 'row';
    else if (classList.some((c) => c.includes('col'))) roleHint = 'col';
    else if (classList.some((c) => c.includes('btn') || c.includes('button'))) roleHint = 'btn';
    else if (classList.some((c) => c.includes('text') || c.includes('heading'))) roleHint = 'text';
    else if (classList.some((c) => c.includes('image') || c.includes('img'))) roleHint = 'img';
    else if (classList.some((c) => c.includes('nav') || c.includes('menu'))) roleHint = 'nav';

    // A. Clean Brizy Attributes
    if (options.cleanAttributes) {
      const attrsToRemove: string[] = [];
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (
          attr.name.startsWith('data-brz') ||
          attr.name.startsWith('data-uid') ||
          attr.name.startsWith('data-node') ||
          attr.name === 'data-id'
        ) {
          attrsToRemove.push(attr.name);
        }
      }
      attrsToRemove.forEach((attr) => element.removeAttribute(attr));
    }

    // B. Handle inline styles -> Extract to CSS rules
    if (options.extractStylesToCss && element.hasAttribute('style')) {
      const inlineStyle = element.getAttribute('style') || '';
      if (inlineStyle.trim()) {
        const styleObj = parseCssDeclarations(inlineStyle);
        if (Object.keys(styleObj).length > 0) {
          let targetClass = Array.from(element.classList).find((c) => c.startsWith('brz-css-') || c.startsWith('style-'));
          if (!targetClass) {
            targetClass = `clean-${roleHint}-${classCounter++}`;
            element.classList.add(targetClass);
          }
          const existingProps = extractedCssRulesMap.get(`.${targetClass}`) || new Map<string, string>();
          Object.entries(styleObj).forEach(([prop, val]) => existingProps.set(prop, val));
          extractedCssRulesMap.set(`.${targetClass}`, existingProps);
          element.removeAttribute('style');
        }
      }
    }

    // C. Semantic Tag Upgrades
    if (options.semanticUpgrade && tagName === 'div') {
      let newTag: string | null = null;

      if (classList.some((c) => c.includes('section__header') || c === 'brz-header')) {
        newTag = 'header';
      } else if (classList.some((c) => c.includes('section__footer') || c === 'brz-footer')) {
        newTag = 'footer';
      } else if (classList.some((c) => c.includes('brz-section'))) {
        newTag = 'section';
      } else if (classList.some((c) => c.includes('brz-nav') || c.includes('brz-menu'))) {
        newTag = 'nav';
      } else if (classList.some((c) => c.includes('brz-rich-text') || c.includes('brz-text'))) {
        // Check if contains h1, h2, h3, p
        const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading && element.children.length === 1) {
          // If div.brz-text only contains an h1, we can promote the h1 and replace div
          newTag = heading.tagName.toLowerCase();
          element.innerHTML = heading.innerHTML;
        }
      }

      if (newTag && newTag !== tagName) {
        const newEl = doc.createElement(newTag);
        // Copy attributes
        Array.from(element.attributes).forEach((attr) => newEl.setAttribute(attr.name, attr.value));
        while (element.firstChild) {
          newEl.appendChild(element.firstChild);
        }
        element.parentNode?.replaceChild(newEl, element);
        element = newEl; // update ref
        auditLogs.push({
          type: 'semantic_upgrade',
          title: `DIV zu <${newTag}> konvertiert`,
          description: `Klasse '${classList.join(' ')}' wurde als semantisches HTML5 <${newTag}> Element eingestuft.`,
        });
      }
    }

    // D. Wrapper Removal (Collapse redundant pass-through wrapper divs)
    if (options.removeWrapperDivs && element.tagName.toLowerCase() === 'div') {
      const isPureWrapper =
        classList.some(
          (c) =>
            c === 'brz-wrapper' ||
            c === 'brz-wrapper-inner' ||
            c === 'brz-column__content' ||
            c === 'brz-section__content' ||
            c === 'brz-container__content' ||
            c === 'brz-text__content'
        ) &&
        element.attributes.length <= 2; // only class and maybe style

      if (isPureWrapper && element.parentNode) {
        // Unwrap: Replace wrapper element with its children
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        removedWrapperDivsCount++;
        return; // Node is destroyed, stop further processing
      }
    }

    // E. Class Cleanup & Renaming
    if (options.renameClasses && element.classList.length > 0) {
      const newClasses: string[] = [];
      const currentClasses = Array.from(element.classList);

      currentClasses.forEach((cls) => {
        if (
          cls === 'brz-section' ||
          cls === 'brz-section__content' ||
          cls === 'brz-container' ||
          cls === 'brz-row' ||
          cls === 'brz-column' ||
          cls === 'brz-wrapper' ||
          cls === 'brz-text' ||
          cls === 'brz-rich-text' ||
          cls === 'brz-btn' ||
          cls === 'brz-button' ||
          cls === 'brz-image' ||
          cls.startsWith('brz-reset') ||
          cls.startsWith('brz-d-')
        ) {
          purgedBrzClassesCount++;
          // Map functional layout classes
          if (cls === 'brz-container') newClasses.push('container');
          if (cls === 'brz-row') newClasses.push('row');
          if (cls === 'brz-btn' || cls === 'brz-button') newClasses.push('btn');
        } else if (cls.startsWith('brz-col-lg-') || cls.startsWith('brz-col-md-')) {
          const num = cls.replace(/brz-col-(lg|md|sm)-/, '');
          newClasses.push(`col-${num}`);
        } else if (cls.startsWith('brz-css-')) {
          const cleanName = generateCleanClassName(cls, roleHint);
          newClasses.push(cleanName);

          // Update stylesheet key map
          if (extractedCssRulesMap.has(`.${cls}`)) {
            const rules = extractedCssRulesMap.get(`.${cls}`)!;
            extractedCssRulesMap.delete(`.${cls}`);
            extractedCssRulesMap.set(`.${cleanName}`, rules);
          }
        } else if (!cls.startsWith('brz-')) {
          newClasses.push(cls);
        } else {
          purgedBrzClassesCount++;
        }
      });

      if (newClasses.length > 0) {
        element.className = Array.from(new Set(newClasses)).join(' ');
      } else {
        element.removeAttribute('class');
      }
    }

    // F. Asset Path Cleaning
    if (options.cleanAssetPaths) {
      if (element.tagName.toLowerCase() === 'img' && element.hasAttribute('src')) {
        let src = element.getAttribute('src') || '';
        if (src.includes('/wp-content/uploads/') || src.includes('brizy.cloud')) {
          const filename = src.split('/').pop()?.split('?')[0] || 'image.jpg';
          element.setAttribute('src', `./assets/images/${filename}`);
          auditLogs.push({
            type: 'path_fixed',
            title: `Bildpfad bereinigt`,
            description: `Original '${src}' umgewandelt in './assets/images/${filename}'`,
          });
        }
      }
      if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
        let href = element.getAttribute('href') || '';
        if (href.startsWith('#brz-') || href.includes('javascript:void(0)')) {
          element.setAttribute('href', '#');
        }
      }
    }
  }

  // Execute DOM Transformation
  transformNode(rootContainer);

  // 4. Generate Clean CSS
  let generatedCss = '/* Cleaned & Transpiled Stylesheet from Brizy Export */\n\n';

  // Base layout reset & helper classes if containers/rows/cols exist
  generatedCss += `/* Base Structural Layout Reset */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 15px;
  padding-right: 15px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -15px;
  margin-right: -15px;
}

.col-12 { flex: 0 0 100%; max-width: 100%; padding: 0 15px; }
.col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 15px; }
.col-4 { flex: 0 0 33.3333%; max-width: 33.3333%; padding: 0 15px; }
.col-3 { flex: 0 0 25%; max-width: 25%; padding: 0 15px; }

.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

`;

  // Append Extracted Component Styles
  extractedCssRulesMap.forEach((rules, selector) => {
    if (rules.size > 0) {
      generatedCss += `${selector} {\n`;
      rules.forEach((val, prop) => {
        generatedCss += `  ${prop}: ${val};\n`;
      });
      generatedCss += `}\n\n`;
    }
  });

  // Append Media Queries
  if (options.consolidateMediaQueries) {
    mediaQueriesMap.forEach((selectorsMap, media) => {
      generatedCss += `@media ${media} {\n`;
      selectorsMap.forEach((rules, selector) => {
        // Check if selector was renamed
        const mappedSelector = classNameMap.get(selector.replace('.', ''))
          ? `.${classNameMap.get(selector.replace('.', ''))}`
          : selector;
        if (rules.size > 0) {
          generatedCss += `  ${mappedSelector} {\n`;
          rules.forEach((val, prop) => {
            generatedCss += `    ${prop}: ${val};\n`;
          });
          generatedCss += `  }\n`;
        }
      });
      generatedCss += `}\n\n`;
    });
  }

  // 5. Generate Final HTML Output
  let rawCleanHtml = doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;

  // Wrap in a clean HTML5 boilerplate if it wasn't a full document
  if (!rawInput.toLowerCase().includes('<!doctype html>')) {
    rawCleanHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cleaned Brizy Page</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
${rawCleanHtml}
</body>
</html>`;
  }

  // Beautify HTML
  const formattedHtml = beautify.html(rawCleanHtml, {
    indent_size: 2,
    unformatted: ['code', 'pre', 'em', 'strong', 'span'],
  });

  // Calculate Metrics
  const cleanedDomCount = doc.querySelectorAll('*').length;
  const cleanedBytes = new Blob([formattedHtml]).size;

  const domReductionPercent =
    originalDomCount > 0
      ? Math.max(0, Math.round(((originalDomCount - cleanedDomCount) / originalDomCount) * 100))
      : 0;

  const sizeReductionPercent =
    originalBytes > 0
      ? Math.max(0, Math.round(((originalBytes - cleanedBytes) / originalBytes) * 100))
      : 0;

  return {
    cleanHtml: formattedHtml,
    cleanCss: generatedCss,
    stats: {
      originalDomCount,
      cleanedDomCount,
      domReductionPercent,
      originalBytes,
      cleanedBytes,
      sizeReductionPercent,
      purgedBrzClassesCount,
      removedWrapperDivsCount,
      extractedCssRulesCount: extractedCssRulesMap.size,
    },
    auditLogs,
  };
}

/**
 * Helper: Parse raw CSS string into rules map
 */
function parseAndCollectCss(
  cssText: string,
  rulesMap: Map<string, Map<string, string>>,
  mediaMap: Map<string, Map<string, Map<string, string>>>
): void {
  // Simple CSS Parser for embedded Brizy styles
  const cleanText = cssText.replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments

  // Separate media queries vs standard rules
  const mediaRegex = /@media\s*([^{]+)\{([\s\S]*?\}\s*)\}/gi;
  let match: RegExpExecArray | null;

  while ((match = mediaRegex.exec(cleanText)) !== null) {
    const mediaQuery = match[1].trim();
    const mediaBody = match[2];

    if (!mediaMap.has(mediaQuery)) {
      mediaMap.set(mediaQuery, new Map());
    }
    const currentMediaSelectors = mediaMap.get(mediaQuery)!;
    parseRuleBlock(mediaBody, currentMediaSelectors);
  }

  // Remove media queries to parse remaining global rules
  const globalCss = cleanText.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/gi, '');
  parseRuleBlock(globalCss, rulesMap);
}

function parseRuleBlock(cssBody: string, rulesMap: Map<string, Map<string, string>>): void {
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(cssBody)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();

    if (!selector || !declarations) continue;

    const parsedProps = parseCssDeclarations(declarations);
    if (Object.keys(parsedProps).length > 0) {
      const existingProps = rulesMap.get(selector) || new Map<string, string>();
      Object.entries(parsedProps).forEach(([p, v]) => existingProps.set(p, v));
      rulesMap.set(selector, existingProps);
    }
  }
}

function parseCssDeclarations(declString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = declString.split(';');

  pairs.forEach((pair) => {
    const colonIdx = pair.indexOf(':');
    if (colonIdx !== -1) {
      const prop = pair.substring(0, colonIdx).trim().toLowerCase();
      const val = pair.substring(colonIdx + 1).trim();
      if (prop && val && !prop.startsWith('-webkit-') && !prop.startsWith('-moz-')) {
        result[prop] = val;
      }
    }
  });

  return result;
}
