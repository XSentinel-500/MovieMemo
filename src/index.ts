import { app } from './lib/agent';
import { serveStatic } from 'hono/bun';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Serve static HTML frontend from public directory
app.get('/', (c) => c.redirect('/index.html'));
// Hono type versions may differ between @lucid-agents/hono and hono/bun.
// This cast keeps runtime behavior while avoiding TS false-positives.
app.use('/*', serveStatic({ root: './public' }) as any);

console.log(`Starting agent server on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120,  // Increased timeout for slow LLM calls
};
