'use client';

import { useRef, useState } from 'react';
import type { VisionResult } from '@/lib/types';

export default function VisionScanner({ onLogged }: { onLogged?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  async function handleFile(file: File) {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setLogged(false);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/vision', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al analizar la imagen');
      setResult((await res.json()) as VisionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function approve() {
    if (!result) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/vision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      if (!res.ok) throw new Error('No se pudo guardar en el log');
      setLogged(true);
      setResult(null);
      onLogged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-edge bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Escáner de plato (IA)
        </h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
          className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
        >
          {analyzing ? 'Analizando…' : '📷 Foto'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {logged && <p className="mt-3 text-xs text-ok">Añadido al log diario ✓</p>}

      {result && (
        <div className="mt-3 rounded-xl border border-edge bg-base p-3">
          <p className="font-semibold text-white">{result.name}</p>
          <p className="text-xs text-slate-400">
            ~{result.estimated_weight_g} g · confianza {result.confidence}
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
            <Macro label="kcal" value={result.calories} />
            <Macro label="P" value={result.protein} />
            <Macro label="C" value={result.carbs} />
            <Macro label="G" value={result.fat} />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={approve}
              disabled={analyzing}
              className="flex-1 rounded-lg bg-ok py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              Aprobar y registrar
            </button>
            <button
              onClick={() => setResult(null)}
              className="rounded-lg border border-edge px-4 py-2 text-sm text-slate-300"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-card py-1.5">
      <p className="font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
