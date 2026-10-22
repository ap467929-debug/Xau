import { config as loadEnv } from 'dotenv';
import {
  createHiggsfieldClient,
  HiggsfieldError,
  NotEnoughCreditsError,
  TimeoutError,
} from '@higgsfield/client/v2';

// Load HF_CREDENTIALS (key-id:key-secret) from .env.local at runtime. Never log it.
loadEnv({ path: '.env.local', quiet: true });

const MODEL = 'bytedance/seedance-2.5/text-to-video';

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS?.trim();
  if (!credentials || !credentials.includes(':')) {
    console.error('HF_CREDENTIALS is missing or not in key-id:key-secret format. Set it in .env.local.');
    return 1;
  }

  const client = createHiggsfieldClient({
    credentials,
    // Video generation can take several minutes; the SDK default is 5 minutes.
    maxPollTime: 15 * 60 * 1000,
  });

  console.log(`Submitting ${MODEL} request...`);
  const result = await client.subscribe(MODEL, {
    input: {
      prompt: 'A cinematic scene at sunset',
      duration: 5,
      resolution: '720p',
      aspect_ratio: '16:9',
    },
    withPolling: true,
  });

  // The SDK types omit 'canceled', but the API can return it.
  const status = result.status as string;
  console.log(`Request ${result.request_id} finished with status: ${status}`);

  switch (status) {
    case 'completed': {
      const url = result.video?.url;
      if (!url) {
        console.error('Request completed but no video URL was returned.');
        return 1;
      }
      console.log(`Video URL: ${url}`);
      return 0;
    }
    case 'nsfw':
      console.error('Request was rejected by content moderation (credits refunded).');
      return 1;
    case 'failed':
      console.error('Generation failed (credits refunded).');
      return 1;
    case 'canceled':
      console.error('Request was canceled.');
      return 1;
    default:
      console.error(`Unexpected status: ${status}`);
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    if (err instanceof NotEnoughCreditsError) {
      // The SDK maps every HTTP 403 to this error, including a proxy/firewall blocking api.higgsfield.ai.
      console.error('HTTP 403: not enough credits, or access to api.higgsfield.ai is blocked by the network.');
    } else if (err instanceof TimeoutError) {
      console.error(`Timed out waiting for the result (the request may have been canceled): ${err.message}`);
    } else if (err instanceof HiggsfieldError) {
      console.error(`${err.name}: ${err.message}`);
    } else {
      console.error('Unexpected error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  });
