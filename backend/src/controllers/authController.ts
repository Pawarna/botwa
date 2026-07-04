import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });

        return res.status(200).json({ token: data.session?.access_token, user: data.user });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return res.status(400).json({ error: error.message });

        return res.status(201).json({ message: 'Registration successful', user: data.user });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};
