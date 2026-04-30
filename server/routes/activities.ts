import { Router } from 'express';
import type { CrmDatabase } from '../types';

export function createActivitiesRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const activities = await db.all('SELECT * FROM activities ORDER BY due_date ASC');
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { type, subject, due_date, status, related_to_type, related_to_id, owner_id } = req.body;

      const id = `act_${Date.now()}`;
      await db.run(
        'INSERT INTO activities (id, type, subject, due_date, status, related_to_type, related_to_id, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, type, subject, due_date, status, related_to_type, related_to_id, owner_id],
      );

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = req.body;

      await db.run('UPDATE activities SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
