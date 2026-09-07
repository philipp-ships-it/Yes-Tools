import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Code2, Bot, Layers, FileText, Image as ImageIcon, Zap, ArrowRight, SplitSquareHorizontal, Archive, Stamp, Layout, Rocket, Mail, Globe } from 'lucide-react';
import { AIInput } from '@/components/ui/ai-input';
import { WelcomePopup } from '@/components/WelcomePopup';
import { PulsingBorder } from '@paper-design/shaders-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Clock } from 'lucide-react';

const tools = [
  { path: '/brizyconverter', icon: Zap, title: 'Brizy Code Decompiler', desc: 'Refactor bloated Brizy page builder exports into clean, semantic HTML5 & CSS.' },
  { path: '/webextractor', icon: Globe, title: 'Web Extractor Studio', desc: 'Harvest landing pages, extract images to WebP/PNG, rewrite parameters & links, export to HTML/ZIP/MHTML.' },
  { path: '/newsletterstudio', icon: Mail, title: 'Newsletter Studio', desc: 'Bulletproof Outlook MSO email builder, VML buttons, CSS inliner & spam auditor.' },
  { path: '/lp-optimizely', icon: Rocket, title: 'LP-Optimizely', desc: 'Auto-detect max-widths, convert images to WebP with random IDs & purge unused CSS/JS.' },
  { path: '/wysiwygstudio', icon: Layout, title: 'WYSIWYG Web Studio', desc: 'Real-time split-screen HTML/CSS visual canvas & Monaco code editor.' },
  { path: '/htmltools', icon: Code2, title: 'HTML Tools', desc: 'Minify, format & analyze HTML code safely.' },
  { path: '/imagelabeling', icon: Stamp, title: 'Image Labeling Studio', desc: 'Canva-style editor for text/image labels with blending, opacity & Verdana/Arial fonts.' },
  { path: '/componentstorage', icon: Layers, title: 'Component Storage', desc: 'Save reusable code blocks & preview live.' },
  { path: '/wordimageextractor', icon: Archive, title: 'Word Image Extractor', desc: 'Extract all images from Word .docx files as ZIP.' },
  { path: '/wordtohtml', icon: FileText, title: 'Word to HTML', desc: 'Convert Word documents to clean HTML.' },
  { path: '/batch', icon: Layers, title: 'Batch Analyzer', desc: 'Process multiple HTML files in parallel.' },
  { path: '/imagetools', icon: ImageIcon, title: 'Image Tools', desc: 'Optimize, compress, and batch process images.' },
  { path: '/performancetools', icon: Zap, title: 'Performance', desc: 'Run granular performance optimizations.' },
  { path: '/devtools', icon: Code2, title: 'Dev Tools', desc: 'Bulk encoding, decoding, formatters and snippets.' },
  { path: '/shytool', icon: Zap, title: 'Shy Tool', desc: 'Smart typography & syllable break generator.' },
  { path: '/textcompare', icon: SplitSquareHorizontal, title: 'Text Compare', desc: 'Smart side-by-side comparison for values.' },
  { path: '/cocreator', icon: Bot, title: 'YES KI', desc: 'AI-assisted generation and refactoring.' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recentTools] = useLocalStorage<string[]>('recentTools', []);
  const recentToolsList = tools.filter(t => recentTools.includes(t.path)).sort((a, b) => recentTools.indexOf(a.path) - recentTools.indexOf(b.path));

  const handleAISubmit = (val: string) => {
    // Navigate to CoCreator AI with the input prompt (can be extended via state)
    navigate('/cocreator', { state: { initialPrompt: val } });
  };

  return (
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white">
      <WelcomePopup />
      
      {/* Background Breathing Gradients - removed as requested "nüchteres nicht vollton weiß&darkthem nicht vollton black" */}

      <div className="min-h-full w-full flex flex-col items-center p-6 py-12 lg:py-24 relative z-10">
        <div className="w-full max-w-5xl flex flex-col items-center gap-12">
        {/* Header / Hero */}
        <motion.div 
          className="flex flex-col items-center text-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-black dark:text-white">
            <span>YES</span>{' '}
            <span className="text-black/80 dark:text-white/80">
              Tools
            </span>
          </h1>
          <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-2xl leading-relaxed">
            A unified suite designed for speed, intelligence, and beautiful performance. Explore our collection of next-gen web utilities.
          </p>
        </motion.div>

        {/* AI Input for direct YES Tools AI interaction */}
        <motion.div 
          className="w-full max-w-4xl mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AIInput 
            onSubmit={handleAISubmit} 
            placeholder="What do you want to build or analyze?" 
            className="text-2xl"
            minHeight={120}
          />
        </motion.div>

        
        {recentToolsList.length > 0 && (
          <motion.div 
            className="w-full flex flex-col gap-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-black/50 dark:text-white/50 px-2">
              <Clock size={16} />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentToolsList.map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={'recent-'+tool.title}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(tool.path)}
                    className="cursor-pointer bg-white/50 dark:bg-[#1A1A1A]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-[#222] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-black dark:text-white text-sm">{tool.title}</h3>
                      <p className="text-xs text-black/60 dark:text-white/60 truncate max-w-[180px]">{tool.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Tools Grid */}

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0 }
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(tool.path)}
                className="group relative cursor-pointer rounded-[32px] h-full"
              >
                {/* Animated Border breathing wrapper */}
                <div className="absolute -inset-0.5 rounded-[34px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none z-0">
                  <PulsingBorder />
                </div>
                
                <div className="relative h-full bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-[32px] p-6 md:p-8 flex flex-col justify-between gap-4 shadow-sm group-hover:border-transparent transition-colors z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white transition-colors duration-300">
                      <Icon size={24} />
                    </div>
                    <ArrowRight size={16} className="text-black/30 dark:text-white/50 group-hover:text-black dark:group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-black dark:text-white mb-1 md:mb-2">{tool.title}</h3>
                    <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        
      </div>
      </div>
    </div>
  );
};

