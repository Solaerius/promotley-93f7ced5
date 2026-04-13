import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpotlightHighlightProps {
  selector: string;
  duration?: number;
  onDismiss?: () => void;
}

const SpotlightHighlight = ({ selector, duration = 3000, onDismiss }: SpotlightHighlightProps) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const measure = useCallback(() => {
    const el = document.querySelector(selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(new DOMRect(r.x - 8, r.y - 8, r.width + 16, r.height + 16));
      setVisible(true);
      return true;
    }
    return false;
  }, [selector]);

  useEffect(() => {
    let attempts = 0;
    const tryFind = () => {
      if (measure()) return;
      attempts++;
      if (attempts < 20) setTimeout(tryFind, 150);
    };
    setTimeout(tryFind, 300);
  }, [measure]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  useEffect(() => {
    if (!visible || !rect) return;
    const handleResize = () => measure();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [visible, rect, measure]);

  return (
    <AnimatePresence>
      {visible && rect && (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => { setVisible(false); onDismiss?.(); }}
        >
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-highlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx={12}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.6)"
              mask="url(#spotlight-highlight-mask)"
            />
          </svg>
          <motion.div
            className="fixed rounded-xl border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)] pointer-events-none"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.3)",
                "0 0 40px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.3)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpotlightHighlight;
