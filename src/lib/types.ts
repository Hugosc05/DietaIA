export type DayKey =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export type MealKey = 'desayuno' | 'm_manana' | 'comida' | 'cena';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealOption {
  name: string;
  items: string[];
  macros: Macros;
}

export type WeeklyDiet = Record<DayKey, Record<MealKey, [MealOption, MealOption]>>;

export interface Profile {
  id: string;
  edad: number;
  peso_inicial: number;
  altura: number;
  kcal_objetivo: number;
  macros: { proteinas_g: number; carbohidratos_g: number; grasas_g: number };
  restricciones: string[];
  pasos_min: number;
  pasos_max: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  fecha: string;
  desayuno_ok: boolean;
  m_manana_ok: boolean;
  comida_ok: boolean;
  cena_ok: boolean;
  pesas_ok: boolean;
  cardio_ok: boolean;
  desayuno_opcion: 1 | 2 | null;
  m_manana_opcion: 1 | 2 | null;
  comida_opcion: 1 | 2 | null;
  cena_opcion: 1 | 2 | null;
  pasos: number;
  peso_ayunas: number | null;
  notas: string | null;
}

export interface DietOverride {
  id: string;
  user_id: string;
  dia: DayKey;
  comida: MealKey;
  opcion: 1 | 2;
  contenido: MealOption;
}

export interface VisionResult {
  name: string;
  estimated_weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
}

export interface WeeklySummary {
  semana_inicio: string;
  semana_fin: string;
  peso_medio: number | null;
  pasos_totales: number;
  adherencia_dieta_pct: number | null;
  dias_pesas: number;
  dias_cardio: number;
}
