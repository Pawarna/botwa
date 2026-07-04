import { Request, Response, NextFunction } from 'express';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    
    // In production, ADMIN_SECRET should be defined in .env
    const adminSecret = process.env.ADMIN_SECRET || 'supersecret';

    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }

    next();
};
