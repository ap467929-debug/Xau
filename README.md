# XAU · Página de lanzamiento de masterclass

Landing en HTML5 con contador de 24 horas, registro, acceso al grupo de WhatsApp
y recordatorio automático por correo 30 minutos antes. Se puede mantener **entero desde el iPad**.

## Qué hay en el repositorio

| Carpeta / archivo | Qué es | ¿Lo tocas? |
|---|---|---|
| `web/config.js` | Textos de la página (título, puntos, botón…) | ✏️ Sí, para cambiar textos |
| `web/index.html` | Estructura de la página | Rara vez |
| `web/css/estilos.css` | Colores y diseño (arriba están los colores) | Solo si cambias la estética |
| `web/js/app.js` | Lógica: contador y registro | No |
| `apps-script/Codigo.gs` | Código que se pega en Google Sheets | Solo al instalar |
| `netlify.toml` | Le dice a Netlify que publique solo `web/` | No |
| `higgsfield/` | Proyecto anterior de generación de vídeo (EDUCON). Se ejecuta con `cd higgsfield && npm install && npm run educon:idea2` | — |

## Cómo funciona

```
Página web ──registro──▶ Apps Script ──guarda──▶ Google Sheets (pestaña "Registros")
   │   ▲                                           │
   │   └──lee fechas y enlaces── pestaña "Config" ─┘
   └──▶ Grupo de WhatsApp        Cada 5 min: ¿faltan 30 min? → envía el correo
```

Las fechas, los enlaces y abrir/cerrar registro están en la **pestaña "Config" de la hoja de Google**.
Por eso se cambian desde la app de Google Sheets sin tocar código.

---

## Instalación (una sola vez, ~20 minutos)

> En iPad, Apps Script funciona en **Safari** (no en la app de Sheets). Si Safari te manda a la app,
> mantén pulsado el enlace → "Abrir en pestaña nueva", o pide la versión de escritorio (botón "aA" → "Solicitar sitio web de escritorio").

### 1. Crear la hoja y el script
1. Entra en sheets.google.com y crea una hoja en blanco (por ejemplo "Masterclass – Registros").
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya y pega todo el contenido de `apps-script/Codigo.gs`. Guarda (icono de disquete).
4. Arriba, en el selector de funciones, elige **`instalar`** y pulsa **▶ Ejecutar**.
   Google pedirá permisos: es tu propio script, acéptalos ("Configuración avanzada → Ir a…").
5. Vuelve a la hoja: verás las pestañas **Config** y **Registros**.

### 2. Rellenar la pestaña Config
| Clave | Ejemplo | Para qué |
|---|---|---|
| `modo` | `fijo` o `diario` | Fijo = un lanzamiento único. Diario = se repite cada día |
| `inicio` | `2026-11-20 20:00` | Cuándo arranca el contador (modo fijo) |
| `duracionHoras` | `24` | Duración; la clase empieza al terminar |
| `horaDiaria` | `20:00` | Hora de la clase cada día (modo diario) |
| `zona` | `-05:00` | Zona horaria |
| `whatsapp` | `https://chat.whatsapp.com/…` | Enlace del grupo |
| `linkDirecto` | `https://zoom.us/…` | Enlace de la transmisión para el correo |
| `minutosAntes` | `30` | Antelación del recordatorio |
| `registroAbierto` | `SI` / `NO` | Interruptor manual |

### 3. Publicar el script como "Aplicación web"
1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**. Ejecutar como: **Yo**. Acceso: **Cualquier usuario**.
3. Copia la URL que termina en `/exec`.
4. Pégala en `web/config.js`, en `appsScriptUrl: "…"`.

> Si más adelante cambias el código del script: **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva**.
> Así la URL no cambia. (Para cambiar la pestaña Config no hace falta hacer esto.)

### 4. Publicar la web en Netlify (gratis, se actualiza sola)
1. Crea una cuenta en netlify.com con tu cuenta de GitHub.
2. **Add new site → Import an existing project → GitHub →** elige el repositorio `Xau`.
3. En "Branch to deploy", elige la rama donde esté la web.
4. Netlify lee `netlify.toml` y publica solo la carpeta `web`. Te da un enlace `algo.netlify.app`,
   que puedes renombrar en *Site configuration → Change site name*.

Desde ese momento, **cada cambio que se guarde en GitHub se publica solo en ~1 minuto**.

### 5. Probar
- Abre la web, regístrate con tu correo → debe aparecer en la pestaña Registros y llevarte a WhatsApp.
- Para probar el correo sin esperar: en Apps Script ejecuta **`enviarRecordatorios`**.
- Para ver tu límite de correos: ejecuta **`verCuotaRestante`** y mira el registro de ejecución.

---

## Mantenimiento desde el iPad

| Quiero… | Dónde | Cómo |
|---|---|---|
| Cambiar fecha u hora, o pasar a modo diario | App **Google Sheets** | Pestaña Config, columna Valor. Efecto inmediato |
| Cambiar el enlace de WhatsApp o de la transmisión | App **Google Sheets** | Pestaña Config |
| Cerrar el registro ya | App **Google Sheets** | `registroAbierto` → `NO` |
| Ver quién se registró / exportar | App **Google Sheets** | Pestaña Registros |
| Cambiar textos (título, puntos, botón) | **github.com** en Safari | Abre `web/config.js` → ✏️ (lápiz) → edita → *Commit changes* |
| Cambiar diseño o pedir algo nuevo | **Claude Code** (app de Claude o claude.ai/code) | Pídelo en español; Claude edita, guarda en GitHub y Netlify publica |

### Repetir el lanzamiento otra vez
Pon una nueva fecha en `inicio` (modo fijo). Si quieres que los registrados anteriores vuelvan a recibir
correo, borra el texto de su columna "Recordatorio" (o escribe `pendiente`).

## Límites que debes conocer
- **Correos**: Google limita los envíos diarios de Apps Script (en Gmail gratuito, en torno a 100 destinatarios/día;
  más con Google Workspace). Comprueba tu cifra real con `verCuotaRestante`. Si superas el límite, los que falten
  quedan marcados como `sin cuota hoy`. Para volúmenes grandes, conviene un servicio de email marketing.
- **Modo diario**: los registrados reciben un único recordatorio, para la próxima clase. Si vuelven a registrarse otro día,
  se les vuelve a programar.
- El correo puede llegar con hasta 5 minutos de margen (el script revisa cada 5 minutos).
