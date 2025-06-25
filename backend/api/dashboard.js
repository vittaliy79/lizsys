import express from 'express';
import { getDb } from '../db/connection.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();
const db = await getDb();

router.get('/dashboard-stats', async (req, res) => {
  try {
    const clientsRow = await db.get('SELECT COUNT(*) AS count FROM clients');
    const contractsRow = await db.get('SELECT COUNT(*) AS count FROM contracts');
    const assetsRow = await db.get('SELECT COUNT(*) AS count FROM assets');
    const paymentsRow = await db.get('SELECT SUM(amount) AS total FROM payments');

    res.json({
      clients: clientsRow.count,
      contracts: contractsRow.count,
      payments: paymentsRow.total || 0,
      assets: assetsRow.count
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
});


export default router;
