import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { adminAuth } from './middlewares/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// Public health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Protect all API routes with admin auth
app.use('/api', adminAuth, routes);

// Global error handler
app.use(errorHandler);

export default app;
