import { html, css, js } from 'js-beautify';

export const HeadlessTools = {
  formatCode: (code: string, language: 'html' | 'css' | 'js') => {
    if (!code) return '';
    try {
      if (language === 'html') {
        return html(code, {
          indent_size: 2,
          wrap_line_length: 120,
          preserve_newlines: true,
          max_preserve_newlines: 2
        });
      } else if (language === 'css') {
        return css(code, {
          indent_size: 2,
          preserve_newlines: true
        });
      } else {
        return js(code, {
          indent_size: 2,
          preserve_newlines: true
        });
      }
    } catch (e) {
      console.error(e);
      return code;
    }
  },

  encodeDecode: (input: string, type: 'base64' | 'url' | 'hex' | 'html', action: 'encode' | 'decode') => {
    if (!input) return '';
    try {
      if (action === 'encode') {
        switch (type) {
          case 'base64': return btoa(unescape(encodeURIComponent(input)));
          case 'url': return encodeURIComponent(input);
          case 'hex': return Array.from(input).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          case 'html': return input.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m as any] || m);
        }
      } else {
        switch (type) {
          case 'base64': return decodeURIComponent(escape(atob(input)));
          case 'url': return decodeURIComponent(input);
          case 'hex': {
            const hexes = input.match(/.{1,2}/g) || [];
            return hexes.map(h => String.fromCharCode(parseInt(h, 16))).join('');
          }
          case 'html': {
            const doc = new DOMParser().parseFromString(input, 'text/html');
            return doc.documentElement.textContent || '';
          }
        }
      }
    } catch (error) {
      console.error(error);
      return 'Error processing input';
    }
    return '';
  },

  smartTypography: (input: string) => {
    let result = input;
    result = result.replace(/(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Dipl\.-Ing\.|Mag\.|B\.A\.|M\.A\.)\s+([A-ZÄÖÜ])/g, '$1&nbsp;$2');
    result = result.replace(/(\d)\s*%/g, '$1&nbsp;%');
    result = result.replace(/(€|\$|£|¥)\s*(\d)/g, '$1&nbsp;$2');
    result = result.replace(/(\d)\s*(€|\$|£|¥)/g, '$1&nbsp;$2');
    result = result.replace(/(\d)\s*(cm|mm|m|km|g|kg|l|ml|mg)\b/g, '$1&nbsp;$2');
    result = result.replace(/z\.\s*B\./g, 'z.&nbsp;B.');
    result = result.replace(/d\.\s*h\./g, 'd.&nbsp;h.');
    result = result.replace(/u\.\s*a\./g, 'u.&nbsp;a.');
    result = result.replace(/i\.\s*d\.\s*R\./g, 'i.&nbsp;d.&nbsp;R.');
    result = result.replace(/(!|\?|:|;)\s+([A-ZÄÖÜ])/g, '$1&nbsp;$2');
    result = result.replace(/»\s*/g, '»');
    result = result.replace(/\s*«/g, '«');
    result = result.replace(/„\s*/g, '„');
    result = result.replace(/\s*“/g, '“');
    result = result.replace(/(\d{1,2})\.\s+(\d{1,2})\.\s+(\d{2,4})/g, '$1.&nbsp;$2.&nbsp;$3');
    return result;
  },

  obfuscateCss: (cssCode: string) => {
    if (!cssCode) return { obfuscatedCss: '', classMap: {} as Record<string, string>, renamedCount: 0 };

    const customClassSet = new Set<string>();
    const ignoredSelectors = new Set([
      'hover', 'focus', 'active', 'disabled', 'visited', 'checked',
      'first-child', 'last-child', 'nth-child', 'before', 'after',
      'root', 'body', 'html', 'dark', 'light', 'media', 'keyframes',
      'font-face', 'supports', 'container', 'layer', 'import', 'charset',
      '0%', '100%', '50%'
    ]);

    const matches = cssCode.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_\-\u00A0-\uFFFF]*)/g);
    for (const m of matches) {
      const cls = m[1];
      if (cls && !cls.startsWith('_') && !ignoredSelectors.has(cls.toLowerCase())) {
        customClassSet.add(cls);
      }
    }

    if (customClassSet.size === 0) {
      return { obfuscatedCss: cssCode, classMap: {}, renamedCount: 0 };
    }

    const usedIds = new Set<string>();
    const classMap: Record<string, string> = {};
    let renamedCount = 0;

    for (const oldCls of customClassSet) {
      let randomNumStr = '';
      do {
        const digits = Math.floor(100000 + Math.random() * 90000000).toString();
        randomNumStr = `_${digits}`;
      } while (usedIds.has(randomNumStr));

      usedIds.add(randomNumStr);
      classMap[oldCls] = randomNumStr;
      renamedCount++;
    }

    // Sort class names by length descending so longer classes (e.g. flip-top) are replaced BEFORE shorter substrings (e.g. top)
    const sortedOldClasses = Object.keys(classMap).sort((a, b) => b.length - a.length);
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let newCss = cssCode;
    for (const oldCls of sortedOldClasses) {
      const newCls = classMap[oldCls];
      const regex = new RegExp(`\\.${escapeRegex(oldCls)}(?![a-zA-Z0-9_\\-\\u00A0-\\uFFFF])`, 'g');
      newCss = newCss.replace(regex, `.${newCls}`);
    }

    return { obfuscatedCss: newCss, classMap, renamedCount };
  }
};
