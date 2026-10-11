import { Request, Response } from 'express';
import { addBlastJobs, getQueueStats, getQueueJobs } from '../repositories/blastQueueRepository';
import { triggerWorker } from '../services/broadcastWorker';
import prisma from '../utils/prisma';

export const queueBroadcast = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { jobs } = req.body;
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return res.status(400).json({ error: 'A non-empty jobs array is required' });
        }

        await addBlastJobs(sessionId, jobs);
        
        // Trigger worker if it's sleeping (will skip if WA not connected, jobs stay PENDING)
        triggerWorker(sessionId);

        return res.status(201).json({ message: 'Broadcast jobs queued successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getBroadcastStats = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const stats = await getQueueStats(sessionId);
        return res.status(200).json(stats);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getBroadcastJobs = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const jobs = await getQueueJobs(sessionId);
        return res.status(200).json(jobs);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteBroadcastJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.blastQueue.delete({
            where: { id }
        });
        return res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const clearBroadcastQueue = async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        await prisma.blastQueue.deleteMany({
            where: { sessionId }
        });
        return res.status(200).json({ success: true, message: 'Queue history cleared successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
