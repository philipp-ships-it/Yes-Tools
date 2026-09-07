import { html as beautifyHtml } from 'js-beautify';

/**
 * Enhanced HTML Beautifier with specialized support for Outlook/MSO conditional comments.
 * Ensures MSO conditionals and inner tables/markup are cleanly formatted and indented.
 */

export interface MsoFormatterOptions {
  indent_size?: number;
  wrap_line_length?: number;
  preserve_newlines?: boolean;
}

export function formatMsoHtml(htmlInput: string, options: MsoFormatterOptions = {}): string {
  if (!htmlInput || typeof htmlInput !== 'string') return '';

  const indentSize = options.indent_size ?? 2;
  const indentChar = ' '.repeat(indentSize);

  // Step 1: Ensure MSO opening and closing comments are placed on their own lines
  let prepped = htmlInput
    .replace(/(<!--\[if\s+[^\]]+\]>)/gi, '\n$1\n')
    .replace(/(<!\[endif\]-->)/gi, '\n$1\n');

  // Collapse multiple empty lines created by regex prep
  prepped = prepped.replace(/\n\s*\n/g, '\n');

  // Step 2: Use js-beautify to format the overall HTML document structure
  let beautified = '';
  try {
    beautified = beautifyHtml(prepped, {
      indent_size: indentSize,
      wrap_line_length: options.wrap_line_length ?? 0,
      preserve_newlines: options.preserve_newlines ?? true,
      extra_liners: [],
      content_unformatted: [],
    });
  } catch (e) {
    console.warn('js-beautify warning in msoFormatter:', e);
    beautified = prepped;
  }

  // Step 3: Re-align indentation specifically for MSO conditional comment blocks
  // to ensure inner tags inside <!--[if mso | IE]> ... <![endif]--> are properly indented
  const lines = beautified.split('\n');
  const result: string[] = [];
  let msoLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (options.preserve_newlines ?? true) {
        result.push('');
      }
      continue;
    }

    // Check if line contains MSO start
    if (/^<!--\[if\s+[^\]]+\]>$/i.test(trimmed)) {
      const currentIndent = rawLine.substring(0, rawLine.indexOf('<!--'));
      result.push(currentIndent + trimmed);
      msoLevel++;
      continue;
    }

    // Check if line contains MSO end
    if (/^<!\[endif\]-->$/i.test(trimmed)) {
      msoLevel = Math.max(0, msoLevel - 1);
      // Align <![endif]--> with the opening comment level
      const matchLeading = rawLine.match(/^(\s*)/);
      let currentIndent = matchLeading ? matchLeading[1] : '';
      if (currentIndent.length >= indentSize) {
        currentIndent = currentIndent.substring(indentSize);
      }
      result.push(currentIndent + trimmed);
      continue;
    }

    // Normal line inside or outside MSO
    if (msoLevel > 0) {
      // If line inside MSO comment isn't already indented relative to MSO start, add one level of indent
      const leadingSpace = rawLine.match(/^(\s*)/)?.[1] || '';
      result.push(indentChar + leadingSpace + trimmed);
    } else {
      result.push(rawLine);
    }
  }

  return result.join('\n');
}
