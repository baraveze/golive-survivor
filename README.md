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
- Desde la pausa podés cancelar y volver al inicio. La partida cancelada no envía ni guarda score; la siguiente empieza desde cero.
- Llegar a 90 segundos con Stability positiva: victoria y +1000 puntos.
- El boss anuncia su llegada al segundo 65 y aparece dos segundos después. Resolverlo da 500 puntos base; no es obligatorio para sobrevivir.

También se puede jugar desde el celular: **Controles táctiles (móvil)** se activa por defecto en dispositivos táctiles y puede cambiarse desde el inicio. La preferencia queda guardada. Arrastrá el joystick izquierdo para moverte y tocá el botón derecho para lanzar el parche; ambos admiten uso simultáneo. Los disparos siguen siendo automáticos.

En modo táctil la partida ocupa la ventana, con controles grandes, pausa y opciones de audio accesibles desde la pausa. Funciona en vertical y horizontal; horizontal ofrece más espacio. La arena mantiene su proporción y el campo completo. Girar el dispositivo pausa el juego y suelta el joystick; tocá Continuar para retomar. El teclado sigue disponible.

Para probar desde un celular en la misma red Wi-Fi, ejecutá `npm.cmd run dev -- --host 0.0.0.0` y abrí en el celular la dirección **Network** que muestra Vite (por ejemplo `http://192.168.1.10:5173`).

La versión **1.3.1** corrige el arranque desde una IP por HTTP: los identificadores locales usan `crypto.getRandomValues()` cuando `crypto.randomUUID()` no está disponible. Antes, una primera visita en ese contexto detenía la inicialización y dejaba sin funcionar inicio, idioma y opciones de audio. Se conservan las identidades y partidas ya guardadas.

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
3. Ejecutá las migrations de `supabase/migrations/` en orden (`001_initial_schema.sql`, luego `002_access_logs.sql`) en el SQL Editor, o aplicalas con tu flujo habitual de migrations. Si ya tenés el juego funcionando, ejecutá solamente la nueva `002_access_logs.sql`.
4. Copiá la Project URL y la **publishable key** (`sb_publishable_…`).
5. Copiá `.env.example` a `.env` y completá:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
   ```

6. Reiniciá Vite. Para producción, volvé a compilar con esas variables.

La app reutiliza la sesión existente o ejecuta `signInAnonymously()`. No solicita email ni contraseña. El nickname es independiente de la identidad de Auth. Consultá la [documentación de autenticación anónima](https://supabase.com/docs/guides/auth/auth-anonymous) y la [referencia de signInAnonymously](https://supabase.com/docs/reference/javascript/auth-signinanonymously).

Las semanas comienzan el lunes a las 00:00 **UTC**, tanto en SQL como en el cliente. El ranking semanal y el histórico muestran la mejor partida de cada identidad; los empates se ordenan por fecha y UUID. Los puestos 1, 2 y 3 tienen medallas de oro, plata y bronce. Se mantiene la indicación YOU del jugador actual. La posición semanal se calcula entre todos los jugadores, no solamente el top 10. YOUR BEST muestra el récord histórico personal.

## Registro de accesos

En modo online se registra un acceso al abrir o recargar la app, después de autenticar al visitante. No se genera otro acceso al reiniciar o cancelar una partida. La tabla `public.access_logs` contiene `user_id`, `ip_address` (IPv4 o IPv6), `browser`, `user_agent` (hasta 512 caracteres) y `created_at`. Los scores se vinculan a los accesos mediante `user_id`; no se agregan datos personales a la tabla pública de scores.

Un trigger de Supabase obtiene la IP de `X-Forwarded-For` y el navegador de `User-Agent`, según la [documentación de cabeceras de Supabase](https://supabase.com/docs/guides/api/securing-your-api#request-information). No se consulta ningún servicio externo para obtener la IP. Si la cabecera está ausente o no contiene una IP válida, se guarda `NULL`. La familia de navegador es orientativa: por ejemplo, navegadores basados en Chromium pueden identificarse como Chrome. Las cabeceras pueden ser modificadas por clientes/proxies; no son prueba de identidad ni un mecanismo anti-cheat.

RLS y los permisos de columnas permiten al cliente insertar únicamente su propio `user_id`. Los otros valores se generan en la base. No hay permisos de lectura, modificación o borrado para jugadores; estos registros se consultan administrativamente en Supabase y **no aparecen en ningún leaderboard**. El pie de página informa este registro a los visitantes online.

Si falta la migración o falla el registro, la app continúa online y puede guardar scores. La consola muestra un aviso sin IP, claves ni tokens. Local Mode no registra accesos. Esta tabla no reconstruye visitas anteriores ni elimina automáticamente registros; el administrador puede definir la conservación y borrar los accesos que ya no necesite.

Para revisar los accesos desde el SQL Editor:

```sql
select created_at, user_id, ip_address, browser, user_agent
from public.access_logs
order by created_at desc
limit 50;
```

Para verificar la integración en tu proyecto: jugá una partida, comprobá la fila en `scores`, reiniciá el navegador para comprobar la sesión y abrí la app en otro perfil para ver una segunda identidad. Intentar insertar otro `user_id`, modificar, borrar o fijar `created_at` desde un cliente autenticado debe fallar. La integración real requiere el proyecto y las credenciales públicas; las pruebas locales no sustituyen esa verificación.

## Seguridad

- RLS está habilitado. SELECT requiere el rol `authenticated`; INSERT exige `user_id = auth.uid()`.
- UPDATE y DELETE no tienen policies ni permisos de cliente. Los inserts solo permiten los campos de partida: fecha e ID son generados por la base.
- Las consultas SQL de ranking son `SECURITY INVOKER`, respetan RLS y solo permiten ejecución autenticada.
- La base valida límites de score, duración, problemas, combo, resultado y nickname. El frontend valida antes de enviar y usa `textContent` para mostrar nombres.
- Nunca pongas una `service_role` ni una clave secreta en el frontend. Las variables `VITE_*` son públicas e integran el bundle. Se admite la publishable key moderna, no claves privilegiadas.
- El score es calculado client-side. El MVP evita manipulación accidental, pero no intenta impedir cheating deliberado.
- Las versiones están fijadas en `package.json` y `package-lock.json`. Usá `npm ci` para instalaciones reproducibles y `npm audit` al actualizar. Un audit sin avisos no garantiza la ausencia de vulnerabilidades desconocidas.

No hay analytics, telemetría ni solicitudes externas en Local Mode. Los gráficos son formas Phaser, CSS y SVG originales, sin logos ni imágenes de terceros. Los efectos se sintetizan con Web Audio después de un gesto del usuario. La música se sirve desde `public/audio/`, junto con la aplicación, sin servicios de streaming.

## Música y opciones de audio

El inicio y los resultados reproducen **Dream Culture**; durante la partida suena **Bit Quest**, ambas de **Kevin MacLeod (incompetech.com)** bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Las grabaciones originales están sin modificar y se reproducen en bucle a volumen reducido. Las fuentes, licencia y atribuciones están en [public/audio/README.md](public/audio/README.md) y en las opciones de audio de la app.

La música empieza después de la primera interacción, respetando las restricciones de reproducción automática del navegador. Se pausa al pausar la partida o esconder la pestaña. Al regresar a una partida pausada, hay que continuarla explícitamente. Abrir **Opciones de audio** durante el juego lo pausa.

Desde ese botón del encabezado se puede desactivar **Música de fondo** sin quitar los efectos, o desactivar **Activar audio** para silenciar todo. Se guardan las preferencias `gls:music` y `gls:sound` en el navegador. Los MP3 se cargan cuando corresponde reproducirlos, no antes de la primera interacción. Si el navegador bloquea audio o falla la carga, la partida sigue funcionando.

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

### Versión e idioma

Esta actualización es la **1.3.1**. El footer toma la versión de `package.json`, incorporada al compilar con Vite: identifica el build que está ejecutando el visitante. Para una nueva entrega, actualizá la versión con `npm version patch --no-git-tag-version` (o `minor` para funcionalidades), compilá y publicá `dist/`. El número solo cambia en producción cuando se publica ese build.

El selector del encabezado permite elegir Español o English desde el inicio. Guarda la preferencia en `localStorage` y recarga la interfaz conservando el apodo. Durante la partida y su resultado queda deshabilitado; volvé al inicio para cambiarlo. El idioma inicial es español. Los textos de interfaz, errores, guía, enemigos y mensajes de juego están centralizados en `src/i18n/catalog.ts`; ambas traducciones viajan con la app y funcionan sin base de datos. El nombre propio **Go Live Survivor** se conserva en ambos idiomas.

- `src/game/config/gameConfig.ts`: nombre, subtítulo y equipo; recibe la versión de `package.json`. El título gráfico principal está compuesto en `src/main.ts`.
- `src/game/config/enemies.ts`: etiquetas, colores, estadísticas, aparición y boss.
- `src/game/config/messages.ts`: frases de derrota, fases y easter eggs.
- `src/game/config/balance.ts`: duración, movimiento, ataques, spawn, cooldown, límites y puntos.
- `src/game/systems/ScoreSystem.ts`: reglas del combo y puntuación.
- `src/styles/main.css`: paleta, pantallas y HUD.

La duración del MVP es 90 segundos. Si se cambia, ajustá también las validaciones del repositorio, la migration, el reloj de la UI y los tests. No hay tablas ni UI de achievements: el resumen de partida concentra las métricas para poder agregarlos más adelante.
