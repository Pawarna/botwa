import 'dotenv/config';
import app from './app';
import { triggerWorker } from './services/broadcastWorker';
import { triggerEmailWorker } from './services/emailWorker';

import { getAllSessionIds } from './repositories/authRepository';
import { createSession } from './services/whatsappService';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    try {
        const sessionIds = await getAllSessionIds();
        console.log(`Found ${sessionIds.length} saved sessions, restoring...`);
        for (const sessionId of sessionIds) {
            await createSession(sessionId);
            // Start the broadcast worker per session to resume any PENDING jobs
            triggerWorker(sessionId);
        }
    } catch (error) {
        console.error('Failed to restore sessions:', error);
    }

    // Start the email worker on boot to resume any PENDING jobs
    triggerEmailWorker();
});
