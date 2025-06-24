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
  const { title, number, amount, startDate, endDate, downPayment, interestRate, termMonths, monthlyPayment, type, clientId } = req.body;
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
  if (!clientId || isNaN(Number(clientId))) {
    return res.status(400).json({ message: 'Неверный clientId' });
  }
  try {
    const stmt = await db.prepare(
        'INSERT INTO contracts (title, number, amount, startDate, endDate, downPayment, interestRate, termMonths, monthlyPayment, type, clientId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    await stmt.run(title, number, amount, startDate, endDate, downPayment, interestRate, termMonths, monthlyPayment, type, clientId);
    await stmt.finalize();
    res.status(201).json({ message: 'Контракт добавлен' });
  } catch (error) {
    console.error('Failed to add contract', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, number, amount, startDate, endDate, downPayment, interestRate, termMonths, monthlyPayment, type, clientId } = req.body;
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
  if (!clientId || isNaN(Number(clientId))) {
    return res.status(400).json({ message: 'Неверный clientId' });
  }
  try {
    const stmt = await db.prepare(
        'UPDATE contracts SET title = ?, number = ?, amount = ?, startDate = ?, endDate = ?, downPayment = ?, interestRate = ?, termMonths = ?, monthlyPayment = ?, type = ?, clientId = ? WHERE id = ?'
    );
    const result = await stmt.run(title, number, amount, startDate, endDate, downPayment, interestRate, termMonths, monthlyPayment, type, clientId, id);
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

// Маршрут для расчёта платежей по контракту
router.post('/:id/calculate', async (req, res) => {
  const { id } = req.params;
  const { downPaymentRate = 0.2, interestRate = 0.12, durationMonths = 36 } = req.body;

  try {
    const contract = await db.get('SELECT amount FROM contracts WHERE id = ?', id);
    if (!contract) {
      return res.status(404).json({ message: 'Контракт не найден' });
    }

    const amount = contract.amount;
    const downPayment = amount * downPaymentRate;
    const financedAmount = amount - downPayment;
    const monthlyInterestRate = interestRate / 12;
    const monthlyPayment = (financedAmount * monthlyInterestRate) /
                            (1 - Math.pow(1 + monthlyInterestRate, -durationMonths));
    const totalPayment = monthlyPayment * durationMonths;

    res.json({
      downPayment: Math.round(downPayment * 100) / 100,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100
    });
  } catch (error) {
    console.error('Failed to calculate payments', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отдельный маршрут для продления контракта
router.post('/:id/extend', async (req, res) => {
  const { id } = req.params;
  const { newEndDate } = req.body;

  if (!newEndDate || isNaN(Date.parse(newEndDate))) {
    return res.status(400).json({ message: 'Некорректная дата' });
  }

  try {
    const stmt = await db.prepare('UPDATE contracts SET endDate = ? WHERE id = ?');
    await stmt.run(newEndDate, id);
    await stmt.finalize();

    res.json({ message: 'Срок контракта продлён', newEndDate });
  } catch (error) {
    console.error('Ошибка при продлении контракта', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отдельный маршрут для передачи права собственности
router.post('/:id/transfer-ownership', async (req, res) => {
  const { id } = req.params;
  const { newClientId } = req.body;

  if (!newClientId || isNaN(Number(newClientId))) {
    return res.status(400).json({ message: 'Неверный clientId' });
  }

  try {
    const contract = await db.get('SELECT * FROM contracts WHERE id = ?', id);
    if (!contract) {
      return res.status(404).json({ message: 'Контракт не найден' });
    }

    if (Number(newClientId) === contract.clientId) {
      return res.status(400).json({ message: 'Нельзя передать контракт текущему владельцу' });
    }

    const stmt = await db.prepare('UPDATE contracts SET clientId = ? WHERE id = ?');
    await stmt.run(newClientId, id);
    await stmt.finalize();

    res.json({ message: 'Право собственности передано новому клиенту' });
  } catch (error) {
    console.error('Ошибка при передаче контракта', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для загрузки документа к контракту
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const contractUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = `uploads/contracts/${req.params.id}`;
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  })
});

router.post('/:id/documents', contractUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл не загружен' });
  }

  const filePath = `contracts/${req.params.id}/${req.file.originalname}`;
  try {
    const stmt = await db.prepare(
      'INSERT INTO contract_documents (contractId, filename, filepath) VALUES (?, ?, ?)'
    );
    await stmt.run(req.params.id, req.file.originalname, filePath);
    await stmt.finalize();
    res.status(201).json({ message: 'Документ загружен', filename: req.file.originalname });
  } catch (error) {
    console.error('Ошибка при загрузке документа', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка документов
router.get('/:id/documents', async (req, res) => {
  try {
    const docs = await db.all(
      'SELECT id, filename FROM contract_documents WHERE contractId = ?',
      req.params.id
    );
    res.json(docs);
  } catch (error) {
    console.error('Ошибка при получении документов', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Загрузка документа по имени
router.get('/:id/documents/:filename', (req, res) => {
  const filePath = path.join('uploads/contracts', req.params.id, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ message: 'Файл не найден' });
  }
});

// POST route to apply a payment to a contract
router.post('/:id/apply-payment', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || isNaN(Number(amount))) {
    return res.status(400).json({ error: 'Неверная сумма платежа' });
  }

  try {
    const contract = await db.get('SELECT * FROM contracts WHERE id = ?', id);
    if (!contract) {
      return res.status(404).json({ error: 'Контракт не найден' });
    }

    const remainingBalance = contract.remainingBalance ?? contract.amount;
    const newRemainingBalance = remainingBalance - Number(amount);

    const stmt = await db.prepare('UPDATE contracts SET remainingBalance = ? WHERE id = ?');
    await stmt.run(newRemainingBalance, id);
    await stmt.finalize();

    res.json({ message: 'Платёж применён', newRemainingBalance });
  } catch (error) {
    console.error('Ошибка при применении платежа к контракту', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Расчёт просрочки и штрафа
router.post('/:id/calculate-penalty', async (req, res) => {
  const { id } = req.params;
  if (typeof req.body !== 'object' || req.body === null) {
    return res.status(400).json({ error: 'Некорректный формат тела запроса' });
  }
  const { dueDate, paymentDate, penaltyRate = 0.01 } = req.body ?? {};

  if (!dueDate || !paymentDate || isNaN(Date.parse(dueDate)) || isNaN(Date.parse(paymentDate))) {
    return res.status(400).json({ error: 'Некорректные даты' });
  }

  try {
    const due = new Date(dueDate);
    const paid = new Date(paymentDate);

    if (paid <= due) {
      return res.json({ lateDays: 0, penalty: 0 });
    }

    const lateDays = Math.ceil((paid - due) / (1000 * 60 * 60 * 24));
    const contract = await db.get('SELECT remainingBalance FROM contracts WHERE id = ?', id);

    if (!contract) {
      return res.status(404).json({ error: 'Контракт не найден' });
    }

    const balance = contract.remainingBalance ?? 0;
    const penalty = Math.round(balance * penaltyRate * lateDays * 100) / 100;

    res.json({ lateDays, penalty });
  } catch (error) {
    console.error('Ошибка при расчёте штрафа', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление документа
router.delete('/:id/documents/:filename', async (req, res) => {
  const filePath = path.join('uploads/contracts', req.params.id, req.params.filename);
  try {
    fs.unlinkSync(filePath);
    const stmt = await db.prepare(
      'DELETE FROM contract_documents WHERE contractId = ? AND filename = ?'
    );
    await stmt.run(req.params.id, req.params.filename);
    await stmt.finalize();
    res.json({ message: 'Документ удалён' });
  } catch (error) {
    console.error('Ошибка при удалении документа', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});
