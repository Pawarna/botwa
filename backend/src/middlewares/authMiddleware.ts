import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabaseClient';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token as string;
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
    }

    // Attach user to request
    (req as any).user = user;
    
    // Inject sessionId directly into req.user so controllers can easily read it
    (req as any).sessionId = user.id;

    next();
};
