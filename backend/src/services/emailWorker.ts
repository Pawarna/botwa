import nodemailer from 'nodemailer';
import prisma from '../utils/prisma';
import { handleOutreachSent } from './leadBridge';

let workerRunning = false;

const randomDelay = (min: number, max: number) => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
};

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true', // true untuk port 465, false untuk 587/25
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });
};

// ─── Gacha variasi email ─────────────────────────────────────────────────────
let lastEmailVariantIndex = -1;

const parseVariants = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.trim()) : [];
    } catch {
        return [];
    }
};

// Pilih indeks varian random, selalu berbeda dari yang terakhir dipakai.
const pickVariantIndex = (count: number): number => {
    if (count <= 1) return 0;
    const candidates = Array.from({ length: count }, (_, i) => i).filter((i) => i !== lastEmailVariantIndex);
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    lastEmailVariantIndex = idx;
    return idx;
};

export const startEmailWorker = async () => {
    if (workerRunning) return;
    workerRunning = true;

    console.log('Email queue worker started.');

    while (true) {
        try {
            const job = await prisma.emailQueue.findFirst({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'asc' }
            });

            if (!job) {
                workerRunning = false;
                console.log('Email queue empty. Worker sleeping.');
                break;
            }

            if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
                // SMTP belum dikonfigurasi — biarkan job PENDING, worker berhenti.
                workerRunning = false;
                console.log('SMTP not configured (SMTP_HOST/SMTP_USER). Email worker paused, jobs remain PENDING.');
                break;
            }

            await prisma.emailQueue.update({ where: { id: job.id }, data: { status: 'PROCESSING' } });

            try {
                // Gacha variasi body & subject. Satu indeks untuk body+subject supaya berpasangan.
                const bodies = parseVariants(job.bodyVariants);
                const subjects = parseVariants(job.subjectVariants);
                const count = Math.max(bodies.length, subjects.length, 1);
                const gachaIdx = pickVariantIndex(count);
                const bodyText = bodies.length ? bodies[Math.min(gachaIdx, bodies.length - 1)] : job.body;
                const subjectText = subjects.length ? subjects[Math.min(gachaIdx, subjects.length - 1)] : job.subject;

                const transporter = createTransporter();
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || process.env.SMTP_USER,
                    to: job.targetEmail,
                    subject: subjectText,
                    text: bodyText,
                    html: job.bodyHtml || bodyText.replace(/\n/g, '<br>'),
                });

                await prisma.emailQueue.update({ where: { id: job.id }, data: { status: 'SENT' } });

                // Tandai kontak CRM + jembatan ke ClientLead (non-fatal kalau gagal)
                try {
                    await handleOutreachSent({ channel: 'email', contactId: job.contactId, email: job.targetEmail });
                } catch (syncErr) {
                    console.error('Failed to sync contact/lead after email SENT:', syncErr);
                }
            } catch (error: any) {
                console.error(`Failed to send email to ${job.targetEmail}:`, error);
                await prisma.emailQueue.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', error: error?.message || 'Unknown error' }
                });
            }

            // Delay acak antar email agar tidak kena spam flag
            console.log('Waiting for random delay before next email...');
            await randomDelay(5000, 15000);

        } catch (error) {
            console.error('Error in email queue worker:', error);
            await randomDelay(5000, 10000);
        }
    }
};

// Trigger worker kalau sedang tidur
export const triggerEmailWorker = () => {
    if (!workerRunning) {
        startEmailWorker();
    }
};
