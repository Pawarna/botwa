import 'dotenv/config';
import app from './app';
import { startWorker } from './services/broadcastWorker';

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
        }
    } catch (error) {
        console.error('Failed to restore sessions:', error);
    }

    // Start the broadcast worker on boot to resume any PENDING jobs
    startWorker().catch(err => {
        console.error('Failed to start broadcast worker on boot:', err);
    });
});
