import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Tambah Portal

interface TutorialProps {
  isOpen: boolean;
  targetId: string;
  text: string;
  title?: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TutorialOverlay = ({ 
  isOpen, 
  targetId, 
  text, 
  title = "Petunjuk Guild Master", 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip 
}: TutorialProps) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updatePosition = () => {
    const element = document.getElementById(targetId);
    if (element) {
      setRect(element.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updatePosition, 150);
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isOpen, targetId, currentStep]);

  if (!isOpen || !rect) return null;

  const p = 8; 
  const isSidebar = targetId === "sidebar-container";
  
  // LOGIKA POSISI BARU AGAR TIDAK TENGGELAM
  const tooltipWidth = 300;
  const isFarRight = rect.right > window.innerWidth - tooltipWidth;
  const isBottomTarget = rect.bottom > window.innerHeight - 200;

  // Horizontal Position
  let tooltipLeft = rect.left;
  if (isSidebar) {
    tooltipLeft = rect.right + 25;
  } else if (isFarRight) {
    // Kalau target di kanan, geser tooltip ke kiri supaya nggak kepotong
    tooltipLeft = rect.right - tooltipWidth;
  } else {
    tooltipLeft = Math.max(20, rect.left);
  }

  // Vertical Position
  let tooltipTop = isSidebar ? rect.top + 100 : rect.bottom + 25;
  if (isBottomTarget && !isSidebar) {
    tooltipTop = rect.top - 220; // Pindah ke atas kalau target mepet bawah
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          style={{
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              ${rect.left - p}px ${rect.top - p}px, 
              ${rect.right + p}px ${rect.top - p}px, 
              ${rect.right + p}px ${rect.bottom + p}px, 
              ${rect.left - p}px ${rect.bottom + p}px,
              ${rect.left - p}px ${rect.top - p}px
            )`
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-gold/50 rounded-lg shadow-[0_0_30px_rgba(212,175,55,0.6)]"
            style={{
              top: rect.top - p,
              left: rect.left - p,
              width: rect.width + (p * 2),
              height: rect.height + (p * 2),
            }}
          />
        </motion.div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute pointer-events-auto bg-[#fdf2d9] border-2 border-[#8b5a2b] p-5 rounded shadow-[0_0_40px_rgba(0,0,0,0.5)] w-[300px]"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
          }}
        >
          {/* Segitiga Penunjuk (Disesuaikan posisinya) */}
          {!isSidebar && (
            <div 
              className={`absolute w-5 h-5 bg-[#fdf2d9] border-[#8b5a2b] rotate-45 ${
                isBottomTarget ? "-bottom-2.5 border-b-2 border-r-2" : "-top-2.5 border-t-2 border-l-2"
              }`} 
              style={{ left: isFarRight ? '85%' : '10%' }}
            />
          )}

          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#8b5a2b]" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#8b5a2b]" />

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-[#5d4037] font-heading text-sm flex items-center gap-2">
              📖 {title}
            </h4>
            <span className="text-[10px] font-bold text-[#8b5a2b] bg-[#8b5a2b]/10 px-1.5 py-0.5 rounded">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>

          <p className="text-[#795548] font-body text-xs leading-relaxed mb-6 italic">
            "{text}"
          </p>

          <div className="flex justify-between items-center">
            <button 
              onClick={onSkip} 
              className="text-[10px] text-[#8b5a2b]/60 hover:text-[#5d4037] font-bold uppercase tracking-tighter"
            >
              Skip
            </button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={onPrev}
                  className="border border-[#8b5a2b] text-[#8b5a2b] px-3 py-1 rounded font-heading text-[10px] hover:bg-[#8b5a2b]/5 transition-all"
                >
                  Kembali
                </button>
              )}
              <button 
                onClick={onNext} 
                className="bg-[#8b5a2b] text-[#fdf2d9] px-4 py-1.5 rounded font-heading text-[10px] hover:bg-[#5d4037] transition-colors shadow-md"
              >
                {currentStep === totalSteps - 1 ? "Selesai" : "Lanjut"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body // Injeksi ke Body
  );
};