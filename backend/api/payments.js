import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();
const db = await getDb();

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to find contract by ID
async function findContractById(contractId) {
  const result = await db.get('SELECT * FROM contracts WHERE id = ?', [contractId]);
  return result;
}

// Helper function to calculate late fees
function calculateLateFee(dueDate, paymentDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const lateDays = Math.floor((paymentDate - dueDate) / msPerDay);
  if (lateDays > 0) {
    // Example late fee: $5 per day late
    return lateDays * 5;
  }
  return 0;
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // We will create the directory after payment is created, so use a temp folder first
    const tempDir = path.join(__dirname, 'uploads', 'payments', 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  }
});

// POST route to add a new payment
router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    const { clientId, contractId, amount, date } = req.body;
    if (!clientId || !contractId || !amount || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contract = await findContractById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const paymentDate = new Date(date);
    const dueDate = new Date(contract.dueDate || contract.startDate); // Assuming contract has dueDate or startDate

    // Calculate late fee if any
    const lateFee = calculateLateFee(dueDate, paymentDate);

    // Update contract remaining balance
    const newRemainingBalance = (contract.remainingBalance || contract.totalAmount) - amount;
    await db.run('UPDATE contracts SET remainingBalance = ? WHERE id = ?', [newRemainingBalance, contractId]);

    // Move receipt file from temp to payment folder
    let newPath = null;
    if (req.file) {
      // We don't have paymentId yet, so insert first without receiptPath, then update after moving file
      // But since we need paymentId for folder, insert without receiptPath first, then update
      // So we do insert first with null receiptPath, then move file, then update receiptPath

      // Insert payment without receipt info first
      const result = await db.run(
        'INSERT INTO payments (clientId, contractId, amount, date, lateFee, receiptPath, receiptType) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [clientId, contractId, amount, date, lateFee, null, null]
      );
      const paymentId = result.lastID;

      const paymentDir = path.join(__dirname, 'uploads', 'payments', String(paymentId));
      fs.mkdirSync(paymentDir, { recursive: true });
      newPath = path.join(paymentDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);

      // Update payment with receipt info
      const receiptType = req.file.mimetype.split('/')[1];
      await db.run(
        'UPDATE payments SET receiptPath = ?, receiptType = ? WHERE id = ?',
        [newPath, receiptType, paymentId]
      );

      const payment = {
        id: paymentId,
        clientId,
        contractId,
        amount: Number(amount),
        date: paymentDate,
        lateFee,
        receiptFilename: req.file.filename
      };

      // Stub: Send email or SMS notification (to be implemented)
      // sendNotification(clientId, payment);

      return res.status(201).json(payment);
    } else {
      // No receipt file uploaded
      // Insert payment without receipt info
      const result = await db.run(
        'INSERT INTO payments (clientId, contractId, amount, date, lateFee, receiptPath, receiptType) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [clientId, contractId, amount, date, lateFee, null, null]
      );
      const paymentId = result.lastID;

      const payment = {
        id: paymentId,
        clientId,
        contractId,
        amount: Number(amount),
        date: paymentDate,
        lateFee,
        receiptFilename: null
      };

      // Stub: Send email or SMS notification (to be implemented)
      // sendNotification(clientId, payment);

      return res.status(201).json(payment);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all payments
router.get('/', async (req, res) => {
  const rows = await db.all(`
    SELECT 
      payments.*,
      clients.name AS clientName,
      contracts.number AS contractNumber
    FROM payments
    JOIN clients ON payments.clientId = clients.id
    JOIN contracts ON payments.contractId = contracts.id
  `);
  res.json(rows);
});

// GET payments by clientId or contractId
router.get('/search', async (req, res) => {
  const { clientId, contractId } = req.query;
  let query = `
    SELECT 
      payments.*,
      clients.name AS clientName,
      contracts.number AS contractNumber
    FROM payments
    JOIN clients ON payments.clientId = clients.id
    JOIN contracts ON payments.contractId = contracts.id
    WHERE 1=1
  `;
  const params = [];
  if (clientId) {
    query += ' AND clientId = ?';
    params.push(clientId);
  }
  if (contractId) {
    query += ' AND contractId = ?';
    params.push(contractId);
  }
  const rows = await db.all(query, params);
  res.json(rows);
});

// POST route to perform pre-check for a payment
router.post('/:paymentId/pre-check', async (req, res) => {
  const paymentId = parseInt(req.params.paymentId);
  const { clientId, amount, date } = req.body;

  if (!clientId || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const contract = await db.get(
    'SELECT * FROM contracts WHERE clientId = ? ORDER BY endDate DESC LIMIT 1',
    [clientId]
  );
  if (!contract) {
    return res.status(404).json({ error: 'Associated contract not found' });
  }

  const remainingBalance = contract.remainingBalance || contract.totalAmount;
  const isOverpaid = amount > remainingBalance;
  const overpaidAmount = isOverpaid ? amount - remainingBalance : 0;

  res.json({
    contractId: contract.id,
    paymentAmount: amount,
    remainingBalance,
    isOverpaid,
    overpaidAmount
  });
});

// GET route to download receipt by paymentId and filename
router.get('/:paymentId/receipt/:filename', async (req, res) => {
  const { paymentId, filename } = req.params;
  const payment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment || !payment.receiptPath) {
    return res.status(404).json({ error: 'Receipt not found' });
  }
  const filePath = payment.receiptPath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Receipt not found' });
  }
  res.download(filePath);
});

// DELETE a payment and its receipt file
router.delete('/:paymentId', async (req, res) => {
  const paymentId = parseInt(req.params.paymentId);
  const payment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  // Restore contract remaining balance
  const contract = await findContractById(payment.contractId);
  if (contract) {
    const newRemainingBalance = (contract.remainingBalance || contract.totalAmount) + payment.amount;
    await db.run('UPDATE contracts SET remainingBalance = ? WHERE id = ?', [newRemainingBalance, payment.contractId]);
  }

  // Delete receipt file if exists
  if (payment.receiptPath && fs.existsSync(payment.receiptPath)) {
    fs.unlinkSync(payment.receiptPath);
    // Also remove the payment directory if empty
    const paymentDir = path.dirname(payment.receiptPath);
    try {
      fs.rmdirSync(paymentDir);
    } catch (err) {
      // Directory not empty or error ignored
    }
  }

  // Delete payment from database
  await db.run('DELETE FROM payments WHERE id = ?', [paymentId]);

  res.json({ message: 'Payment deleted' });
});

// POST route to send notification for a specific payment
router.post('/:paymentId/notify', async (req, res) => {
  const paymentId = parseInt(req.params.paymentId);
  const payment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  // TODO: Implement actual notification logic here (email or SMS)
  // Example stub:
  console.log(`Notify client ${payment.clientId} about payment ${paymentId}`);

  res.json({ message: `Notification triggered for payment ${paymentId}` });
});

// PUT route to update an existing payment
router.put('/:paymentId', upload.single('receipt'), async (req, res) => {
  const paymentId = parseInt(req.params.paymentId);
  const { clientId, contractId, amount, date } = req.body;

  if (!clientId || !contractId || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const contract = await findContractById(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const paymentDate = new Date(date);
  const dueDate = new Date(contract.dueDate || contract.startDate);
  const lateFee = calculateLateFee(dueDate, paymentDate);

  let newPath = payment.receiptPath;
  let receiptType = payment.receiptType;

  if (req.file) {
    const paymentDir = path.join(__dirname, 'uploads', 'payments', String(paymentId));
    fs.mkdirSync(paymentDir, { recursive: true });

    newPath = path.join(paymentDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);

    receiptType = req.file.mimetype.split('/')[1];

    // Remove old file if present
    if (payment.receiptPath && fs.existsSync(payment.receiptPath)) {
      fs.unlinkSync(payment.receiptPath);
    }
  }

  await db.run(
    'UPDATE payments SET clientId = ?, contractId = ?, amount = ?, date = ?, lateFee = ?, receiptPath = ?, receiptType = ? WHERE id = ?',
    [clientId, contractId, amount, date, lateFee, newPath, receiptType, paymentId]
  );

  res.json({ message: 'Payment updated' });
});

export default router;
