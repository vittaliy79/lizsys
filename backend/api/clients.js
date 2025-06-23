import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// Получить список клиентов
router.get('/', async (req, res) => {
  const db = await getDb();
  const clients = await db.all('SELECT * FROM clients ORDER BY id DESC');
  res.json(clients);
});

// Добавить клиента
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
    [name, email, phone]
  );
  const newClient = { id: result.lastID, name, email, phone };
  res.status(201).json(newClient);
});

// Обновить клиента по ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const db = await getDb();
  const result = await db.run(
    'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?',
    [name, email, phone, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json({ id, name, email, phone });
});

// Удалить клиента по ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const result = await db.run('DELETE FROM clients WHERE id = ?', [id]);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json({ success: true });
});

export default router;
