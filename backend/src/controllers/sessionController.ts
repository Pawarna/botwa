import { Request, Response } from 'express';
import { createSession, deleteSession, getQrCode, getSessionError, getSessionStatus, sessionStatuses } from '../services/whatsappService';
import QRCode from 'qrcode';

export const listSessions = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const status = getSessionStatus(sessionId);
        const error = getSessionError(sessionId);
        
        // Return as an array to maintain API contract with frontend, but only ever 1 session
        return res.status(200).json([{ id: sessionId, status, error }]);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const startSession = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;

        await createSession(sessionId);
        return res.status(200).json({ message: 'Session started/initializing' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const stopSession = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        await deleteSession(sessionId);
        return res.status(200).json({ message: 'Session stopped and deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const checkSession = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
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
