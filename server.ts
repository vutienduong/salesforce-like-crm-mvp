import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './server/app';
import { openDatabase } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const db = await openDatabase(__dirname);
  const app = await createApp({
    db,
    rootDir: __dirname,
    isProduction: process.env.NODE_ENV === 'production',
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
