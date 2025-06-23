import express from 'express';
import cors from 'cors';
import clientsRouter from './api/clients.js';
import contractsRouter from './api/contracts.js';


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Роутер для клиентов
app.use('/api/clients', clientsRouter);
app.use('/api/contracts', contractsRouter);

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
