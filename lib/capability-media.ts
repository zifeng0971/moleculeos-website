import fs from 'node:fs';
import path from 'node:path';
import capabilities from '@/content/mock/capabilities.json';

// Resolve availability during SSG/dev rendering: absent recordings never issue a 404.
// Add approved files to public/demo and rebuild the static site to publish them.
export function availableCapabilityMedia() {
  return capabilities.tasks.filter(task => fs.existsSync(path.join(process.cwd(), 'public', task.media))).map(task => task.media);
}
