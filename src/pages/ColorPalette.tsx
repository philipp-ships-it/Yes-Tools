import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';
import { Palette, Copy, Check } from 'lucide-react';

interface ColorSwatch {
  hex: string;
  name: string;
}

export const ColorPalette: React.FC = () => {
  const [baseColor, setBaseColor] = useState('#3b82f6');
  const [copiedHex, setCopiedHex] = useState('');
  
  const [monochromatic, setMonochromatic] = useState<ColorSwatch[]>([]);
  const [analogous, setAnalogous] = useState<ColorSwatch[]>([]);
  const [complementary, setComplementary] = useState<ColorSwatch[]>([]);

  useEffect(() => {
    try {
      // Validate color before generating
      chroma(baseColor);
      
      // Monochromatic (shades from light to dark)
      const monoColors = chroma.scale(['white', baseColor, 'black'])
        .mode('lch').colors(11)
        .slice(1, 10); // get 9 shades, excluding pure white/black typically
        
      setMonochromatic(monoColors.map((hex, i) => ({ hex, name: `${(i+1)*100}` })));

      // Analogous
      const baseLch = chroma(baseColor).lch();
      const analog1 = chroma.lch(baseLch[0], baseLch[1], baseLch[2] - 30).hex();
      const analog2 = chroma.lch(baseLch[0], baseLch[1], baseLch[2] + 30).hex();
      setAnalogous([
        { hex: analog1, name: 'Analogous 1' },
        { hex: baseColor, name: 'Base' },
        { hex: analog2, name: 'Analogous 2' }
      ]);

      // Complementary
      const comp = chroma.lch(baseLch[0], baseLch[1], baseLch[2] + 180).hex();
      setComplementary([
        { hex: baseColor, name: 'Base' },
        { hex: comp, name: 'Complementary' }
      ]);

    } catch (e) {
      // invalid color, just ignore
    }
  }, [baseColor]);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(''), 2000);
  };

  const Swatch = ({ hex, name, small = false }: { hex: string, name: string, small?: boolean }) => {
    const textColor = chroma(hex).luminance() > 0.5 ? '#000000' : '#ffffff';
    return (
      <div 
        onClick={() => copyToClipboard(hex)}
        className={`flex flex-col justify-end p-3 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${small ? 'h-24 rounded-xl' : 'h-32 rounded-2xl'}`}
        style={{ backgroundColor: hex }}
      >
        <div className="flex justify-between items-end w-full">
          <div>
            <div className="text-xs font-semibold opacity-90" style={{ color: textColor }}>{name}</div>
            <div className="text-[10px] font-mono opacity-70" style={{ color: textColor }}>{hex.toUpperCase()}</div>
          </div>
          {copiedHex === hex && <Check size={14} style={{ color: textColor }} />}
        </div>
      </div>
    );
  };

  const getContrast = (bg: string, fg: string) => {
    try {
      return chroma.contrast(bg, fg).toFixed(2);
    } catch {
      return 'N/A';
    }
  };

  const wcagPass = (contrast: number, largeText: boolean = false) => {
    if (largeText) return contrast >= 3.0 ? 'Pass (AA)' : 'Fail';
    return contrast >= 4.5 ? 'Pass (AA)' : 'Fail';
  };

  const baseContrastWhite = getContrast(baseColor, '#ffffff');
  const baseContrastBlack = getContrast(baseColor, '#000000');

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">Smart Color Palette</h1>
          <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">Generate Harmonies &amp; Check Contrast</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-12">
        <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl border border-black/10 dark:border-white/10 shrink-0 shadow-inner"
                style={{ backgroundColor: baseColor }}
              />
              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1">Base Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                  />
                  <input
                    type="text"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-mono text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 w-32 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-black/5 dark:bg-white/5"></div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1">Contrast vs White</div>
                    <div className="font-mono text-lg font-semibold text-tg-light-text dark:text-tg-dark-text">{baseContrastWhite}</div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${parseFloat(baseContrastWhite) >= 4.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {wcagPass(parseFloat(baseContrastWhite))}
                  </div>
               </div>
               <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1">Contrast vs Black</div>
                    <div className="font-mono text-lg font-semibold text-tg-light-text dark:text-tg-dark-text">{baseContrastBlack}</div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${parseFloat(baseContrastBlack) >= 4.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {wcagPass(parseFloat(baseContrastBlack))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider pl-2">Monochromatic Scale (Tailwind style)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {monochromatic.map((swatch, i) => (
              <Swatch key={i} hex={swatch.hex} name={swatch.name} small />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider pl-2">Analogous</h2>
            <div className="grid grid-cols-3 gap-2">
              {analogous.map((swatch, i) => (
                <Swatch key={i} hex={swatch.hex} name={swatch.name} />
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider pl-2">Complementary</h2>
            <div className="grid grid-cols-2 gap-2">
              {complementary.map((swatch, i) => (
                <Swatch key={i} hex={swatch.hex} name={swatch.name} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider pl-2">UI Application Preview</h2>
          <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 space-y-6">
              <h3 className="text-lg font-bold" style={{ color: parseFloat(baseContrastWhite) > parseFloat(baseContrastBlack) ? '#000' : '#fff' }}>
                <span className="text-gray-900 dark:text-gray-100">Dark/Light UI</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl shadow-sm" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                  <div className="font-semibold mb-1">Light Surface</div>
                  <div className="text-sm opacity-80 mb-3">Preview of text and buttons on light background.</div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: baseColor, color: parseFloat(baseContrastWhite) >= 4.5 ? '#ffffff' : '#000000' }}>
                    Primary Action
                  </button>
                </div>
                
                <div className="p-4 rounded-xl shadow-sm" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                  <div className="font-semibold mb-1">Dark Surface</div>
                  <div className="text-sm opacity-80 mb-3">Preview of text and buttons on dark background.</div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: baseColor, color: parseFloat(baseContrastWhite) >= 4.5 ? '#ffffff' : '#000000' }}>
                    Primary Action
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-2xl border border-black/5 dark:border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Components</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#222] rounded-xl border-l-4" style={{ borderColor: baseColor }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${baseColor}20`, color: baseColor }}>
                    <Palette size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Status Active</div>
                    <div className="text-xs text-gray-500">System is operating normally</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: '70%', backgroundColor: baseColor }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">70%</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-md" style={{ backgroundColor: `${baseColor}20`, color: baseColor }}>Tag 1</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-md" style={{ backgroundColor: `${baseColor}20`, color: baseColor }}>Tag 2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
