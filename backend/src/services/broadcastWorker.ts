import { getNextPendingJob, updateJobStatus } from '../repositories/blastQueueRepository';
import { getSession, getSessionStatus } from './whatsappService';


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
            const status = getSessionStatus(job.sessionId);
            
            if (!session || status !== 'connected') {
                await updateJobStatus(job.id, 'FAILED', `Session ${job.sessionId} is not connected (current status: ${status})`);
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
                    const ext = job.mediaUrl.split('.').pop() || 'file';
                    const isImage = job.mediaType.includes('image');
                    const isVideo = job.mediaType.includes('video');
                    
                    if (isImage) {
                        await session.sendMessage(formattedJid, { 
                            image: { url: job.mediaUrl }, 
                            caption: job.messageText 
                        });
                    } else if (isVideo) {
                        await session.sendMessage(formattedJid, { 
                            video: { url: job.mediaUrl }, 
                            caption: job.messageText 
                        });
                    } else {
                        // Everything else (PDF, Word, Excel, CSV, ZIP) goes as document
                        await session.sendMessage(formattedJid, { 
                            document: { url: job.mediaUrl },
                            mimetype: job.mediaType,
                            fileName: `Attachment.${ext}`,
                            caption: job.messageText 
                        });
                    }
                } else {
                    await session.sendMessage(formattedJid, { text: job.messageText });
                }
                
                await updateJobStatus(job.id, 'SENT');
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
export const triggerWorker = () => {
    if (!isWorkerRunning) {
        startWorker();
    }
};
