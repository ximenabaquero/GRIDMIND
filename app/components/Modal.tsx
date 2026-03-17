"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Close on Escape + focus trap
  useEffect(() => {
    if (!open) return;
    // Focus first focusable element when modal opens
    const panel = panelRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    if (panel) {
      panel.querySelector<HTMLElement>(focusableSelector)?.focus();
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const p = panelRef.current;
      if (!p) return;
      const focusables = Array.from(p.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragSnapToOrigin
            dragMomentum={false}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
            className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
          >
            {/* Swipe-down handle pill — mobile only, initiates drag */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex justify-center pb-1 sm:hidden touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="w-8 h-1 rounded-full bg-white/25" />
            </div>
            <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-2xl overflow-hidden">
              {title && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">{title}</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-white/8 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
