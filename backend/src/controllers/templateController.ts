import { Request, Response } from 'express';
import { listTemplates, createManyTemplates, updateTemplate, deleteTemplate } from '../repositories/templateRepository';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const channel = String(req.query.channel || 'wa');
        const templates = await listTemplates(sessionId, channel);
        return res.status(200).json(templates);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const addTemplates = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { channel, templates } = req.body;
        if (!channel || !Array.isArray(templates) || templates.length === 0) {
            return res.status(400).json({ error: 'channel and templates[] are required' });
        }
        const invalid = templates.filter((t: any) => !t.body || !String(t.body).trim());
        if (invalid.length > 0) {
            return res.status(400).json({ error: 'Each template requires a non-empty body' });
        }
        await createManyTemplates(sessionId, channel, templates);
        return res.status(201).json({ message: 'Templates saved' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const editTemplate = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { id } = req.params;
        const { body, subject, isActive } = req.body;
        const result = await updateTemplate(id, sessionId, {
            ...(body !== undefined ? { body: String(body) } : {}),
            ...(subject !== undefined ? { subject: subject ? String(subject) : null } : {}),
            ...(isActive !== undefined ? { isActive: !!isActive } : {}),
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json({ message: 'Template updated' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const removeTemplate = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { id } = req.params;
        const result = await deleteTemplate(id, sessionId);
        if (result.count === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json({ message: 'Template deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
