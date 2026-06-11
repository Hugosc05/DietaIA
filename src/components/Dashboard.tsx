'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateTodayLog, updateTodayLog, todayISO } from '@/lib/daily-log';
import { DAILY_TARGETS } from '@/lib/diet-data';
import type { DailyLog, WeeklySummary } from '@/lib/types';
import VisionScanner from './VisionScanner';

type CheckKey =
  | 'desayuno_ok'
  | 'm_manana_ok'
  | 'comida_ok'
  | 'cena_ok'
  | 'pesas_ok'
  | 'cardio_ok';

const CHECKS: { key: CheckKey; label: string; group: 'dieta' | 'entreno' }[] = [
  { key: 'desayuno_ok', label: 'Desayuno', group: 'dieta' },
  { key: 'm_manana_ok', label: 'Media Mañana', group: 'dieta' },
  { key: 'comida_ok', label: 'Comida', group: 'dieta' },
  { key: 'cena_ok', label: 'Cena', group: 'dieta' },
  { key: 'pesas_ok', label: 'Pesas (al fallo)', group: 'entreno' },
  { key: 'cardio_ok', label: 'Cardio LISS', group: 'entreno' }
];

function mondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [editingSteps, setEditingSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const weightRef = useRef<HTMLInputElement>(null);

  const loadSummary = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc('resumen_semanal', {
      p_inicio: mondayOfCurrentWeek()
    });
    if (data && data.length > 0) setSummary(data[0] as WeeklySummary);
  }, []);

  useEffect(() => {
    (async () => {
      const todayLog = await getOrCreateTodayLog();
      setLog(todayLog);
      if (todayLog?.peso_ayunas) setWeightInput(String(todayLog.peso_ayunas));
      await loadSummary();
    })();
  }, [loadSummary]);

  useEffect(() => {
    if (searchParams.get('focus') === 'peso' && weightRef.current) {
      weightRef.current.focus();
      weightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, log]);

  async function toggle(key: CheckKey) {
    if (!log) return;
    const next = { ...log, [key]: !log[key] };
    setLog(next);
    const saved = await updateTodayLog({ [key]: next[key] });
    if (saved) setLog(saved);
    await loadSummary();
  }

  async function saveSteps() {
    if (!log || !stepsInput) return;
    const value = parseInt(stepsInput, 10);
    if (Number.isNaN(value) || value < 0 || value > 100000) return;
    const saved = await updateTodayLog({ pasos: value });
    if (saved) setLog(saved);
    setEditingSteps(false);
    setStepsInput('');
    await loadSummary();
  }

  async function saveWeight() {
    if (!log || !weightInput) return;
    const value = parseFloat(weightInput.replace(',', '.'));
    if (Number.isNaN(value) || value < 30 || value > 200) return;
    setSaving(true);
    const saved = await updateTodayLog({ peso_ayunas: value });
    if (saved) setLog(saved);
    setSaving(false);
    await loadSummary();
  }

  const stepsGoalMet = (log?.pasos ?? 0) >= 8000;
  const fechaHumana = new Date(`${todayISO()}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold capitalize text-white">{fechaHumana}</h1>
        <p className="text-sm text-slate-400">
          {DAILY_TARGETS.kcal} kcal · {DAILY_TARGETS.protein}P / {DAILY_TARGETS.carbs}C /{' '}
          {DAILY_TARGETS.fat}G
        </p>
      </header>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Dieta de hoy
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {CHECKS.filter((c) => c.group === 'dieta').map((c) => (
            <CheckTile key={c.key} label={c.label} checked={!!log?.[c.key]} onToggle={() => toggle(c.key)} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Entrenamiento
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {CHECKS.filter((c) => c.group === 'entreno').map((c) => (
            <CheckTile key={c.key} label={c.label} checked={!!log?.[c.key]} onToggle={() => toggle(c.key)} />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          4 días/semana de pesas al fallo con sobrecarga progresiva · 1 día de cardio LISS
        </p>
      </section>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pasos hoy
            </h2>
            <p className={`mt-1 text-2xl font-bold ${stepsGoalMet ? 'text-ok' : 'text-white'}`}>
              {(log?.pasos ?? 0).toLocaleString('es-ES')}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            Objetivo
            <p className="font-semibold text-slate-200">8.000 – 10.000</p>
            <p className="mt-1 text-[10px]">HealthKit en app nativa · manual en web</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-edge">
          <div
            className={`h-full rounded-full ${stepsGoalMet ? 'bg-ok' : 'bg-accent'}`}
            style={{ width: `${Math.min(100, ((log?.pasos ?? 0) / 10000) * 100)}%` }}
          />
        </div>
        {editingSteps ? (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="100000"
              placeholder={String(log?.pasos ?? 0)}
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              autoFocus
              className="flex-1 rounded-xl border border-edge bg-base px-4 py-2.5 font-semibold text-white outline-none focus:border-accent"
            />
            <button
              onClick={saveSteps}
              disabled={!stepsInput}
              className="rounded-xl bg-accent px-4 text-sm font-semibold text-black disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditingSteps(false)}
              className="rounded-xl border border-edge px-3 text-sm text-slate-300"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingSteps(true)}
            className="mt-3 text-xs text-accent underline"
          >
            Introducir pasos manualmente
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Peso en ayunas
        </h2>
        <div className="flex gap-2">
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="30"
            max="200"
            placeholder="64.0"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 rounded-xl border border-edge bg-base px-4 py-3 text-lg font-semibold text-white outline-none focus:border-accent"
          />
          <span className="self-center text-sm text-slate-400">kg</span>
          <button
            onClick={saveWeight}
            disabled={saving || !weightInput}
            className="rounded-xl bg-accent px-5 font-semibold text-black disabled:opacity-40"
          >
            {saving ? '…' : 'Guardar'}
          </button>
        </div>
        {log?.peso_ayunas && (
          <p className="mt-2 text-xs text-ok">Registrado: {log.peso_ayunas} kg</p>
        )}
      </section>

      <VisionScanner onLogged={loadSummary} />

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Resumen semanal
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-white">
              {summary?.peso_medio != null ? `${summary.peso_medio}` : '—'}
            </p>
            <p className="text-[11px] text-slate-400">kg medio</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {(summary?.pasos_totales ?? 0).toLocaleString('es-ES')}
            </p>
            <p className="text-[11px] text-slate-400">pasos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {summary?.adherencia_dieta_pct != null ? `${summary.adherencia_dieta_pct}%` : '—'}
            </p>
            <p className="text-[11px] text-slate-400">adherencia</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckTile({
  label,
  checked,
  onToggle
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
        checked
          ? 'border-ok/50 bg-ok/10 text-ok'
          : 'border-edge bg-base text-slate-300'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
          checked ? 'border-ok bg-ok text-black' : 'border-slate-500'
        }`}
      >
        {checked && '✓'}
      </span>
      {label}
    </button>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Cargando…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
