#!/usr/bin/env node

import { HtmlTools, EncodingTools, DataTools, SvgTools, WordTools, MeasureTools } from './headless.js';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
AiNative Headless CLI

Usage:
  npx tsx src/lib/cli.ts <toolCategory> <method> [args...]

Examples:
  npx tsx src/lib/cli.ts HtmlTools beautify '<html><body>hello</body></html>'
  npx tsx src/lib/cli.ts SvgTools optimizeSvg '<svg>...</svg>' true true
  npx tsx src/lib/cli.ts DataTools transformJSON '[{"a":1}]' 'item => ({b: item.a})'
  npx tsx src/lib/cli.ts EncodingTools fixMojibake 'mÃ¼ll'
  npx tsx src/lib/cli.ts WordTools convertWordFile ./document.docx
`);
    process.exit(0);
}

const [category, method, ...restArgs] = args;

const tools: Record<string, any> = { HtmlTools, EncodingTools, DataTools, SvgTools, WordTools, MeasureTools };

if (!tools[category]) {
    console.error(`Unknown tool category: ${category}`);
    process.exit(1);
}

if (!tools[category][method]) {
    console.error(`Unknown method ${method} in ${category}`);
    process.exit(1);
}

async function run() {
    try {
        let parsedArgs: any[] = restArgs.map(arg => {
            if (arg === 'true') return true;
            if (arg === 'false') return false;
            if (!isNaN(Number(arg)) && arg.trim() !== '') return Number(arg);
            return arg;
        });

        if (category === 'WordTools' && method === 'convertWordFile') {
             const filePath = path.resolve(process.cwd(), parsedArgs[0] as string);
             if (!fs.existsSync(filePath)) {
                 throw new Error(`File not found: ${filePath}`);
             }
             parsedArgs[0] = fs.readFileSync(filePath);
        }

        const result = await tools[category][method](...parsedArgs);
        console.log(result);
    } catch (e: any) {
        console.error(`Error executing ${category}.${method}:`, e.message);
        process.exit(1);
    }
}

run();
