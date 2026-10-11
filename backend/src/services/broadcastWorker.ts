import { getNextPendingJobBySession, updateJobStatus } from '../repositories/blastQueueRepository';
import { getSession, getSessionStatus } from './whatsappService';
import { handleOutreachSent } from './leadBridge';


// Track running workers per session
const runningWorkers = new Set<string>();

const randomDelay = (min: number, max: number) => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
};

const lastVariantIndex = new Map<string, number>();

const parseVariants = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.trim()) : [];
    } catch {
        return [];
    }
};

// Pilih indeks varian random, SELALU berbeda dari varian terakhir
// yang dipakai untuk session ini (anti consecutive-repeat).
const pickVariantIndex = (sessionId: string, count: number): number => {
    if (count <= 1) return 0;
    const last = lastVariantIndex.get(sessionId) ?? -1;
    const candidates = Array.from({ length: count }, (_, i) => i).filter((i) => i !== last);
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    lastVariantIndex.set(sessionId, idx);
    return idx;
};

export const startWorker = async (sessionId: string) => {
    if (runningWorkers.has(sessionId)) return;
    runningWorkers.add(sessionId);

    console.log(`Broadcast queue worker started for session: ${sessionId}`);

    while (true) {
        try {
            const job = await getNextPendingJobBySession(sessionId);

            if (!job) {
                // Queue is empty, stop the loop. It will be triggered again when new jobs are added.
                runningWorkers.delete(sessionId);
                console.log(`Broadcast queue empty for session ${sessionId}. Worker sleeping.`);
                break;
            }

            const session = getSession(sessionId);
            const status = getSessionStatus(sessionId);

            if (!session || status !== 'connected') {
                // WA belum konek, biarkan job tetap PENDING dan hentikan worker.
                // Worker akan di-trigger ulang saat WA berhasil konek.
                runningWorkers.delete(sessionId);
                console.log(`Session ${sessionId} not connected (status: ${status}). Worker paused, jobs remain PENDING.`);
                break;
            }

            await updateJobStatus(job.id, 'PROCESSING');

            // Determine formatted JID
            let rawJid = job.targetJid.trim();
            // Auto-format Indonesian local prefix '08' to '628'
            if (rawJid.startsWith('08')) {
                rawJid = '628' + rawJid.slice(2);
            }
            
            // Remove '+' or any non-numeric characters if needed
            rawJid = rawJid.replace(/[^0-9]/g, '');

            const formattedJid = rawJid + '@s.whatsapp.net';

            // Gacha variasi di sini — saat menunggu job diproses (setelah delay
            // antar pesan sebelumnya). Juga menjamin TIDAK sama dengan varian
            // yang dipakai pada job sebelumnya untuk session ini.
            const variants = parseVariants(job.messageVariants);
            const text = variants.length > 0
                ? variants[pickVariantIndex(sessionId, variants.length)]
                : job.messageText;

            try {
                if (job.mediaUrl && job.mediaType) {
                    const ext = job.mediaUrl.split('.').pop() || 'file';
                    const isImage = job.mediaType.includes('image');
                    const isVideo = job.mediaType.includes('video');
                    
                    if (isImage) {
                        await session.sendMessage(formattedJid, { 
                            image: { url: job.mediaUrl }, 
                            caption: text 
                        });
                    } else if (isVideo) {
                        await session.sendMessage(formattedJid, { 
                            video: { url: job.mediaUrl }, 
                            caption: text 
                        });
                    } else {
                        // Everything else (PDF, Word, Excel, CSV, ZIP) goes as document
                        await session.sendMessage(formattedJid, { 
                            document: { url: job.mediaUrl },
                            mimetype: job.mediaType,
                            fileName: `Attachment.${ext}`,
                            caption: text 
                        });
                    }
                } else {
                    await session.sendMessage(formattedJid, { text: text });
                }
                
                await updateJobStatus(job.id, 'SENT');

                // Tandai kontak CRM + jembatan ke ClientLead (non-fatal kalau gagal).
                // rawJid = nomor yang sudah dinormalisasi → single send pun ikut jadi lead.
                try {
                    await handleOutreachSent({ channel: 'wa', contactId: job.contactId, phone: rawJid });
                } catch (syncErr) {
                    console.error('Failed to sync contact/lead after SENT:', syncErr);
                }
            } catch (error: any) {
                console.error(`Failed to send broadcast to ${formattedJid}:`, error);
                await updateJobStatus(job.id, 'FAILED', error?.message || 'Unknown error');
            }

            // Delay 30-60s between messages to mimic human behavior and avoid WA ban
            console.log('Waiting for random delay before next broadcast...');
            await randomDelay(30000, 60000);

        } catch (error) {
            console.error('Error in broadcast queue worker:', error);
            // Wait a bit before retrying to prevent rapid error loops
            await randomDelay(5000, 10000);
        }
    }
};

// Function to trigger worker manually if it's sleeping
export const triggerWorker = (sessionId: string) => {
    if (!runningWorkers.has(sessionId)) {
        startWorker(sessionId);
    }
};
