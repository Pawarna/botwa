import { Request, Response } from 'express';
import { createSession, deleteSession, getQrCode, getSession, getSessionError, getSessionStatus } from '../services/whatsappService';
import { getAllSessionIds } from '../repositories/authRepository';
import QRCode from 'qrcode';

export const listSessions = async (req: Request, res: Response) => {
    try {
        const sessionIds = await getAllSessionIds();
        const sessions = sessionIds.map(id => {
            const status = getSessionStatus(id);
            const error = getSessionError(id);
            return { id, status, error };
        });
        return res.status(200).json(sessions);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const startSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        await createSession(sessionId);
        return res.status(200).json({ message: 'Session started/initializing' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const stopSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        await deleteSession(sessionId);
        return res.status(200).json({ message: 'Session stopped and deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const checkSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const status = getSessionStatus(sessionId);
        const error = getSessionError(sessionId);

        if (status === 'qr') {
            const qr = getQrCode(sessionId);
            if (qr) {
                const qrBase64 = await QRCode.toDataURL(qr);
                return res.status(200).json({ status: 'qr', qr: qrBase64 });
            }
        }

        if (status === 'error') {
            return res.status(200).json({ status: 'error', error });
        }

        return res.status(200).json({ status });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
