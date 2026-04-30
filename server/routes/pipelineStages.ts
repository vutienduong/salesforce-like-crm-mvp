import { Router } from 'express';
import type { CrmDatabase } from '../types';

export function createPipelineStagesRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const stages = await db.all('SELECT * FROM pipeline_stages ORDER BY order_index');
      res.json(stages);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
