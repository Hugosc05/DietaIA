import { Capacitor } from '@capacitor/core';
import { CapacitorHealthkit, SampleNames } from '@perfood/capacitor-healthkit';
import { createClient } from '@/lib/supabase/client';
import { todayISO } from '@/lib/daily-log';

interface StepSample {
  value: number;
  startDate: string;
  endDate: string;
}

export function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function requestHealthKitAuthorization(): Promise<boolean> {
  if (!isNativeIOS()) return false;
  try {
    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: ['steps'],
      write: []
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncDailySteps(): Promise<number | null> {
  if (!isNativeIOS()) return null;

  const authorized = await requestHealthKitAuthorization();
  if (!authorized) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let exactSteps = 0;
  try {
    const data = await CapacitorHealthkit.queryHKitSampleType<StepSample>({
      sampleName: SampleNames.STEP_COUNT,
      startDate: startOfDay.toISOString(),
      endDate: new Date().toISOString(),
      limit: 0
    });
    exactSteps = Math.round(
      data.resultData.reduce((total: number, sample: StepSample) => total + sample.value, 0)
    );
  } catch {
    return null;
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from('daily_logs').upsert(
    {
      user_id: user.id,
      fecha: todayISO(),
      pasos: exactSteps
    },
    { onConflict: 'user_id,fecha' }
  );

  return error ? null : exactSteps;
}
