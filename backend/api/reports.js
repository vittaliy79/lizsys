import express from 'express';
import { getDb } from '../db/connection.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();
const db = await getDb();

// Отчёт по доходам
router.get('/income', async (req, res) => {
  try {
    const { startDate, endDate, assetType, contractStatus, clientType } = req.query;
    const conditions = [];
    const values = [];

    if (startDate) {
      conditions.push('contracts.createdAt >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('contracts.createdAt <= ?');
      values.push(endDate);
    }
    if (assetType) {
      conditions.push('contracts.assetType = ?');
      values.push(assetType);
    }
    if (contractStatus) {
      conditions.push('contracts.status = ?');
      values.push(contractStatus);
    }
    if (clientType) {
      conditions.push('contracts.clientType = ?');
      values.push(clientType);
    }

    const query = `
      SELECT SUM(payments.amount) AS totalIncome
      FROM payments
      JOIN contracts ON payments.contractId = contracts.id
      WHERE receiptType = 'income'
        ${conditions.length ? ' AND ' + conditions.join(' AND ') : ''}
    `;
    const result = await db.get(query, values);

    res.json({ totalIncome: result?.totalIncome || 0 });
  } catch (err) {
    console.error('Ошибка получения доходов:', err);
    res.status(500).json({ error: 'Ошибка получения отчета по доходам' });
  }
});

// Отчёт по долгам
router.get('/debts', async (req, res) => {
  try {
    const { startDate, endDate, assetType, contractStatus, clientType } = req.query;
    const conditions = [];
    const values = [];

    if (startDate) {
      conditions.push('contracts.createdAt >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('contracts.createdAt <= ?');
      values.push(endDate);
    }
    if (assetType) {
      conditions.push('contracts.assetType = ?');
      values.push(assetType);
    }
    if (contractStatus) {
      conditions.push('contracts.status = ?');
      values.push(contractStatus);
    }
    if (clientType) {
      conditions.push('contracts.clientType = ?');
      values.push(clientType);
    }

    const query = `
      SELECT SUM(payments.amount + COALESCE(payments.lateFee, 0)) AS totalDebt
      FROM payments
      JOIN contracts ON payments.contractId = contracts.id
      WHERE receiptType = 'debt'
        ${conditions.length ? ' AND ' + conditions.join(' AND ') : ''}
    `;
    const result = await db.get(query, values);

    res.json({ totalDebt: result?.totalDebt || 0 });
  } catch (err) {
    console.error('Ошибка получения долгов:', err);
    res.status(500).json({ error: 'Ошибка получения отчета по долгам' });
  }
});

// Отчёт по просроченной задолженности (SQLite)
router.get('/overdue', async (req, res) => {
  try {
    const { endDate } = req.query;
    const query = `
      SELECT SUM(payments_amount) AS totalOverdue
      FROM payments
      WHERE status = 'overdue' AND dueDate < ?
    `;
    const result = await db.get(query, [endDate || new Date().toISOString().split('T')[0]]);
    res.json({ totalOverdue: result?.totalOverdue || 0 });
  } catch (err) {
    console.error('Ошибка получения просроченной задолженности:', err);
    res.status(500).json({ error: 'Ошибка получения отчета по просроченной задолженности' });
  }
});

// Количество договоров (SQLite)
router.get('/contracts-count', async (req, res) => {
  try {
    const { startDate, endDate, assetType, contractStatus, clientType } = req.query;
    const conditions = [];
    const values = [];

    if (startDate) {
      conditions.push('createdAt >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      values.push(endDate);
    }
    if (assetType) {
      conditions.push('assetType = ?');
      values.push(assetType);
    }
    if (contractStatus) {
      conditions.push('status = ?');
      values.push(contractStatus);
    }
    if (clientType) {
      conditions.push('clientType = ?');
      values.push(clientType);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) AS count FROM contracts ${whereClause}`;
    const result = await db.get(query, values);

    res.json({ count: result?.count || 0 });
  } catch (err) {
    console.error('Ошибка получения количества договоров:', err);
    res.status(500).json({ error: 'Ошибка получения отчета по количеству договоров' });
  }
});

// Экспорт в Excel
router.get('/export/excel', async (req, res) => {
  try {
    const { startDate, endDate, assetType, contractStatus, clientType } = req.query;
    const conditions = [];
    const values = [];

    if (startDate) {
      conditions.push('createdAt >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      values.push(endDate);
    }
    if (assetType) {
      conditions.push('assetType = ?');
      values.push(assetType);
    }
    if (contractStatus) {
      conditions.push('status = ?');
      values.push(contractStatus);
    }
    if (clientType) {
      conditions.push('clientType = ?');
      values.push(clientType);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, clientId, assetType, status, createdAt FROM contracts ${whereClause}`;
    const contracts = await db.all(query, values);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contracts Report');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Клиент', key: 'clientId', width: 15 },
      { header: 'Тип актива', key: 'assetType', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата создания', key: 'createdAt', width: 20 }
    ];

    contracts.forEach(contract => {
      sheet.addRow({
        id: contract.id,
        clientId: contract.clientId,
        assetType: contract.assetType,
        status: contract.status,
        createdAt: contract.createdAt?.toISOString().split('T')[0]
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contracts_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Ошибка экспорта Excel:', err);
    res.status(500).json({ error: 'Ошибка экспорта в Excel' });
  }
});

// Экспорт в PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const { startDate, endDate, assetType, contractStatus, clientType } = req.query;
    const conditions = [];
    const values = [];

    if (startDate) {
      conditions.push('createdAt >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      values.push(endDate);
    }
    if (assetType) {
      conditions.push('assetType = ?');
      values.push(assetType);
    }
    if (contractStatus) {
      conditions.push('status = ?');
      values.push(contractStatus);
    }
    if (clientType) {
      conditions.push('clientType = ?');
      values.push(clientType);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, clientId, assetType, status, createdAt FROM contracts ${whereClause}`;
    const contracts = await db.all(query, values);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contracts_report.pdf');
    doc.pipe(res);

    doc.fontSize(14).text('Contracts Report', { align: 'center' });
    doc.moveDown();

    contracts.forEach(c => {
      doc.fontSize(10).text(`ID: ${c.id} | Клиент: ${c.clientId} | Тип актива: ${c.assetType} | Статус: ${c.status} | Дата: ${c.createdAt?.toISOString().split('T')[0]}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error('Ошибка экспорта PDF:', err);
    res.status(500).json({ error: 'Ошибка экспорта в PDF' });
  }
});

// Хелпер для построения фильтра
// function buildMatchQuery({ startDate, endDate, assetType, contractStatus, clientType }) {
//   const query = {};
//   if (startDate || endDate) {
//     query.createdAt = {};
//     if (startDate) query.createdAt.$gte = new Date(startDate);
//     if (endDate) query.createdAt.$lte = new Date(endDate);
//   }
//   if (assetType) query.assetType = assetType;
//   if (contractStatus) query.status = contractStatus;
//   if (clientType) query.clientType = clientType;
//   return query;
// }

export default router;
