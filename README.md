# DietaIA · PWA de Definición Abdominal

PWA + app nativa iOS (Capacitor) para un protocolo de definición de 1900 kcal (140P / 200C / 60G), 4 comidas diarias, 4 días de pesas al fallo + 1 cardio LISS y 8.000–10.000 pasos.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts · Supabase (PostgreSQL + Auth + RLS) · Gemini 1.5 Flash · Capacitor (HealthKit + Local Notifications).

## Puesta en marcha

1. **Supabase**: crea un proyecto y ejecuta `supabase/schema.sql` completo en el SQL Editor. El trigger crea automáticamente el perfil (20 años, 64 kg, 1.68 m, 1900 kcal) al registrarse.
2. **Variables de entorno**: copia `.env.example` a `.env.local` y rellena las claves de Supabase y `GEMINI_API_KEY` (Google AI Studio).
3. **Web**:
   ```bash
   npm install
   npm run dev
   ```
4. **Despliegue**: despliega en Vercel (las API Routes de Gemini necesitan servidor). Apunta `CAP_SERVER_URL` al dominio de producción.
5. **iOS (Capacitor)**:
   ```bash
   npx cap add ios
   npm run cap:sync
   npm run cap:open
   ```
   En Xcode: activa la capability **HealthKit** y añade a `Info.plist`:
   - `NSHealthShareUsageDescription`: "DietaIA lee tus pasos de Apple Health para seguir tu objetivo diario."

## Por qué Capacitor y no PWA pura para los pasos

Safari no expone HealthKit a las PWA e iOS mata los procesos JS en segundo plano; `DeviceMotionEvent` drena batería, deja de contar con la pantalla bloqueada y suma falsos pasos en moto/coche. El contenedor nativo hereda el conteo del coprocesador de movimiento vía HealthKit (Apple ya filtra los trayectos en vehículo), y la app sincroniza con Supabase en cada `appStateChange` a primer plano.

## Estructura

- `supabase/schema.sql` — tablas, índices, RLS y función `resumen_semanal`
- `src/lib/diet-data.ts` — matriz L-D con 2 opciones por comida (macros exactos por franja: 495/310/640/455 kcal)
- `src/app/api/vision/route.ts` — análisis de plato por foto (Gemini, JSON Mode) + registro tras aprobación
- `src/app/api/chat/route.ts` — modificación de dieta con memoria de perfil y validación de macros/restricciones
- `src/lib/native/healthkit.ts` — sync de pasos HealthKit → Supabase (upsert)
- `src/lib/native/notifications.ts` — recordatorio diario de pesaje a las 07:00 (deep-link al input de peso)
