
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Routine {
  id: string;
  text: string;
  time: string; // e.g. "08:00" or "Flexible"
  completed: boolean;
  category: 'meditation' | 'infusion' | 'movement' | 'spiritual' | 'general';
  source?: string; // To track if it came from a specific symptom
}

export interface UserProfile {
  id: string; // Added for Supabase compatibility
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  isPremium: boolean;
  xp: number;
  level: number;
  role?: 'user' | 'admin';
  badges: string[];
  dailyMessageCount: number;
  lastMessageDate: string;
  currentStreak: number;
  longestStreak: number;
  healingMoments: number;
  lastActiveDate: string;
}

export interface SymptomLogEntry {
  id: string;
  date: string;
  symptom_name?: string; // Nombre del síntoma
  intensity: number; // 1 to 10
  duration: string;
  notes: string;
}

export interface SearchResult {
  name: string;
  emotionalMeaning: string;
  conflict: string;
  category: string;
  isFallback?: boolean;
  errorMessage?: string;
}

export interface ConflictItem {
  conflict: string;
  manifestation: string;
}

export interface AromaItem {
  name: string;
  benefit: string;
}

export interface SymptomDetail {
  name: string;
  shortDefinition: string; // Breve descripción para listas/previews

  // The 12 Sacred Pillars (Maestro Prompt)
  zona_detalle: string; // Ubicación y función simbólica
  emociones_detalle: string; // Tríada, conflicto y reencuadre (Markdown)
  frases_tipicas: string[]; // "Me lo trago y sigo"
  ejercicio_conexion: string; // Paso a paso (7-12 min)
  alternativas_fisicas: string; // Movilidad, activación, regulación
  aromaterapia_sahumerios: string; // Aceites y sahumerios con precaución
  remedios_naturales: string; // Infusiones LATAM y hábitos
  angeles_arcangeles: string; // Arcángel, color, ritual
  terapias_holisticas: string; // Terapias complementarias
  meditacion_guiada: string; // Guion de meditación
  recomendaciones_adicionales: string; // Checklist y Red Flags
  rutina_integral: string; // Plan del día (15-25 min)
}
