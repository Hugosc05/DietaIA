import { NextRequest, NextResponse } from 'next/server';
import { SchemaType } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { generateJSON } from '@/lib/gemini';
import type { VisionResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VISION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    estimated_weight_g: { type: SchemaType.INTEGER },
    calories: { type: SchemaType.INTEGER },
    protein: { type: SchemaType.INTEGER },
    carbs: { type: SchemaType.INTEGER },
    fat: { type: SchemaType.INTEGER },
    confidence: { type: SchemaType.STRING }
  },
  required: ['name', 'estimated_weight_g', 'calories', 'protein', 'carbs', 'fat', 'confidence']
} as const;

const SYSTEM_PROMPT = `Eres un analizador nutricional de precisión para una app de definición muscular.
Analiza la imagen del plato de comida y devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura exacta:
- name: nombre del plato en español
- estimated_weight_g: peso total estimado del plato en gramos (entero)
- calories: kilocalorías totales estimadas (entero)
- protein: gramos de proteína (entero)
- carbs: gramos de carbohidratos (entero)
- fat: gramos de grasa (entero)
- confidence: "alta", "media" o "baja" según la claridad de la imagen y la certeza de la estimación
No incluyas texto fuera del JSON. Estima las raciones con criterio conservador y realista.`;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get('image');
  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Falta el campo "image"' }, { status: 400 });
  }

  const bytes = Buffer.from(await image.arrayBuffer());

  try {
    const text = await generateJSON({
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: VISION_SCHEMA as never,
        temperature: 0.2
      },
      request: [
        {
          inlineData: {
            mimeType: image.type || 'image/jpeg',
            data: bytes.toString('base64')
          }
        },
        'Analiza este plato y devuelve el JSON nutricional.'
      ]
    });

    const parsed = JSON.parse(text) as VisionResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'desconocido';
    return NextResponse.json(
      { error: `No se pudo analizar la imagen (${detail.slice(0, 200)})` },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as VisionResult;
  const required: (keyof VisionResult)[] = [
    'name',
    'estimated_weight_g',
    'calories',
    'protein',
    'carbs',
    'fat',
    'confidence'
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return NextResponse.json({ error: `Falta el campo "${field}"` }, { status: 400 });
    }
  }

  const fecha = new Date().toISOString().split('T')[0];

  const { error: insertError } = await supabase.from('ai_meal_logs').insert({
    user_id: user.id,
    fecha,
    name: body.name,
    estimated_weight_g: body.estimated_weight_g,
    calories: body.calories,
    protein: body.protein,
    carbs: body.carbs,
    fat: body.fat,
    confidence: body.confidence
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from('daily_logs')
    .upsert({ user_id: user.id, fecha }, { onConflict: 'user_id,fecha' });

  const { data: log } = await supabase
    .from('daily_logs')
    .select('notas')
    .match({ user_id: user.id, fecha })
    .single();

  const nota = `[IA] ${body.name}: ${body.calories} kcal (${body.protein}P/${body.carbs}C/${body.fat}G)`;
  await supabase
    .from('daily_logs')
    .update({ notas: log?.notas ? `${log.notas}\n${nota}` : nota })
    .match({ user_id: user.id, fecha });

  return NextResponse.json({ ok: true });
}
