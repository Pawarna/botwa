import 'dotenv/config';
import app from './app';
import { triggerWorker } from './services/broadcastWorker';

import { getAllSessionIds } from './repositories/authRepository';
import { createSession } from './services/whatsappService';

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Auto restore existing sessions
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
});
