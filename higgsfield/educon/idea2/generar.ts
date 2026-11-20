// Genera los planos de Higgsfield de la idea 2 de EDUCON a partir de planos.json.
//
// Uso:
//   npm run educon:idea2                  -> solo muestra lo que se enviaría (no gasta créditos)
//   npm run educon:idea2 -- --generar     -> genera los 4 planos
//   npm run educon:idea2 -- --generar A C -> genera solo los planos A y C
//
// Los MP4 se guardan en educon/idea2/salida/ con el nombre del campo "salida".
import { config as loadEnv } from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createHiggsfieldClient,
  HiggsfieldError,
  NotEnoughCreditsError,
  TimeoutError,
} from '@higgsfield/client/v2';

loadEnv({ path: '.env.local', quiet: true });

interface Plano {
  id: string;
  nombre: string;
  foto: string;
  salida: string;
  prompt: string;
}

interface Planos {
  modelo: string;
  url_base_fotos: string;
  comun: Record<string, unknown>;
  planos: Plano[];
}

// Se ejecuta desde la raíz del repositorio (npm run educon:idea2).
const carpeta = join(process.cwd(), 'educon', 'idea2');

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const generar = args.includes('--generar');
  const ids = args.filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());

  const datos = JSON.parse(await readFile(join(carpeta, 'planos.json'), 'utf8')) as Planos;
  const planos = ids.length ? datos.planos.filter((p) => ids.includes(p.id)) : datos.planos;
  if (planos.length === 0) {
    console.error(`Ningún plano coincide con: ${ids.join(', ')}`);
    return 1;
  }

  const peticiones = planos.map((p) => ({
    plano: p,
    input: { ...datos.comun, image_url: datos.url_base_fotos + p.foto, prompt: p.prompt },
  }));

  if (!generar) {
    console.log(`Modo prueba: no se envía nada. Modelo: ${datos.modelo}\n`);
    for (const { plano, input } of peticiones) {
      console.log(`[${plano.id}] ${plano.nombre} -> salida/${plano.salida}`);
      console.log(JSON.stringify(input, null, 2), '\n');
    }
    console.log('Para generar de verdad: npm run educon:idea2 -- --generar');
    return 0;
  }

  const credentials = process.env.HF_CREDENTIALS?.trim();
  if (!credentials || !credentials.includes(':')) {
    console.error('HF_CREDENTIALS falta o no tiene el formato key-id:key-secret. Ponlo en .env.local.');
    return 1;
  }
  const client = createHiggsfieldClient({ credentials, maxPollTime: 15 * 60 * 1000 });

  await mkdir(join(carpeta, 'salida'), { recursive: true });
  let fallos = 0;

  // Uno a uno: si falta saldo o algo falla, se detiene sin lanzar el resto a ciegas.
  for (const { plano, input } of peticiones) {
    console.log(`[${plano.id}] Enviando "${plano.nombre}"...`);
    const res = await client.subscribe(datos.modelo, { input, withPolling: true });
    const estado = res.status as string;
    const url = res.video?.url;
    if (estado !== 'completed' || !url) {
      console.error(`[${plano.id}] Terminó con estado "${estado}" (petición ${res.request_id}).`);
      fallos++;
      continue;
    }
    const descarga = await fetch(url);
    if (!descarga.ok) {
      console.error(`[${plano.id}] Vídeo generado pero no se pudo descargar (${descarga.status}): ${url}`);
      fallos++;
      continue;
    }
    const destino = join(carpeta, 'salida', plano.salida);
    await writeFile(destino, Buffer.from(await descarga.arrayBuffer()));
    console.log(`[${plano.id}] Listo: ${destino}`);
  }

  return fallos ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    if (err instanceof NotEnoughCreditsError) {
      console.error('HTTP 403: faltan créditos de API, o la red bloquea api.higgsfield.ai.');
    } else if (err instanceof TimeoutError) {
      console.error(`Tiempo de espera agotado (la petición puede seguir en el servidor): ${err.message}`);
    } else if (err instanceof HiggsfieldError) {
      console.error(`${err.name}: ${err.message}`);
    } else {
      console.error('Error inesperado:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  });
