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

router.put('/:id', async (req, res) => {
  const { id } = req.params;
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
        'UPDATE contracts SET title = ?, number = ?, amount = ?, startDate = ?, endDate = ? WHERE id = ?'
    );
    const result = await stmt.run(title, number, amount, startDate, endDate, id);
    await stmt.finalize();

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Контракт не найден' });
    }

    res.json({ message: 'Контракт обновлён' });
  } catch (error) {
    console.error('Failed to update contract', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stmt = await db.prepare('DELETE FROM contracts WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Контракт не найден' });
    }

    res.json({ message: 'Контракт удалён' });
  } catch (error) {
    console.error('Failed to delete contract', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
