import { createClient } from '@/lib/supabase/client';
import type { DailyLog } from '@/lib/types';

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

export async function getOrCreateTodayLog(): Promise<DailyLog | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const fecha = todayISO();

  const { data } = await supabase
    .from('daily_logs')
    .upsert(
      { user_id: user.id, fecha },
      { onConflict: 'user_id,fecha', ignoreDuplicates: false }
    )
    .select()
    .single();

  return data as DailyLog | null;
}

export async function updateTodayLog(patch: Partial<DailyLog>): Promise<DailyLog | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('daily_logs')
    .update(patch)
    .match({ user_id: user.id, fecha: todayISO() })
    .select()
    .single();

  return data as DailyLog | null;
}

export async function updateLogForDate(
  fecha: string,
  patch: Partial<DailyLog>
): Promise<DailyLog | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('daily_logs')
    .upsert(
      { user_id: user.id, fecha, ...patch },
      { onConflict: 'user_id,fecha' }
    )
    .select()
    .single();

  return data as DailyLog | null;
}
