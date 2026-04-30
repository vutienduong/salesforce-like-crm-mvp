import { Router } from 'express';
import type { CrmDatabase } from '../types';

export function createDashboardRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/stats', async (_req, res, next) => {
    try {
      const totalDeals = await db.get<{ count: number; value: number | null }>(
        'SELECT COUNT(*) as count, SUM(value) as value FROM deals WHERE status = "open"',
      );
      const wonDeals = await db.get<{ count: number; value: number | null }>(
        'SELECT COUNT(*) as count, SUM(value) as value FROM deals WHERE status = "won" OR stage_id = "stage_5"',
      );
      const totalContacts = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM contacts');
      const pendingActivities = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM activities WHERE status = "Pending"',
      );
      const dealsByStage = await db.all<{ name: string; count: number; value: number | null }[]>(`
        SELECT s.name, COUNT(d.id) as count, SUM(d.value) as value
        FROM pipeline_stages s
        LEFT JOIN deals d ON s.id = d.stage_id
        GROUP BY s.id
        ORDER BY s.order_index
      `);

      res.json({
        totalPipelineValue: totalDeals?.value || 0,
        wonValue: wonDeals?.value || 0,
        totalContacts: totalContacts?.count || 0,
        pendingActivities: pendingActivities?.count || 0,
        dealsByStage,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
