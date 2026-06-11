'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import type { DailyLog, Profile } from '@/lib/types';

const KCAL_PER_KG_FAT = 7700;

interface DayPoint {
  fecha: string;
  label: string;
  peso: number | null;
  pesoSuavizado: number | null;
  pasos: number;
}

interface WeekPoint {
  semana: string;
  deficitReal: number | null;
  deficitTeorico: number;
}

function smooth(values: (number | null)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const half = Math.floor(window / 2);
    const slice = values
      .slice(Math.max(0, i - half), Math.min(values.length, i + half + 1))
      .filter((v): v is number => v != null);
    if (slice.length === 0) return null;
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  });
}

function estimateTDEE(weightKg: number, heightCm: number, age: number): number {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * 1.55);
}

export default function ProgressCharts() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: logData }, { data: profileData }] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('*')
          .order('fecha', { ascending: true })
          .limit(90),
        supabase.from('profiles').select('*').single()
      ]);
      setLogs((logData as DailyLog[]) ?? []);
      setProfile(profileData as Profile | null);
      setLoading(false);
    })();
  }, []);

  const dayPoints: DayPoint[] = useMemo(() => {
    const weights = logs.map((l) => (l.peso_ayunas != null ? Number(l.peso_ayunas) : null));
    const smoothed = smooth(weights);
    return logs.map((l, i) => ({
      fecha: l.fecha,
      label: new Date(`${l.fecha}T12:00:00`).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      }),
      peso: weights[i],
      pesoSuavizado: smoothed[i],
      pasos: l.pasos
    }));
  }, [logs]);

  const weekPoints: WeekPoint[] = useMemo(() => {
    if (logs.length === 0 || !profile) return [];

    const weeks = new Map<string, { weights: number[]; start: Date }>();
    for (const log of logs) {
      const d = new Date(`${log.fecha}T12:00:00`);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const key = monday.toISOString().split('T')[0];
      if (!weeks.has(key)) weeks.set(key, { weights: [], start: monday });
      if (log.peso_ayunas != null) weeks.get(key)!.weights.push(Number(log.peso_ayunas));
    }

    const sorted = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));
    const points: WeekPoint[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const [key, week] = sorted[i];
      const avg =
        week.weights.length > 0
          ? week.weights.reduce((a, b) => a + b, 0) / week.weights.length
          : null;

      let deficitReal: number | null = null;
      if (i > 0 && avg != null) {
        const prev = sorted[i - 1][1];
        const prevAvg =
          prev.weights.length > 0
            ? prev.weights.reduce((a, b) => a + b, 0) / prev.weights.length
            : null;
        if (prevAvg != null) {
          deficitReal = Math.round(((prevAvg - avg) * KCAL_PER_KG_FAT) / 7);
        }
      }

      const refWeight = avg ?? Number(profile.peso_inicial);
      const deficitTeorico =
        estimateTDEE(refWeight, Number(profile.altura), profile.edad) - profile.kcal_objetivo;

      points.push({
        semana: new Date(`${key}T12:00:00`).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        }),
        deficitReal,
        deficitTeorico
      });
    }
    return points;
  }, [logs, profile]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Cargando progreso…</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <h1 className="mb-2 text-xl font-bold text-white">Progreso</h1>
        <p className="text-sm">Registra tu peso y pasos para ver tus gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-white">Progreso</h1>
        <p className="text-sm text-slate-400">
          Correlación peso en ayunas ↔ pasos diarios · objetivo: definición de oblicuos
        </p>
      </header>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Peso (tendencia suavizada) vs Pasos
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dayPoints} margin={{ top: 5, right: 0, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis
              yAxisId="peso"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fill: '#22d3ee', fontSize: 10 }}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <YAxis
              yAxisId="pasos"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{ background: '#141a22', border: '1px solid #1f2937', borderRadius: 12 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine yAxisId="pasos" y={8000} stroke="#34d399" strokeDasharray="4 4" />
            <Bar
              yAxisId="pasos"
              dataKey="pasos"
              name="Pasos"
              fill="#334155"
              radius={[3, 3, 0, 0]}
              barSize={8}
            />
            <Line
              yAxisId="peso"
              type="monotone"
              dataKey="pesoSuavizado"
              name="Peso (media 7d)"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Line
              yAxisId="peso"
              type="monotone"
              dataKey="peso"
              name="Peso diario"
              stroke="#22d3ee"
              strokeWidth={0}
              strokeOpacity={0}
              dot={{ r: 2, fill: '#0e7490' }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[11px] text-slate-500">
          Línea verde discontinua: mínimo de 8.000 pasos. La tendencia suavizada elimina las
          fluctuaciones de agua y glucógeno.
        </p>
      </section>

      <section className="rounded-2xl border border-edge bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Déficit real vs teórico (kcal/día por semana)
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weekPoints} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#141a22', border: '1px solid #1f2937', borderRadius: 12 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#475569" />
            <Line
              type="monotone"
              dataKey="deficitTeorico"
              name="Déficit teórico"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="deficitReal"
              name="Déficit real (Δ peso)"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[11px] text-slate-500">
          Déficit real calculado a partir de la variación de la media semanal de peso (7.700
          kcal/kg). Si el real cae por debajo del teórico de forma sostenida, revisa adherencia y
          pasos.
        </p>
      </section>
    </div>
  );
}
