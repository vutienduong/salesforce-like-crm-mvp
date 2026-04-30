import { Router } from 'express';
import type { CrmDatabase } from '../types';

function safeParseTags(tags: string | null) {
  if (!tags) {
    return [];
  }

  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

export function createContactsRouter(db: CrmDatabase) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const contacts = await db.all(`
        SELECT c.*, a.name as account_name
        FROM contacts c
        LEFT JOIN accounts a ON c.account_id = a.id
        ORDER BY c.created_at DESC
      `);

      res.json(contacts.map((contact: any) => ({ ...contact, tags: safeParseTags(contact.tags) })));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { first_name, last_name, email, phone, account_id, owner_id, tags } = req.body;

      if (!first_name?.trim() || !last_name?.trim()) {
        return res.status(400).json({ error: 'First name and last name are required.' });
      }

      const id = `con_${Date.now()}`;
      await db.run(
        'INSERT INTO contacts (id, first_name, last_name, email, phone, account_id, owner_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          first_name.trim(),
          last_name.trim(),
          email?.trim() || null,
          phone?.trim() || null,
          account_id || null,
          owner_id || 'user_1',
          JSON.stringify(Array.isArray(tags) ? tags : []),
        ],
      );

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
