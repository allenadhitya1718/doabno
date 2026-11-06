import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue';

// ISR is purely time based here (revalidate = 900, no revalidateTag/revalidatePath calls anywhere),
// so no tag cache is needed. The memory queue triggers the re-render through the WORKER_SELF_REFERENCE binding.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: memoryQueue,
  tagCache: 'dummy',
});
