import type { Boss } from "@/app/lib/types";

const BOSSES: Boss[] = [
  { name: "El Procrastinador", emoji: "😴", flavor: "Señor del tiempo perdido" },
  { name: "La Distracción",     emoji: "📱", flavor: "Reina del scroll infinito" },
  { name: "El Agotamiento",     emoji: "🧟", flavor: "Drena tu energía lentamente" },
  { name: "La Pereza",          emoji: "🦥", flavor: "Campeón del mañana lo hago" },
  { name: "El Caos",            emoji: "🌪️", flavor: "Todo a la vez, nada terminado" },
  { name: "La Duda",            emoji: "🌫️", flavor: "¿Para qué hacerlo?" },
  { name: "El Perfeccionismo",  emoji: "🔮", flavor: "Si no es perfecto, no empieza" },
  { name: "El Olvido",          emoji: "🧠", flavor: "¿Cuál era el plan?" },
  { name: "La Comodidad",       emoji: "🛋️", flavor: "El sofá siempre llama más fuerte" },
  { name: "El Miedo",           emoji: "👻", flavor: "¿Y si no puedo?" },
];

export function getBossForWeek(weekId: string): Boss {
  const weekNum = parseInt(weekId.split("-W")[1]);
  return BOSSES[weekNum % BOSSES.length];
}
