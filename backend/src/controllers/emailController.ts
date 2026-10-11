import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import prisma from '../utils/prisma';
import { triggerEmailWorker } from '../services/emailWorker';

// Status konfigurasi SMTP (aman: tanpa membocorkan password)
export const getEmailConfig = async (req: Request, res: Response) => {
    try {
        const host = process.env.SMTP_HOST || '';
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';
        const from = process.env.MAIL_FROM || user;
        const port = Number(process.env.SMTP_PORT || 587);
        const configured = !!(host && user && pass);

        if (!configured) {
            return res.status(200).json({ configured: false, verified: false });
        }

        const maskUser = (u: string) => {
            const [name, domain] = u.split('@');
            const masked = name.length <= 2 ? name[0] + '***' : name.slice(0, 2) + '***';
            return domain ? `${masked}@${domain}` : masked;
        };

        // Verifikasi koneksi SMTP (timeout pendek supaya tidak menggantung request)
        let verified = false;
        try {
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user, pass },
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 7000,
            });
            await transporter.verify();
            verified = true;
        } catch {
            verified = false;
        }

        return res.status(200).json({
            configured: true,
            verified,
            host,
            port,
            user: maskUser(user),
            from,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const queueEmailBlast = async (req: Request, res: Response) => {
    try {
        const { jobs } = req.body;
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return res.status(400).json({ error: 'A non-empty jobs array is required' });
        }
        const invalid = jobs.filter((j: any) => !j.targetEmail || !j.subject || !j.body);
        if (invalid.length > 0) {
            return res.status(400).json({ error: 'Each job requires targetEmail, subject, and body' });
        }

        await prisma.emailQueue.createMany({
            data: jobs.map((j: any) => ({
                targetEmail: String(j.targetEmail).trim(),
                subject: String(j.subject),
                body: String(j.body),
                bodyHtml: j.bodyHtml ? String(j.bodyHtml) : null,
                bodyVariants: Array.isArray(j.bodyVariants) && j.bodyVariants.length ? JSON.stringify(j.bodyVariants) : null,
                subjectVariants: Array.isArray(j.subjectVariants) && j.subjectVariants.length ? JSON.stringify(j.subjectVariants) : null,
                contactId: j.contactId || null,
                status: 'PENDING' as const
            }))
        });

        // Trigger worker kalau sedang tidur (kalau SMTP belum diset, job tetap PENDING)
        triggerEmailWorker();

        return res.status(201).json({ message: 'Email jobs queued successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getEmailStats = async (req: Request, res: Response) => {
    try {
        const stats = await prisma.emailQueue.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        const result: Record<string, number> = { PENDING: 0, PROCESSING: 0, SENT: 0, FAILED: 0, total: 0 };
        stats.forEach((s) => {
            result[s.status] = s._count.id;
            result.total += s._count.id;
        });
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getEmailJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.emailQueue.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return res.status(200).json(jobs);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteEmailJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.emailQueue.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const clearEmailQueue = async (req: Request, res: Response) => {
    try {
        await prisma.emailQueue.deleteMany({});
        return res.status(200).json({ success: true, message: 'Email queue history cleared successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
