import express from 'express';
import { getDb } from '../db/connection.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const db = await getDb();

// Получить все активы
router.get('/', async (req, res) => {
  const assets = await db.all('SELECT * FROM assets ORDER BY id DESC');
  res.json(assets);
});

// Добавить актив
router.post('/', async (req, res) => {
  const {
    name,
    type,
    vin,
    status,
    location,
    inspectionDate,
    maintenanceInfo,
    insuranceInfo,
    clientId,
  } = req.body;

  if (!name || !type || !status || !clientId) {
    return res.status(400).json({ error: 'Обязательные поля отсутствуют' });
  }

  const result = await db.run(
    `INSERT INTO assets (name, type, vin, status, location, inspectionDate, maintenanceInfo, insuranceInfo, clientId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, vin, status, location, inspectionDate, maintenanceInfo, insuranceInfo, clientId]
  );

  const newAsset = {
    id: result.lastID,
    name,
    type,
    vin,
    status,
    location,
    inspectionDate,
    maintenanceInfo,
    insuranceInfo,
    clientId,
  };

  res.status(201).json(newAsset);
});

// Обновить актив
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    type,
    vin,
    status,
    location,
    inspectionDate,
    maintenanceInfo,
    insuranceInfo,
    clientId,
  } = req.body;

  if (!name || !type || !status || !clientId) {
    return res.status(400).json({ error: 'Обязательные поля отсутствуют' });
  }

  const result = await db.run(
    `UPDATE assets
     SET name = ?, type = ?, vin = ?, status = ?, location = ?, inspectionDate = ?, maintenanceInfo = ?, insuranceInfo = ?, clientId = ?
     WHERE id = ?`,
    [name, type, vin, status, location, inspectionDate, maintenanceInfo, insuranceInfo, clientId, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Актив не найден' });
  }

  res.json({
    id,
    name,
    type,
    vin,
    status,
    location,
    inspectionDate,
    maintenanceInfo,
    insuranceInfo,
    clientId,
  });
});

// Удалить актив
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.run('DELETE FROM assets WHERE id = ?', [id]);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Актив не найден' });
  }

  res.json({ success: true });
});

// Загрузка документа по активу
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const assetId = req.params.assetId;
    const dir = path.join('backend', 'uploads', 'assets', assetId);
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

// Загрузка файлов ТО и страховки по активу
router.post('/:assetId/upload', upload.fields([
  { name: 'maintenanceFile', maxCount: 1 },
  { name: 'insuranceFile', maxCount: 1 }
]), async (req, res) => {
  const { assetId } = req.params;
  const files = req.files;

  if (!files || (!files.maintenanceFile && !files.insuranceFile)) {
    return res.status(400).json({ error: 'Файлы не загружены' });
  }

  try {
    if (files.maintenanceFile) {
      const file = files.maintenanceFile[0];
      await db.run(
        `INSERT INTO asset_documents (asset_id, type, filename, filepath)
         VALUES (?, ?, ?, ?)`,
        [assetId, 'maintenance', file.filename, file.path]
      );
    }

    if (files.insuranceFile) {
      const file = files.insuranceFile[0];
      await db.run(
        `INSERT INTO asset_documents (asset_id, type, filename, filepath)
         VALUES (?, ?, ?, ?)`,
        [assetId, 'insurance', file.filename, file.path]
      );
    }

    res.status(201).json({ message: 'Файлы успешно загружены' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при загрузке файлов' });
  }
});

router.post('/:assetId/documents', upload.single('document'), async (req, res) => {
  const { assetId } = req.params;
  const { type } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Файл не загружен' });

  const filename = file.filename;
  const filepath = file.path;

  await db.run(
    `INSERT INTO asset_documents (asset_id, type, filename, filepath)
     VALUES (?, ?, ?, ?)`,
    [assetId, type, filename, filepath]
  );

  res.status(201).json({ message: 'Документ успешно загружен' });
});

// Получить документы по активу
router.get('/:assetId/documents', async (req, res) => {
  const { assetId } = req.params;
  const documents = await db.all(
    'SELECT * FROM asset_documents WHERE asset_id = ? ORDER BY uploadedAt DESC',
    [assetId]
  );
  const updatedDocuments = documents.map(doc => ({
    ...doc,
    filepath: `backend/uploads/assets/${assetId}/${doc.filename}`
  }));
  res.json(updatedDocuments);
});

// Удалить документ актива
router.delete('/:assetId/documents/:id', async (req, res) => {
  const { id } = req.params;

  const doc = await db.get('SELECT * FROM asset_documents WHERE id = ?', [id]);
  if (!doc) return res.status(404).json({ error: 'Документ не найден' });

  fs.unlinkSync(doc.filepath);
  await db.run('DELETE FROM asset_documents WHERE id = ?', [id]);

  res.json({ success: true });
});

// Получить файл по пути
router.get('/:assetId/documents/:filename', (req, res) => {
  const { assetId, filename } = req.params;
  const filepath = path.join('backend', 'uploads', 'assets', assetId, filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(path.resolve(filepath));
  } else {
    res.status(404).json({ error: 'Файл не найден' });
  }
});


// Получить все файлы, связанные с активом
router.get('/:assetId/files', async (req, res) => {
  const { assetId } = req.params;

  try {
    const files = await db.all(
      'SELECT id, type, filename, filepath, uploadedAt FROM asset_documents WHERE asset_id = ? ORDER BY uploadedAt DESC',
      [assetId]
    );

    const formattedFiles = files.map(file => ({
      ...file,
      url: `/api/assets/${assetId}/documents/${file.filename}`
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении файлов' });
  }
});

export default router;
