"use client";
import { motion } from "framer-motion";
import { useUIStore } from "@/app/store/uiStore";
import type { BossResultData } from "@/app/lib/types";

const PARTICLES = Array.from({ length: 8 }, (_, i) => i);

function getTier(pct: number) {
  if (pct >= 100) return { label: "¡Jefe derrotado!", emoji: "💀", color: "#10B981", btnText: "¡Genial! 🎉" };
  if (pct >= 70)  return { label: "¡Jefe herido!", emoji: "🩸", color: "#F59E0B", btnText: "La próxima lo derroto 💪" };
  return           { label: "¡Derrota!", emoji: "😈", color: "#EF4444", btnText: "Entendido 💪" };
}

interface Props {
  data: BossResultData;
}

export function BossResultModal({ data }: Props) {
  const { closeModal } = useUIStore();
  const { pct, doneCells, totalTarget, boss } = data;
  const tier = getTier(pct);
  const isVictory = pct >= 100;
  const isWounded = pct >= 70 && pct < 100;

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      {/* Boss emoji with animation */}
      <div className="relative">
        {isVictory && (
          <>
            {PARTICLES.map((i) => (
              <motion.div
                key={i}
                className="absolute text-sm pointer-events-none"
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((i / PARTICLES.length) * Math.PI * 2) * 48,
                  y: Math.sin((i / PARTICLES.length) * Math.PI * 2) * 48,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                style={{ top: "50%", left: "50%", marginTop: -8, marginLeft: -8 }}
              >
                ⭐
              </motion.div>
            ))}
          </>
        )}
        <motion.div
          className="text-6xl"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={
            isVictory
              ? { scale: [0.5, 1.3, 1], opacity: 1, rotate: [0, -5, 5, 0] }
              : isWounded
              ? { scale: [0.5, 1.15, 1], opacity: 1, x: [0, -4, 4, -4, 0] }
              : { scale: [0.5, 1.1, 1], opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {tier.emoji}
        </motion.div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-xl font-bold" style={{ color: tier.color }}>
          {tier.label}
        </p>
        <p className="text-sm text-text-muted mt-0.5">
          {isVictory
            ? <>Venciste a <span className="text-text-primary font-medium">{boss.name}</span></>
            : isWounded
            ? <><span className="text-text-primary font-medium">{boss.name}</span> escapó malherido</>
            : <><span className="text-text-primary font-medium">{boss.name}</span> sobrevivió esta semana</>
          }
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        className="w-full bg-white/5 rounded-xl p-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex justify-between text-[11px] text-text-muted mb-2">
          <span>Daño infligido</span>
          <span className="tabular-nums font-semibold text-text-primary">
            {doneCells}/{totalTarget} ({pct}%)
          </span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: tier.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Message */}
      <motion.p
        className="text-xs text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isVictory
          ? "¡Semana completada! La revancha llega la próxima semana."
          : "La revancha es la próxima semana. ¡Tú puedes!"}
      </motion.p>

      {/* Close button */}
      <motion.button
        onClick={closeModal}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
        style={{
          backgroundColor: isVictory ? tier.color : `${tier.color}20`,
          color: isVictory ? "#fff" : tier.color,
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileTap={{ scale: 0.97 }}
      >
        {tier.btnText}
      </motion.button>
    </div>
  );
}
