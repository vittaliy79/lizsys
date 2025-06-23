import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();
const db = await getDb();

router.get('/', async (req, res) => {
  try {
    const contracts = await db.all('SELECT * FROM contracts ORDER BY id DESC');
    res.json(contracts);
  } catch (error) {
    console.error('Failed to get contracts', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/', async (req, res) => {
  const { title, number, amount, startDate, endDate } = req.body;
  if (
      !title ||
      !number ||
      !amount ||
      !startDate ||
      !endDate ||
      typeof title !== 'string' ||
      typeof number !== 'string' ||
      isNaN(Number(amount)) ||
      !Date.parse(startDate) ||
      !Date.parse(endDate)
  ) {
    return res.status(400).json({ message: 'Неверные данные' });
  }
  try {
    const stmt = await db.prepare(
        'INSERT INTO contracts (title, number, amount, startDate, endDate) VALUES (?, ?, ?, ?, ?)'
    );
    await stmt.run(title, number, amount, startDate, endDate);
    await stmt.finalize();
    res.status(201).json({ message: 'Контракт добавлен' });
  } catch (error) {
    console.error('Failed to add contract', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
