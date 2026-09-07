import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { HtmlTools } from '../pages/HtmlTools';
import { CoCreator } from '../pages/CoCreator';
import { BatchAnalyzer } from '../pages/BatchAnalyzer';
import { WordToHtml } from '../pages/WordToHtml';
import { ImageTools } from '../pages/ImageTools';
import { PerformanceTools } from '../pages/PerformanceTools';
import { DevTools } from '../pages/DevTools';
import { ShyTool } from '../pages/ShyTool';
import { TextCompare } from '../pages/TextCompare';
import { HandwritingSimulator } from '../pages/HandwritingSimulator';
import { OcrTool } from '../pages/OcrTool';
import { SvgTool } from '../pages/SvgTool';
import { DataTransformer } from '../pages/DataTransformer';
import { ColorPalette } from '../pages/ColorPalette';
import { SmartLinter } from '../pages/SmartLinter';
import { EncodingFixer } from '../pages/EncodingFixer';
import { KazBuilder } from '../pages/KazBuilder';
import { ComponentStorage } from '../pages/ComponentStorage';
import { WordImageExtractor } from '../pages/WordImageExtractor';
import { ImageLabelingStudio } from '../pages/ImageLabelingStudio';
import { WysiwygStudio } from '../pages/WysiwygStudio';
import { LpOptimizely } from '../pages/LpOptimizely';
import { NewsletterStudio } from '../pages/NewsletterStudio';
import { WebExtractorStudio } from '../pages/WebExtractorStudio';
import { BrizyConverter } from '../pages/BrizyConverter';
import { Home } from '../pages/Home';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export const AppRoutes = () => {
  const location = useLocation();
  const [recentTools, setRecentTools] = useLocalStorage<string[]>('recentTools', []);

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/home') {
      setRecentTools((prev: string[]) => {
        const path = location.pathname;
        if (prev[0] === path) return prev; // Already the most recent
        const newTools = prev.filter(p => p !== path);
        newTools.unshift(path);
        return newTools.slice(0, 3);
      });
    }
  }, [location.pathname, setRecentTools]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/htmltools" element={<PageTransition><HtmlTools /></PageTransition>} />
        <Route path="/cocreator" element={<PageTransition><CoCreator /></PageTransition>} />
        <Route path="/batch" element={<PageTransition><BatchAnalyzer /></PageTransition>} />
        <Route path="/wordtohtml" element={<PageTransition><WordToHtml /></PageTransition>} />
        <Route path="/imagetools" element={<PageTransition><ImageTools /></PageTransition>} />
        <Route path="/performancetools" element={<PageTransition><PerformanceTools /></PageTransition>} />
        <Route path="/devtools" element={<PageTransition><DevTools /></PageTransition>} />
        <Route path="/shytool" element={<PageTransition><ShyTool /></PageTransition>} />
        <Route path="/textcompare" element={<PageTransition><TextCompare /></PageTransition>} />
        <Route path="/handwriting" element={<PageTransition><HandwritingSimulator /></PageTransition>} />
        <Route path="/ocr" element={<PageTransition><OcrTool /></PageTransition>} />
        <Route path="/svg" element={<PageTransition><SvgTool /></PageTransition>} />
        <Route path="/datatransformer" element={<PageTransition><DataTransformer /></PageTransition>} />
        <Route path="/colorpalette" element={<PageTransition><ColorPalette /></PageTransition>} />
        <Route path="/smartlinter" element={<PageTransition><SmartLinter /></PageTransition>} />
        <Route path="/encodingfixer" element={<PageTransition><EncodingFixer /></PageTransition>} />
        <Route path="/kazbuilder" element={<PageTransition><KazBuilder /></PageTransition>} />
        <Route path="/componentstorage" element={<PageTransition><ComponentStorage /></PageTransition>} />
        <Route path="/wordimageextractor" element={<PageTransition><WordImageExtractor /></PageTransition>} />
        <Route path="/imagelabeling" element={<PageTransition><ImageLabelingStudio /></PageTransition>} />
        <Route path="/wysiwygstudio" element={<PageTransition><WysiwygStudio /></PageTransition>} />
        <Route path="/lp-optimizely" element={<PageTransition><LpOptimizely /></PageTransition>} />
        <Route path="/newsletterstudio" element={<PageTransition><NewsletterStudio /></PageTransition>} />
        <Route path="/webextractor" element={<PageTransition><WebExtractorStudio /></PageTransition>} />
        <Route path="/brizyconverter" element={<PageTransition><BrizyConverter /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};
