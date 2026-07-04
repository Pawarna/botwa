import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requireAuth } from './middlewares/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// Public health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// API routes (auth middleware is applied inside routes)
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

export default app;
