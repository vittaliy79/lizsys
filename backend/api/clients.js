import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();
const db = await getDb();

// Получить список клиентов
router.get('/', async (req, res) => {
  const clients = await db.all('SELECT * FROM clients ORDER BY id DESC');
  res.json(clients);
});

// Добавить клиента
router.post('/', async (req, res) => {
  const { name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber } = req.body;
  if (!name || !email || !phone || !clientType || !documentNumber) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const result = await db.run(
    'INSERT INTO clients (name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber]
  );
  const newClient = { id: result.lastID, name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber };
  res.status(201).json(newClient);
});

// Обновить клиента по ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber } = req.body;

  if (!name || !email || !phone || !clientType || !documentNumber) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const result = await db.run(
    'UPDATE clients SET name = ?, email = ?, phone = ?, clientType = ?, documentNumber = ?, country = ?, city = ?, district = ?, street = ?, houseNumber = ? WHERE id = ?',
    [name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json({ id, name, email, phone, clientType, documentNumber, country, city, district, street, houseNumber });
});

// Удалить клиента по ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.run('DELETE FROM clients WHERE id = ?', [id]);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json({ success: true });
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientId = req.params.clientId;
    const dir = path.join('backend', 'uploads', 'clients', clientId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

// Загрузка документа клиента
router.post('/:clientId/documents', upload.single('document'), async (req, res) => {
  const { clientId } = req.params;
  const { type } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File not uploaded' });
  }

  const filename = file.filename;
  const filepath = file.path;

  if (!type || !filename || !filepath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  await db.run(
    'INSERT INTO client_documents (client_id, type, filename, filepath) VALUES (?, ?, ?, ?)',
    [clientId, type, filename, filepath]
  );

  res.status(201).json({ message: 'Document uploaded successfully' });
});


router.get('/:clientId/documents', async (req, res) => {
  const { clientId } = req.params;
  const documents = await db.all(
    'SELECT * FROM client_documents WHERE client_id = ? ORDER BY uploadedAt DESC',
    [clientId]
  );
  const updatedDocuments = documents.map(doc => ({
    ...doc,
    filepath: `backend/uploads/clients/${clientId}/${doc.filename}`
  }));
  res.json(updatedDocuments);
});


// DELETE /api/clients/:clientId/documents/:id
router.delete('/:clientId/documents/:id', async (req, res) => {
  const { id } = req.params;

  const doc = await db.get('SELECT * FROM client_documents WHERE id = ?', [id]);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  fs.unlinkSync(doc.filepath);
  await db.run('DELETE FROM client_documents WHERE id = ?', [id]);

  res.json({ success: true });
});

// GET /api/clients/:clientId/documents/:filename
router.get('/:clientId/documents/:filename', (req, res) => {
  const { clientId, filename } = req.params;
  const filepath = path.join('backend', 'uploads', 'clients', clientId, filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(path.resolve(filepath));
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
