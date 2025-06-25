import express from 'express';
import cors from 'cors';
import clientsRouter from './api/clients.js';
import contractsRouter from './api/contracts.js';
import paymentsRouter from './api/payments.js';
import assetsRouter from './api/assets.js';
import reportsRouter from './api/reports.js';


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Сервер запускается...');

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  etag: false,
  lastModified: false,
  cacheControl: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

// Роутер для клиентов
app.use('/api/clients', clientsRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/reports', reportsRouter);

// Обработка отсутствующих маршрутов (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  res.status(500).json({ message: 'Ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
