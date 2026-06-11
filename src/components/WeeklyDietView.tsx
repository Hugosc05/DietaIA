'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateTodayLog, getOrCreateTodayLog } from '@/lib/daily-log';
import {
  DAYS,
  DAY_LABELS,
  MEALS,
  MEAL_LABELS,
  WEEKLY_DIET,
  DAILY_TARGETS
} from '@/lib/diet-data';
import type { DailyLog, DayKey, DietOverride, MealKey, MealOption } from '@/lib/types';

const JS_DAY_TO_KEY: DayKey[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado'
];

export default function WeeklyDietView() {
  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState<DayKey>(todayKey);
  const [overrides, setOverrides] = useState<DietOverride[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);

  const loadOverrides = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('diet_overrides').select('*');
    setOverrides((data as DietOverride[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await loadOverrides();
      setTodayLog(await getOrCreateTodayLog());
    })();
  }, [loadOverrides]);

  const resolvedDiet = useMemo(() => {
    const day = WEEKLY_DIET[selectedDay];
    const result: Record<MealKey, [MealOption, MealOption]> = {
      desayuno: [...day.desayuno],
      m_manana: [...day.m_manana],
      comida: [...day.comida],
      cena: [...day.cena]
    };
    for (const ov of overrides) {
      if (ov.dia === selectedDay) {
        result[ov.comida][ov.opcion - 1] = ov.contenido;
      }
    }
    return result;
  }, [selectedDay, overrides]);

  const isToday = selectedDay === todayKey;

  async function markConsumed(meal: MealKey, opcion: 1 | 2) {
    if (!isToday || !todayLog) return;
    const okKey = `${meal}_ok` as keyof DailyLog;
    const opKey = `${meal}_opcion` as keyof DailyLog;
    const alreadySelected = todayLog[opKey] === opcion && todayLog[okKey] === true;
    const patch: Record<string, boolean | number | null> = alreadySelected
      ? { [`${meal}_ok`]: false, [`${meal}_opcion`]: null }
      : { [`${meal}_ok`]: true, [`${meal}_opcion`]: opcion };
    const saved = await updateTodayLog(patch);
    if (saved) setTodayLog(saved);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-white">Dieta semanal</h1>
        <p className="text-sm text-slate-400">
          {DAILY_TARGETS.kcal} kcal/día · {DAILY_TARGETS.protein}P / {DAILY_TARGETS.carbs}C /{' '}
          {DAILY_TARGETS.fat}G · Puré de calabacín como verdura base
        </p>
      </header>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedDay === day
                ? 'bg-accent text-black'
                : 'border border-edge bg-card text-slate-300'
            }`}
          >
            {DAY_LABELS[day].slice(0, 3)}
            {day === todayKey && ' ·'}
          </button>
        ))}
      </div>

      {MEALS.map((meal) => {
        const [opt1, opt2] = resolvedDiet[meal];
        const selectedOption = isToday ? todayLog?.[`${meal}_opcion` as keyof DailyLog] : null;
        const mealDone = isToday ? !!todayLog?.[`${meal}_ok` as keyof DailyLog] : false;

        return (
          <section key={meal} className="rounded-2xl border border-edge bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">{MEAL_LABELS[meal]}</h2>
              <span className="text-xs text-slate-400">
                {opt1.macros.kcal} kcal · {opt1.macros.protein}P/{opt1.macros.carbs}C/
                {opt1.macros.fat}G
              </span>
            </div>
            <div className="space-y-2">
              {[opt1, opt2].map((option, i) => {
                const opcion = (i + 1) as 1 | 2;
                const isSelected = mealDone && selectedOption === opcion;
                return (
                  <button
                    key={opcion}
                    onClick={() => markConsumed(meal, opcion)}
                    disabled={!isToday}
                    className={`w-full rounded-xl border p-3 text-left transition-colors disabled:cursor-default ${
                      isSelected ? 'border-ok/60 bg-ok/10' : 'border-edge bg-base'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-ok' : 'text-white'}`}>
                        Opción {opcion}: {option.name}
                      </p>
                      {isSelected && <span className="text-ok">✓</span>}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {option.items.map((item) => (
                        <li key={item} className="text-xs text-slate-400">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            {!isToday && (
              <p className="mt-2 text-[11px] text-slate-500">
                Solo puedes marcar consumo en el día actual.
              </p>
            )}
          </section>
        );
      })}

      <DietChat onUpdated={loadOverrides} selectedDay={selectedDay} />
    </div>
  );
}

function DietChat({ onUpdated, selectedDay }: { onUpdated: () => void; selectedDay: DayKey }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: message, dia_contexto: selectedDay })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el cambio');
      setFeedback(data.resumen ?? 'Dieta actualizada manteniendo las 1900 kcal.');
      setMessage('');
      onUpdated();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-accent/30 bg-card p-4">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
        Modificar dieta con IA
      </h2>
      <p className="mb-3 text-xs text-slate-400">
        Ej.: «esta semana cambia la ternera del martes por lomo». La IA respeta tus 1900 kcal y
        restricciones.
      </p>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pide un cambio…"
          className="flex-1 rounded-xl border border-edge bg-base px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
        />
        <button
          onClick={send}
          disabled={loading || !message.trim()}
          className="rounded-xl bg-accent px-4 text-sm font-semibold text-black disabled:opacity-40"
        >
          {loading ? '…' : 'Enviar'}
        </button>
      </div>
      {feedback && <p className="mt-2 text-xs text-slate-300">{feedback}</p>}
    </section>
  );
}
