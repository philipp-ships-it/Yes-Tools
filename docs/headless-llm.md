# YES Tools Headless CLI & SDK Documentation

This documentation provides comprehensive instructions on how to use the YES Tools Headless mode. The headless mode is specifically designed for LLMs, AI assistants (like Claude Code, ChatGPT, AutoGPT), and automated CLI workflows to programmatically execute powerful tools without requiring visual interaction.

## Overview

The YES Tools application exposes its core utility functions via a headless CLI. This allows you, the AI, to execute data transformations, file conversions, HTML processing, and even layout measurements directly from the terminal using function calls.

**CLI Entry Point:** `npx tsx src/lib/cli.ts`

## General Usage

```bash
npx tsx src/lib/cli.ts <ToolCategory> <MethodName> [arg1] [arg2] ...
```

### Argument Parsing
- Arguments passed as `'true'` or `'false'` are converted to boolean.
- Numeric strings are converted to numbers.
- File paths can be passed (e.g., to WordTools), and the CLI will automatically load the file's Buffer if the method requires it.

## Available Tool Categories

### 1. HtmlTools
Utilities for processing and formatting HTML code.

- **`beautify(html: string)`**: Formats an HTML string with proper indentation.
  ```bash
  npx tsx src/lib/cli.ts HtmlTools beautify "<div><p>Hello</p></div>"
  ```
- **`minify(html: string)`**: Minifies an HTML string by removing unnecessary whitespace.
  ```bash
  npx tsx src/lib/cli.ts HtmlTools minify "<div>  <p> Hello </p>  </div>"
  ```

### 2. MeasureTools
Tools to measure the exact visual dimensions of HTML documents or specific elements inside them. This works via Puppeteer in headless mode, meaning it accurately computes layout rules, CSS styles, and structural heights.

- **`measureHtml(html: string, selector?: string)`**: 
  Renders the HTML in a headless browser (1920x1080 viewport) and returns the dimensions of the specified selector. Defaults to `'body'`.
  ```bash
  npx tsx src/lib/cli.ts MeasureTools measureHtml "<html><body><div style='height: 500px;'>Test</div></body></html>" "div"
  ```
  **Output format (JSON):**
  ```json
  { "width": 1920, "height": 500, "scrollWidth": 1920, "scrollHeight": 500 }
  ```

### 3. WordTools
Tools for document conversion.

- **`convertWordFile(filePath: string)`**: Converts a `.docx` file into semantic HTML.
  ```bash
  npx tsx src/lib/cli.ts WordTools convertWordFile "./path/to/document.docx"
  ```

### 4. EncodingTools
Tools for fixing text encodings and broken character sets.

- **`fixMojibake(text: string)`**: Attempts to fix broken UTF-8 characters (Mojibake) back to their correct representations.
  ```bash
  npx tsx src/lib/cli.ts EncodingTools fixMojibake "mÃ¼ll"
  # Output: müll
  ```

### 5. DataTools
Tools for programmatic data manipulation.

- **`transformJSON(jsonStr: string, mapFnStr: string)`**: Applies a JavaScript transformation function to a JSON string.
  ```bash
  npx tsx src/lib/cli.ts DataTools transformJSON '[{"a":1}]' 'item => ({b: item.a})'
  # Output: [ { "b": 1 } ]
  ```

### 6. SvgTools
Tools for SVG optimization.

- **`optimizeSvg(svg: string, removeComments: boolean, minify: boolean)`**: Cleans and optimizes an SVG string.
  ```bash
  npx tsx src/lib/cli.ts SvgTools optimizeSvg "<svg><!-- comment --></svg>" true true
  ```

## Working in Browser vs. CLI

All these tools are isomorphic. They are exported under `src/lib/headless.ts`.
- **In-App (Browser):** The tools rely on browser native APIs (like `Canvas` for Image processing, or `iframe` injection for HTML measurement). They are available globally at `window.AiNative`.
- **CLI (Node.js):** The tools dynamically adapt to use Node.js equivalents. For example, `MeasureTools.measureHtml` dynamically requires `puppeteer` when run from the terminal to spin up a headless browser and compute the layout.

## AI Assistant Best Practices

When you (the AI) are asked to perform a complex transformation (like fixing 100 broken German texts, or converting a Word file to perfectly semantic HTML, or measuring exactly how tall an element renders):

1. **Do not write custom python scripts** unless necessary. Use the pre-built headless CLI.
2. **Execute via `run_command`**: Send the command and read the output.
3. For file processing, read the file, pass it to the CLI, and write the output back.
4. **Use `MeasureTools`** to verify CSS implementations. If you write HTML/CSS and need to ensure the container perfectly fits its content, inject the HTML into `MeasureTools.measureHtml` and read the exact `scrollHeight`.
