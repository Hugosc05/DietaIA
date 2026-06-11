'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center">
      <h1 className="mb-1 text-2xl font-bold text-white">DietaIA</h1>
      <p className="mb-8 text-sm text-slate-400">
        Definición abdominal · 1900 kcal · 140P / 200C / 60G
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-white outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-white outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-6 text-sm text-slate-400 underline"
      >
        {mode === 'login' ? '¿Primera vez? Crea tu cuenta' : '¿Ya tienes cuenta? Entra'}
      </button>
    </div>
  );
}
