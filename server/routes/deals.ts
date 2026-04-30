import { Router } from 'express';
import type { CrmDatabase } from '../types';

function getDealStatus(stageId: string) {
  if (stageId === 'stage_5') {
    return 'won';
  }

  if (stageId === 'stage_6') {
    return 'lost';
  }

  return 'open';
}

export function createDealsRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const deals = await db.all(`
        SELECT d.*, a.name as account_name, s.name as stage_name
        FROM deals d
        LEFT JOIN accounts a ON d.account_id = a.id
        LEFT JOIN pipeline_stages s ON d.stage_id = s.id
      `);
      res.json(deals);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { name, value, stage_id, account_id, owner_id, close_date } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Deal name is required.' });
      }

      if (!account_id) {
        return res.status(400).json({ error: 'Account is required.' });
      }

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return res.status(400).json({ error: 'Deal value must be greater than 0.' });
      }

      const stage = await db.get<{ probability: number }>(
        'SELECT probability FROM pipeline_stages WHERE id = ?',
        [stage_id],
      );

      if (!stage) {
        return res.status(400).json({ error: 'A valid pipeline stage is required.' });
      }

      const id = `deal_${Date.now()}`;
      await db.run(
        'INSERT INTO deals (id, name, value, stage_id, account_id, owner_id, probability, close_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          name.trim(),
          numericValue,
          stage_id,
          account_id,
          owner_id || 'user_1',
          stage.probability,
          close_date || null,
          getDealStatus(stage_id),
        ],
      );

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const deal = await db.get(
        `
          SELECT d.*, a.name as account_name, s.name as stage_name
          FROM deals d
          LEFT JOIN accounts a ON d.account_id = a.id
          LEFT JOIN pipeline_stages s ON d.stage_id = s.id
          WHERE d.id = ?
        `,
        [req.params.id],
      );

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json(deal);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/history', async (req, res, next) => {
    try {
      const history = await db.all(
        `
          SELECT h.*,
                 s1.name as old_stage_name,
                 s2.name as new_stage_name,
                 u.name as changed_by_name
          FROM deal_stage_history h
          LEFT JOIN pipeline_stages s1 ON h.old_stage_id = s1.id
          LEFT JOIN pipeline_stages s2 ON h.new_stage_id = s2.id
          LEFT JOIN users u ON h.changed_by = u.id
          WHERE h.deal_id = ?
          ORDER BY h.changed_at DESC
        `,
        [req.params.id],
      );

      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/stage', async (req, res, next) => {
    try {
      const { stage_id } = req.body;
      const currentDeal = await db.get<{ stage_id: string }>('SELECT stage_id FROM deals WHERE id = ?', [req.params.id]);

      if (!currentDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      const stage = await db.get<{ probability: number }>(
        'SELECT probability FROM pipeline_stages WHERE id = ?',
        [stage_id],
      );

      if (!stage) {
        return res.status(400).json({ error: 'A valid pipeline stage is required.' });
      }

      if (currentDeal.stage_id !== stage_id) {
        const historyId = `hist_${Date.now()}`;
        await db.run(
          'INSERT INTO deal_stage_history (id, deal_id, old_stage_id, new_stage_id, changed_by) VALUES (?, ?, ?, ?, ?)',
          [historyId, req.params.id, currentDeal.stage_id, stage_id, 'user_1'],
        );
      }

      await db.run(
        'UPDATE deals SET stage_id = ?, probability = ?, status = ? WHERE id = ?',
        [stage_id, stage.probability, getDealStatus(stage_id), req.params.id],
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
