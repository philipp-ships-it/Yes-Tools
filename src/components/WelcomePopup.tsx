import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Cpu, Zap, Wand2 } from 'lucide-react';

export const WelcomePopup: React.FC = () => {
  const [isDismissed, setIsDismissed] = useLocalStorage('yes-tools-v2-welcome-dismissed', false);
  const [isVisible, setIsVisible] = useState(!isDismissed);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isVisible) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      setIsDismissed(true);
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#FAFAFA] dark:bg-[#111111] rounded-2xl shadow-2xl overflow-hidden max-w-[900px] w-full flex flex-col max-h-[90vh]"
        >
          <div className="w-full relative bg-black">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/studio-9373604763-307d1.firebasestorage.app/o/xlpm.de%2Fyes-tools.webp?alt=media&token=9127c698-4b77-4432-b763-4783215af91a" 
              alt="Welcome to 2.0" 
              className="w-full h-auto max-h-[300px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] dark:from-[#111111] to-transparent h-16 top-auto bottom-0"></div>
          </div>
          
          <div className="px-8 pb-6 pt-2 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
                Willkommen bei 2.0
              </h2>
              <p className="mt-2 text-black/60 dark:text-white/60 text-lg">
                Eine neue Ära der Produktivität. Intelligenter, schneller und tiefer integriert.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto w-full">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Cpu className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-black dark:text-white text-lg">Native KI-Integration</h3>
                  <p className="text-black/70 dark:text-white/70">
                    Unsere YES KI ist nun tief in alle Tools integriert. Sie sieht, woran du arbeitest, und kann Werkzeuge wie HTML-Formatierung, Textvergleich oder Base64-Encoding völlig autonom für dich bedienen. Ein echter Co-Pilot.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Wand2 className="text-purple-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-black dark:text-white text-lg">Headless Architektur</h3>
                  <p className="text-black/70 dark:text-white/70">
                    Wir haben die UI strikt von der Logik getrennt. Die Core-Engine ist pfeilschnell und erlaubt es der KI, als unsichtbares "zweites Frontend" direkt mit deinen Daten zu arbeiten.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Zap className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-black dark:text-white text-lg">Shy Tool & Globale Shortcuts</h3>
                  <p className="text-black/70 dark:text-white/70">
                    Entdecke unser neues Shy Tool für smarte Typografie und Silbentrennung. Arbeite nahtlos mit globalen Shortcuts (z.B. Strg+Enter) und genieße eine Performance, die begeistert.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/10 dark:border-white/10">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)} 
                  />
                  <div className="w-5 h-5 rounded border border-black/20 dark:border-white/20 peer-checked:bg-black dark:peer-checked:bg-white peer-checked:border-black dark:peer-checked:border-white flex items-center justify-center transition-colors">
                    <CheckCircle2 className="w-3 h-3 text-white dark:text-black opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <span className="text-sm font-medium text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors">Nicht mehr anzeigen</span>
              </label>

              <button 
                onClick={handleClose}
                className="bg-black text-white dark:bg-white dark:text-black px-8 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Jetzt loslegen
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
