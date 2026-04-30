import { Router } from 'express';
import type { CrmDatabase } from '../types';

export function createAccountsRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const accounts = await db.all('SELECT * FROM accounts ORDER BY name');
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { name, industry, size, owner_id } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Account name is required.' });
      }

      const id = `acc_${Date.now()}`;
      await db.run(
        'INSERT INTO accounts (id, name, industry, size, owner_id) VALUES (?, ?, ?, ?, ?)',
        [id, name.trim(), industry?.trim() || null, size?.trim() || null, owner_id || 'user_1'],
      );

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
