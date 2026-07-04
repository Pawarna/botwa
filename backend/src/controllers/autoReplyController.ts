import { Request, Response } from 'express';
import { createReplyRule, deleteReplyRule, getReplyRules } from '../repositories/autoReplyRepository';

export const addReplyRule = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { keyword, replyText, isExact } = req.body;
        if (!sessionId || !keyword || !replyText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const rule = await createReplyRule({ sessionId, keyword, replyText, isExact: isExact ?? true });
        return res.status(201).json(rule);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const listReplyRules = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const rules = await getReplyRules(sessionId);
        return res.status(200).json(rules);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const removeReplyRule = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { id } = req.params;
        await deleteReplyRule(id, sessionId);
        return res.status(200).json({ message: 'Rule deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
