import { Request, Response } from 'express';
import { scrapeMaps } from '../services/scraperService';
import prisma from '../utils/prisma';

export const startScraping = async (req: Request, res: Response) => {
    try {
        const { query, limit } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const maxResults = limit ? parseInt(limit) : 20;
        const results = await scrapeMaps(query, maxResults);
        
        return res.status(200).json({ data: results });
    } catch (error: any) {
        console.error('Scraping error:', error);
        return res.status(500).json({ error: error.message || 'Scraping failed' });
    }
};

export const getScrapeBatches = async (req: Request, res: Response) => {
    try {
        const batches = await prisma.scrapeBatch.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { contacts: true }
                }
            }
        });
        return res.status(200).json(batches);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getBatchContacts = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contacts = await prisma.scrapedContact.findMany({
            where: { batchId: id }
        });
        return res.status(200).json(contacts);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteScrapeBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.scrapeBatch.delete({
            where: { id }
        });
        return res.status(200).json({ success: true, message: 'Batch and contacts deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteScrapedContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.scrapedContact.delete({
            where: { id }
        });
        return res.status(200).json({ success: true, message: 'Contact deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
