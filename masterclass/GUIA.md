# Página de lanzamiento de la masterclass: guía de montaje

## Las piezas y cómo se conectan

```
[Página web (index.html)] ──registro──▶ [Apps Script] ──guarda──▶ [Google Sheets]
        │                                                              │
        └──redirige──▶ [Grupo de WhatsApp]      [Disparador programado] ┘
                                                 envía el correo 30 min antes
```

- **index.html**: lo que ve la gente (contador, formulario, botón).
- **Google Sheets**: la base de datos con los registrados.
- **Apps Script**: el "mensajero" gratuito de Google que recibe los datos y envía los correos.

Un HTML por sí solo **no puede enviar correos ni guardar datos**: necesita algo detrás. Por eso usamos Apps Script.

## Paso 1: editar la configuración de la página
En `index.html`, busca el bloque `CONFIG` y cambia:
- `inicio`: fecha y hora de inicio del contador, con tu zona horaria (`-05:00` = Colombia).
- `whatsapp`: enlace de invitación del grupo (WhatsApp → grupo → Invitar mediante enlace).
- `appsScriptUrl`: se obtiene en el paso 3.

## Paso 2: crear la hoja
1. Crea un Google Sheets nuevo.
2. Extensiones → Apps Script.
3. Borra lo que haya y pega el contenido de `apps-script.gs`.
4. Edita la CONFIGURACIÓN de arriba (hora de la masterclass, enlaces).

## Paso 3: publicar el script
1. Implementar → Nueva implementación → tipo **Aplicación web**.
2. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
3. Autoriza los permisos y copia la URL que termina en `/exec`. Pégala en `appsScriptUrl`.

## Paso 4: programar el recordatorio
En el editor de Apps Script, elige `programarRecordatorio` y pulsa ▶ Ejecutar. Una sola vez.

## Paso 5: probar
Regístrate tú con tu correo y comprueba que aparece en la hoja y que te lleva a WhatsApp.
Para probar el correo sin esperar, ejecuta `enviarRecordatorios` a mano.

## Paso 6: publicar la web
Opción recomendada: **Netlify Drop** (app.netlify.com/drop): arrastras la carpeta y te da un enlace.
Alternativas: GitHub Pages, Vercel.

## Límite importante de correos
Google limita cuántos correos puede enviar Apps Script al día (aprox. 100 con Gmail gratuito,
más con Google Workspace). Ejecuta `verCuotaRestante` para ver tu número real.
Si esperas más registros, usa un servicio de email marketing (Brevo, MailerLite…) para el recordatorio.
