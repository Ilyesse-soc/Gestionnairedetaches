import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import todosRouter from './routes/todos';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/todos', todosRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
