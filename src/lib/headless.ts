import beautify from 'js-beautify';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { formatMsoHtml } from '../utils/msoFormatter';

export const HtmlTools = {
    beautify: (html: string) => formatMsoHtml(html, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true }),
    minify: (html: string) => html.replace(/\s+/g, ' ').replace(/> </g, '><').trim(),
};

export const WordTools = {
    convertWordFile: async (fileOrBuffer: any) => {
        let arrayBuffer;
        if (typeof window !== 'undefined' && fileOrBuffer instanceof File) {
            arrayBuffer = await fileOrBuffer.arrayBuffer();
        } else if (fileOrBuffer.arrayBuffer) {
             arrayBuffer = await fileOrBuffer.arrayBuffer();
        } else {
            arrayBuffer = fileOrBuffer; // Assume it's an ArrayBuffer or Node Buffer
        }
        
        const mammothOpts = (typeof Buffer !== 'undefined' && Buffer.isBuffer(arrayBuffer)) ? { buffer: arrayBuffer } : { arrayBuffer: arrayBuffer };
        const result = await mammoth.convertToHtml(mammothOpts);
        return result.value;
    },
    extractImagesFromWord: async (fileOrBuffer: any) => {
        let arrayBuffer: ArrayBuffer;
        if (typeof window !== 'undefined' && fileOrBuffer instanceof File) {
            arrayBuffer = await fileOrBuffer.arrayBuffer();
        } else if (fileOrBuffer.arrayBuffer) {
            arrayBuffer = await fileOrBuffer.arrayBuffer();
        } else {
            arrayBuffer = fileOrBuffer;
        }

        const zip = await JSZip.loadAsync(arrayBuffer);
        const images: { name: string; blob: Blob; url: string; size: number; extension: string }[] = [];

        const mediaFolder = zip.folder('word/media');
        if (mediaFolder) {
            const files = Object.keys(mediaFolder.files);
            for (const filename of files) {
                const zipObj = mediaFolder.files[filename];
                if (!zipObj.dir) {
                    const blob = await zipObj.async('blob');
                    const cleanName = filename.replace('word/media/', '');
                    const ext = cleanName.split('.').pop()?.toLowerCase() || 'png';
                    const url = URL.createObjectURL(blob);
                    images.push({
                        name: cleanName,
                        blob,
                        url,
                        size: blob.size,
                        extension: ext
                    });
                }
            }
        }
        return images;
    }
};

export const ImageTools = {
    processImage: async (fileOrDataUrl: any, options: { 
       format?: string, quality?: number, maxWidth?: number, upscaleFactor?: number, 
       watermark?: { type: 'text'|'image', text?: string, imageSrc?: string, color?: string, position?: 'center'|'bottom-right' } 
    }) => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                return reject(new Error("ImageTools.processImage requires a browser environment with Canvas support. Cannot run in headless CLI."));
            }

            const format = options.format || 'image/webp';
            const quality = options.quality || 80;
            const upscaleFactor = options.upscaleFactor || 1;
            const watermark = options.watermark;

            const processSrc = (src: string) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('No canvas context'));

                    let width = img.width;
                    let height = img.height;

                    if (options.maxWidth && options.maxWidth > 0 && width > options.maxWidth) {
                        const ratio = options.maxWidth / width;
                        width = options.maxWidth;
                        height = height * ratio;
                    }

                    width = width * upscaleFactor;
                    height = height * upscaleFactor;

                    canvas.width = width;
                    canvas.height = height;

                    if (upscaleFactor > 1) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);

                    if (watermark?.type === 'text' && watermark.text) {
                        ctx.font = `${Math.max(20, width * 0.05)}px sans-serif`;
                        ctx.fillStyle = watermark.color || 'rgba(255,255,255,0.5)';
                        const textWidth = ctx.measureText(watermark.text).width;
                        let x = width / 2 - textWidth / 2;
                        let y = height / 2;
                        if (watermark.position === 'bottom-right') {
                            x = width - textWidth - (width * 0.05);
                            y = height - (height * 0.05);
                        }
                        ctx.fillText(watermark.text, x, y);
                        resolve(canvas.toDataURL(format, quality / 100));
                    } else if (watermark?.type === 'image' && watermark.imageSrc) {
                        const wmImg = new window.Image();
                        wmImg.onload = () => {
                            const wmWidth = Math.min(width * 0.3, wmImg.width);
                            const wmHeight = wmImg.height * (wmWidth / wmImg.width);
                            let x = width / 2 - wmWidth / 2;
                            let y = height / 2 - wmHeight / 2;
                            if (watermark.position === 'bottom-right') {
                                x = width - wmWidth - (width * 0.05);
                                y = height - wmHeight - (height * 0.05);
                            }
                            ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
                            resolve(canvas.toDataURL(format, quality / 100));
                        };
                        wmImg.onerror = () => resolve(canvas.toDataURL(format, quality / 100));
                        wmImg.src = watermark.imageSrc;
                    } else {
                        resolve(canvas.toDataURL(format, quality / 100));
                    }
                };
                img.onerror = () => reject(new Error('Load error'));
                img.src = src;
            };

            if (typeof fileOrDataUrl === 'string') {
                processSrc(fileOrDataUrl);
            } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
                const reader = new FileReader();
                reader.onload = (e) => processSrc(e.target?.result as string);
                reader.onerror = () => reject(new Error("File read error"));
                reader.readAsDataURL(fileOrDataUrl);
            } else {
                reject(new Error("Unsupported input format for ImageTools.processImage"));
            }
        });
    }
};

export const EncodingTools = {
    fixMojibake: (text: string) => {
        try {
            return decodeURIComponent(escape(text));
        } catch (e) {
            let fixed = text;
            const replacements: Record<string, string> = {
                'Ã¼': 'ü', 'Ã¤': 'ä', 'Ã¶': 'ö', 'ÃŸ': 'ß',
                'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
                'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã': 'í', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã±': 'ñ',
                'â‚¬': '€', 'â„¢': '™', 'â€œ': '“', 'â€': '”', 'â€˜': '‘', 'â€™': '’'
            };
            for (const [bad, good] of Object.entries(replacements)) {
                fixed = fixed.split(bad).join(good);
            }
            return fixed;
        }
    }
};

export const DataTools = {
    transformJSON: (jsonStr: string, mapFn: ((item: any) => any) | string) => {
        try {
            let fn = mapFn;
            if (typeof fn === 'string') {
                // Allows stringified function execution in headless node context
                fn = new Function('item', `return (${fn})(item)`) as (item: any) => any;
            }

            const data = JSON.parse(jsonStr);
            if (Array.isArray(data)) {
                return JSON.stringify(data.map(fn as (item: any) => any), null, 2);
            } else if (typeof data === 'object' && data !== null) {
                return JSON.stringify((fn as (item: any) => any)(data), null, 2);
            }
            return jsonStr;
        } catch(e) {
            return jsonStr;
        }
    }
};

export const SvgTools = {
    optimizeSvg: (svg: string, removeComments = true, minify = false) => {
        let res = svg;
        if (removeComments) {
            res = res.replace(/<!--[\s\S]*?-->/g, '');
        }
        if (minify) {
            res = res.replace(/>\s+</g, '><').replace(/[\r\n]+/g, ' ').trim();
        }
        return res;
    }
};


export const MeasureTools = {
    measureHtml: async (html: string, selector: string = 'body') => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            return new Promise((resolve) => {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.top = '-9999px';
                iframe.style.visibility = 'hidden';
                iframe.style.width = '1920px';
                iframe.style.height = '1080px';
                document.body.appendChild(iframe);
                
                iframe.onload = () => {
                    try {
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!doc) throw new Error("No iframe doc");
                        
                        const el = doc.querySelector(selector) as HTMLElement;
                        if (!el) {
                            resolve(null);
                            return;
                        }
                        
                        const rect = el.getBoundingClientRect();
                        const result = {
                            width: rect.width,
                            height: rect.height,
                            scrollWidth: el.scrollWidth,
                            scrollHeight: el.scrollHeight
                        };
                        
                        document.body.removeChild(iframe);
                        resolve(result);
                    } catch (e) {
                        document.body.removeChild(iframe);
                        resolve(null);
                    }
                };
                
                const doc = iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    doc.write(html);
                    doc.close();
                }
            });
        } else {
            // Headless Node.js mode
            try {
                // Dynamically import puppeteer to not break browser builds
                const pName = 'puppeteer'; const puppeteer = (await import(/* @vite-ignore */ pName)).default;
                const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
                const page = await browser.newPage();
                await page.setViewport({ width: 1920, height: 1080 });
                await page.setContent(html, { waitUntil: 'load' });
                const dimensions = await page.evaluate((sel: string) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const rect = el.getBoundingClientRect();
                    return {
                        width: rect.width,
                        height: rect.height,
                        scrollWidth: el.scrollWidth,
                        scrollHeight: el.scrollHeight
                    };
                }, selector);
                await browser.close();
                return dimensions;
            } catch (e: any) {
                console.error("Puppeteer measurement failed:", e);
                return null;
            }
        }
    }
};

export const AiNative = {
    HtmlTools,
    WordTools,
    ImageTools,
    EncodingTools,
    DataTools,
    SvgTools,
    MeasureTools
};

declare global {
  interface Window {
    AiNative: typeof AiNative;
  }
}

export const initAiNative = () => {
    if (typeof window !== 'undefined') {
        window.AiNative = AiNative;
        console.log("AiNative headless tools initialized on window.AiNative");
    }
};
