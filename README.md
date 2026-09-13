# Go Live Survivor

Un arcade de supervivencia de 90 segundos para equipos que implementan CRM. Esquivá bugs, flows fallidos y archivos Excel descomunales mientras tus Fixes se disparan solos. Cuando todo arde, usá Emergency Hotfix.

## Ejecutar

Requiere Node.js 22.13 o superior de la rama 22, o Node.js 24+, y npm.

```bash
npm install
npm run dev
```

Abrí la dirección que imprime Vite (normalmente http://127.0.0.1:5173). En Windows, si PowerShell bloquea `npm.ps1`, usá `npm.cmd` con los mismos argumentos.

- WASD o flechas: movimiento; disparos automáticos al enemigo más cercano.
- SPACE: Hotfix, radio de 205 px y recarga de 8 segundos.
- ESC: pausa. Cambiar de ventana también pausa; continuar requiere una acción explícita.
- Llegar a 90 segundos con Stability positiva: victoria y +1000 puntos.
- El boss anuncia su llegada al segundo 65 y aparece dos segundos después. Resolverlo da 500 puntos base; no es obligatorio para sobrevivir.

Desktop es el objetivo. La arena conserva 16:9 y se ajusta a la ventana; la interfaz se adapta a pantallas pequeñas, pero no hay controles táctiles de movimiento.

## Stack y estructura

Vite, TypeScript estricto, Phaser 3, HTML/CSS, `@supabase/supabase-js`, Vitest y ESLint. Sin frameworks de UI, backend propio ni Realtime.

```text
src/game/config/       Branding, balance, enemigos y frases
src/game/entities/     Consultor, enemigos y proyectiles
src/game/systems/      Score, dificultad, spawn y geometría de combate
src/game/scenes/       Escena Phaser y ciclo de la partida
src/services/score/    Contrato e implementaciones local / Supabase
src/services/         Autenticación opcional y audio sintetizado
src/utils/            Nickname, fechas UTC y storage tolerante a fallos
src/main.ts           Pantallas HTML, HUD y navegación sin recargar
src/styles/           Estilos de interfaz
supabase/migrations/  Tabla, índices, permisos, RLS y consultas de ranking
tests/                Pruebas unitarias de lógica independiente del motor
```

Proyectiles, enemigos y efectos se destruyen al terminar su vida útil. Hay límites explícitos de objetos; reiniciar limpia el estado y los efectos sin recrear la página. El juego simula pasos de hasta 50 ms para evitar saltos de combate si el navegador se frena.

## Local Mode

No necesitás Supabase para jugar ni desarrollar. Sin variables de entorno se usa `LocalScoreRepository`, con nickname, preferencia de sonido, identidad anónima y partidas en `localStorage`. Si el navegador bloquea el almacenamiento, se mantiene una copia en memoria durante la sesión.

El ranking muestra datos reales, sin jugadores inventados: top 10 con la mejor partida por identidad. En un navegador con una sola identidad normalmente aparece una fila. Los apodos pueden repetirse; cambiar el nickname no crea otro usuario. Se conservan hasta 400 partidas recientes y los mejores resultados históricos. Borrar los datos del navegador elimina la identidad y las partidas locales.

Si Supabase está configurado pero la conexión o autenticación inicial falla, el juego pasa a Local Mode e informa el problema. Si falla el envío de una partida online, se guarda una copia local y se indica en el resultado. Estas copias **no se sincronizan automáticamente**. Si falla la lectura online, el leaderboard muestra las partidas locales con una indicación explícita.

## Conectar Supabase

1. Creá un proyecto Supabase.
2. En Authentication → Sign In / Providers, habilitá **Anonymous Sign-Ins**.
3. Ejecutá `supabase/migrations/001_initial_schema.sql` en el SQL Editor, o aplicala con tu flujo habitual de migrations.
4. Copiá la Project URL y la **publishable key** (`sb_publishable_…`).
5. Copiá `.env.example` a `.env` y completá:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
   ```

6. Reiniciá Vite. Para producción, volvé a compilar con esas variables.

La app reutiliza la sesión existente o ejecuta `signInAnonymously()`. No solicita email ni contraseña. El nickname es independiente de la identidad de Auth. Consultá la [documentación de autenticación anónima](https://supabase.com/docs/guides/auth/auth-anonymous) y la [referencia de signInAnonymously](https://supabase.com/docs/reference/javascript/auth-signinanonymously).

Las semanas comienzan el lunes a las 00:00 **UTC**, tanto en SQL como en el cliente. El ranking semanal y el histórico muestran la mejor partida de cada identidad; los empates se ordenan por fecha y UUID. La posición semanal se calcula entre todos los jugadores, no solamente el top 10. YOUR BEST muestra el récord histórico personal.

Para verificar la integración en tu proyecto: jugá una partida, comprobá la fila en `scores`, reiniciá el navegador para comprobar la sesión y abrí la app en otro perfil para ver una segunda identidad. Intentar insertar otro `user_id`, modificar, borrar o fijar `created_at` desde un cliente autenticado debe fallar. La integración real requiere el proyecto y las credenciales públicas; las pruebas locales no sustituyen esa verificación.

## Seguridad

- RLS está habilitado. SELECT requiere el rol `authenticated`; INSERT exige `user_id = auth.uid()`.
- UPDATE y DELETE no tienen policies ni permisos de cliente. Los inserts solo permiten los campos de partida: fecha e ID son generados por la base.
- Las consultas SQL de ranking son `SECURITY INVOKER`, respetan RLS y solo permiten ejecución autenticada.
- La base valida límites de score, duración, problemas, combo, resultado y nickname. El frontend valida antes de enviar y usa `textContent` para mostrar nombres.
- Nunca pongas una `service_role` ni una clave secreta en el frontend. Las variables `VITE_*` son públicas e integran el bundle. Se admite la publishable key moderna, no claves privilegiadas.
- El score es calculado client-side. El MVP evita manipulación accidental, pero no intenta impedir cheating deliberado.
- Las versiones están fijadas en `package.json` y `package-lock.json`. Usá `npm ci` para instalaciones reproducibles y `npm audit` al actualizar. Un audit sin avisos no garantiza la ausencia de vulnerabilidades desconocidas.

No hay analytics, telemetría ni solicitudes externas en Local Mode. Los gráficos son formas Phaser, CSS y SVG originales, sin logos ni imágenes de terceros. Los sonidos se sintetizan con Web Audio después de un gesto del usuario, sin descargas ni licencias externas. Se priorizó el apartado 31 de la especificación ante la indicación anterior de descargar audio público.

## Validación

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run format
```

Los tests cubren puntos base, combos y expiración, bonus idempotente, nickname, semanas UTC, límites de balance, colisiones de proyectiles, validación de envíos y almacenamiento local. El gameplay necesita además una prueba visual: movimiento, daño e invulnerabilidad, Hotfix/cooldown, fases, boss, derrota, victoria y reinicio.

## Deploy estático

`npm run build` genera `dist/`. No hay servidor de aplicación. Las variables de Supabase deben estar disponibles **durante el build**; modificar variables después de publicar exige recompilar. `base: './'` permite servir el contenido desde un subdirectorio.

| Plataforma            | Configuración                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Vercel                | Framework Vite; build `npm run build`; output `dist`; Node 22 o superior.                      |
| Netlify               | Build `npm run build`; publish `dist`; Node 22 o superior.                                     |
| Azure Static Web Apps | App location `/`; API location vacía; output `dist`; preset Vite o custom con `npm run build`. |

También podés subir `dist/` a cualquier hosting HTTPS. No necesitás redirects de SPA: la navegación ocurre dentro de la misma página. Configurá las dos variables públicas en el proveedor si querés el ranking compartido. Sin ellas se publica un juego completamente local.

## Personalización

- `src/game/config/gameConfig.ts`: nombre, subtítulo, equipo y versión. El título gráfico principal está compuesto en `src/main.ts`.
- `src/game/config/enemies.ts`: etiquetas, colores, estadísticas, aparición y boss.
- `src/game/config/messages.ts`: frases de derrota, fases y easter eggs.
- `src/game/config/balance.ts`: duración, movimiento, ataques, spawn, cooldown, límites y puntos.
- `src/game/systems/ScoreSystem.ts`: reglas del combo y puntuación.
- `src/styles/main.css`: paleta, pantallas y HUD.

La duración del MVP es 90 segundos. Si se cambia, ajustá también las validaciones del repositorio, la migration, el reloj de la UI y los tests. No hay tablas ni UI de achievements: el resumen de partida concentra las métricas para poder agregarlos más adelante.
