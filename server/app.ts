import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createAccountsRouter } from './routes/accounts';
import { createActivitiesRouter } from './routes/activities';
import { createContactsRouter } from './routes/contacts';
import { createDashboardRouter } from './routes/dashboard';
import { createDealsRouter } from './routes/deals';
import { createPipelineStagesRouter } from './routes/pipelineStages';
import type { CrmDatabase } from './types';

type CreateAppOptions = {
  db: CrmDatabase;
  rootDir: string;
  isProduction: boolean;
};

export async function createApp({ db, rootDir, isProduction }: CreateAppOptions) {
  const app = express();

  app.use(express.json());

  app.use('/api/dashboard', createDashboardRouter(db));
  app.use('/api/accounts', createAccountsRouter(db));
  app.use('/api/contacts', createContactsRouter(db));
  app.use('/api/pipeline-stages', createPipelineStagesRouter(db));
  app.use('/api/deals', createDealsRouter(db));
  app.use('/api/activities', createActivitiesRouter(db));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  });

  return app;
}
