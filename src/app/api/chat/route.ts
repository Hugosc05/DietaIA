import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { WEEKLY_DIET, MACRO_TARGETS } from '@/lib/diet-data';
import type { DayKey, DietOverride, MealKey, MealOption, Profile } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CHANGE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    dia: {
      type: SchemaType.STRING,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    },
    comida: {
      type: SchemaType.STRING,
      enum: ['desayuno', 'm_manana', 'comida', 'cena']
    },
    opcion: { type: SchemaType.INTEGER },
    contenido: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        macros: {
          type: SchemaType.OBJECT,
          properties: {
            kcal: { type: SchemaType.INTEGER },
            protein: { type: SchemaType.INTEGER },
            carbs: { type: SchemaType.INTEGER },
            fat: { type: SchemaType.INTEGER }
          },
          required: ['kcal', 'protein', 'carbs', 'fat']
        }
      },
      required: ['name', 'items', 'macros']
    },
    resumen: { type: SchemaType.STRING }
  },
  required: ['dia', 'comida', 'opcion', 'contenido', 'resumen']
} as const;

function buildSystemPrompt(profile: Profile, currentDiet: string): string {
  return `Eres el nutricionista digital de una app de definición muscular. Tu única función es reescribir UNA opción de comida del plan semanal según la petición del usuario.

PERFIL DEL USUARIO (INMUTABLE):
- Edad: ${profile.edad} años · Peso inicial: ${profile.peso_inicial} kg · Altura: ${profile.altura} cm
- Objetivo calórico FIJO: ${profile.kcal_objetivo} kcal/día
- Macros diarios FIJOS: ${profile.macros.proteinas_g}g proteína / ${profile.macros.carbohidratos_g}g carbohidratos / ${profile.macros.grasas_g}g grasa
- Restricciones absolutas: ${profile.restricciones.join(' · ')}

REGLAS INNEGOCIABLES:
1. La nueva opción debe respetar EXACTAMENTE los macros objetivo de su franja:
   - desayuno: ${JSON.stringify(MACRO_TARGETS.desayuno)}
   - m_manana: ${JSON.stringify(MACRO_TARGETS.m_manana)}
   - comida: ${JSON.stringify(MACRO_TARGETS.comida)}
   - cena: ${JSON.stringify(MACRO_TARGETS.cena)}
2. PROHIBIDO: avena o alimentos de textura similar, proteínas en polvo o suplementos. Toda la proteína proviene de comida real.
3. En "comida" y "cena" el puré de calabacín (250 g) es la verdura base OBLIGATORIA y debe aparecer en los items.
4. Los items deben incluir cantidades exactas en gramos.
5. Identifica del mensaje del usuario el día, la comida y la opción a modificar. Si no especifica opción, modifica la opción 1.
6. Devuelve EXCLUSIVAMENTE el JSON del esquema, con "resumen" siendo una frase corta en español describiendo el cambio.

DIETA ACTUAL DEL USUARIO:
${currentDiet}`;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { mensaje, dia_contexto } = (await request.json()) as {
    mensaje?: string;
    dia_contexto?: DayKey;
  };
  if (!mensaje?.trim()) {
    return NextResponse.json({ error: 'Falta el campo "mensaje"' }, { status: 400 });
  }

  const [{ data: profile }, { data: overrides }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('diet_overrides').select('*').eq('user_id', user.id)
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  }

  const resolved = structuredClone(WEEKLY_DIET);
  for (const ov of (overrides as DietOverride[]) ?? []) {
    resolved[ov.dia][ov.comida][ov.opcion - 1] = ov.contenido;
  }

  const dietText = (Object.keys(resolved) as DayKey[])
    .map((dia) =>
      (Object.keys(resolved[dia]) as MealKey[])
        .map((comida) =>
          resolved[dia][comida]
            .map(
              (opt, i) =>
                `${dia} > ${comida} > opción ${i + 1}: ${opt.name} [${opt.items.join(', ')}]`
            )
            .join('\n')
        )
        .join('\n')
    )
    .join('\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildSystemPrompt(profile as Profile, dietText),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: CHANGE_SCHEMA as never,
      temperature: 0.3
    }
  });

  try {
    const result = await model.generateContent(
      `Día visible en pantalla: ${dia_contexto ?? 'no especificado'}.\nPetición del usuario: ${mensaje}`
    );

    const change = JSON.parse(result.response.text()) as {
      dia: DayKey;
      comida: MealKey;
      opcion: number;
      contenido: MealOption;
      resumen: string;
    };

    const target = MACRO_TARGETS[change.comida];
    const m = change.contenido.macros;
    const tolerance = 0.07;
    const withinTolerance =
      Math.abs(m.protein - target.protein) <= target.protein * tolerance &&
      Math.abs(m.carbs - target.carbs) <= target.carbs * tolerance &&
      Math.abs(m.fat - target.fat) <= target.fat * tolerance;

    if (!withinTolerance) {
      return NextResponse.json(
        { error: 'La IA propuso macros fuera de tolerancia. Reformula la petición.' },
        { status: 422 }
      );
    }

    const forbidden = /avena|proteína en polvo|proteina en polvo|whey|caseína|caseina/i;
    if (change.contenido.items.some((item) => forbidden.test(item))) {
      return NextResponse.json(
        { error: 'La propuesta viola tus restricciones alimentarias.' },
        { status: 422 }
      );
    }

    if (
      (change.comida === 'comida' || change.comida === 'cena') &&
      !change.contenido.items.some((item) => /calabac[ií]n/i.test(item))
    ) {
      return NextResponse.json(
        { error: 'La propuesta omite el puré de calabacín obligatorio.' },
        { status: 422 }
      );
    }

    const opcion = change.opcion === 2 ? 2 : 1;

    const { error: upsertError } = await supabase.from('diet_overrides').upsert(
      {
        user_id: user.id,
        dia: change.dia,
        comida: change.comida,
        opcion,
        contenido: change.contenido,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,dia,comida,opcion' }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      dia: change.dia,
      comida: change.comida,
      opcion,
      contenido: change.contenido,
      resumen: change.resumen
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo procesar el cambio de dieta. Inténtalo de nuevo.' },
      { status: 502 }
    );
  }
}
