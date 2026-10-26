# EDUCON Medellín · Idea 2 · Planos de Higgsfield

Cuatro clips de 5 s generados a partir de fotos reales de la casa (imagen a vídeo), para el reel «La experiencia». Los prompts están aprobados por Mauricio (2026-10-26).

## Cómo generarlos

1. Copia `.env.example` a `.env.local` y pon tu clave de API: `HF_CREDENTIALS=key-id:key-secret` (se crea en console.higgsfield.ai). Nunca la subas al repositorio.
2. Comprueba lo que se va a enviar, sin gastar créditos:
   ```bash
   npm run educon:idea2
   ```
3. Genera los 4 planos:
   ```bash
   npm run educon:idea2 -- --generar
   ```
   O solo algunos: `npm run educon:idea2 -- --generar A C`
4. Los MP4 quedan en `educon/idea2/salida/` (Git los ignora).

El script los genera uno a uno y se detiene si falta saldo, para no lanzar el resto a ciegas.

## Configuración

| Parámetro | Valor |
| --- | --- |
| Modelo (API) | `kling-video/v3.0/std/image-to-video` (Kling 3.0 Standard) |
| Duración | 5 s |
| Sonido | `off` (la música va en el montaje) |
| `cfg_scale` | 0,5 (valor por defecto) |
| Foto | `image_url`: URL pública en este repositorio (`url_base_fotos` en `planos.json`) |

Todo se edita en `planos.json`: prompts, fotos y parámetros.

**Coste:** la API de Higgsfield cobra con su propio saldo, separado del de la app. Consulta el precio en console.higgsfield.ai antes de generar. Como referencia, en la app Kling 3.0 Standard costaba 7,5 créditos por clip (30 los 4), verificado el 2026-10-26. La API no ofrece el modo Pro de la app.

## Planos

| ID | Foto | Uso en el reel | Salida |
| --- | --- | --- | --- |
| A | `fotos/A_piscina_atardecer.jpg` | Frase 2, plano estrella | `A_piscina_atardecer.mp4` |
| B | `fotos/B_entrada.jpg` | Frase 1, gancho | `B_entrada.mp4` |
| C | `fotos/C_graderia_noche.jpg` | Frase 7, tras Los Ángeles | `C_graderia_noche.mp4` |
| D | `fotos/D_terraza_camastros.jpg` | Frase 2, segunda mitad | `D_terraza_camastros.mp4` |

## Reglas

1. **Solo movimiento de cámara.** Nada de personas, objetos, luces ni texto nuevos: la casa debe verse tal como es.
2. **Un intento por plano.** Si un clip sale mal, se revisa antes de gastar otro.
3. Las fotos son 3:2 y este modelo de la API no tiene parámetro de formato: usa la foto como primer fotograma. Revisa la proporción del primer clip antes de generar el resto.
4. Las fotos de este repositorio son públicas, porque la API necesita una URL accesible. Si el repositorio pasa a privado, hay que alojar las fotos en otro sitio y cambiar `url_base_fotos`.

## Criterios para aprobar cada clip

- La arquitectura, el mobiliario y la iluminación coinciden con la foto.
- Movimiento lento, continuo y sin temblores.
- Sin deformaciones en bordes rectos (barandas, marcos, escalones).
- Sin objetos ni personas que no estén en la foto.

## Integración

Los clips se montan en el reel vertical (1080×1920) como banda panorámica sobre fondo negro, con texto dorado, y se unen con las escenas de motion pendientes de material: Los Ángeles, foto de Daniela y captura de Andrés operando.
