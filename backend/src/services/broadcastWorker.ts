import { getNextPendingJob, updateJobStatus } from '../repositories/blastQueueRepository';
import { getSession } from './whatsappService';


let isWorkerRunning = false;

const randomDelay = (min: number, max: number) => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
};

export const startWorker = async () => {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

    console.log('Broadcast queue worker started.');

    while (true) {
        try {
            const job = await getNextPendingJob();

            if (!job) {
                // Queue is empty, stop the loop. It will be triggered again when new jobs are added.
                isWorkerRunning = false;
                console.log('Broadcast queue empty. Worker sleeping.');
                break;
            }

            await updateJobStatus(job.id, 'PROCESSING');

            const session = getSession(job.sessionId);
            if (!session) {
                await updateJobStatus(job.id, 'FAILED', `Session ${job.sessionId} not connected`);
                continue; // Move to next job immediately
            }

            // Determine formatted JID
            let rawJid = job.targetJid.trim();
            // Auto-format Indonesian local prefix '08' to '628'
            if (rawJid.startsWith('08')) {
                rawJid = '628' + rawJid.slice(2);
            }
            
            // Remove '+' or any non-numeric characters if needed
            rawJid = rawJid.replace(/[^0-9]/g, '');

            const formattedJid = rawJid + '@s.whatsapp.net';

            try {
                if (job.mediaUrl && job.mediaType) {
                    if (job.mediaType.includes('image')) {
                        await session.sendMessage(formattedJid, { 
                            image: { url: job.mediaUrl }, 
                            caption: job.messageText 
                        });
                    } else if (job.mediaType.includes('pdf') || job.mediaType.includes('document')) {
                        await session.sendMessage(formattedJid, { 
                            document: { url: job.mediaUrl },
                            mimetype: job.mediaType,
                            fileName: 'Document',
                            caption: job.messageText 
                        });
                    } else {
                        // Fallback to text if unknown type (though should not happen if properly filtered)
                        await session.sendMessage(formattedJid, { text: job.messageText });
                    }
                } else {
                    await session.sendMessage(formattedJid, { text: job.messageText });
                }
                
                await updateJobStatus(job.id, 'SENT');
            } catch (error: any) {
                console.error(`Failed to send broadcast to ${formattedJid}:`, error);
                await updateJobStatus(job.id, 'FAILED', error?.message || 'Unknown error');
            }

            // 20s random delay (e.g. 15s to 25s)
            console.log('Waiting for random delay before next broadcast...');
            await randomDelay(15000, 25000);

        } catch (error) {
            console.error('Error in broadcast queue worker:', error);
            // Wait a bit before retrying to prevent rapid error loops
            await randomDelay(5000, 10000);
        }
    }
};

// Function to trigger worker manually if it's sleeping
export const triggerWorker = () => {
    if (!isWorkerRunning) {
        startWorker();
    }
};
