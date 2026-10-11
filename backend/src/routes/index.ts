import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { checkSession, startSession, stopSession, listSessions } from '../controllers/sessionController';
import { addReplyRule, listReplyRules, removeReplyRule } from '../controllers/autoReplyController';
import { getBroadcastStats, queueBroadcast, getBroadcastJobs, deleteBroadcastJob, clearBroadcastQueue } from '../controllers/broadcastController';
import { startScraping, getScrapeBatches, getBatchContacts, deleteScrapeBatch, deleteScrapedContact, updateScrapedContactStatus } from '../controllers/scraperController';
import { scrapeEmitter } from '../services/scraperService';
import { uploadMedia } from '../controllers/uploadController';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication middleware to all routes below
router.use(requireAuth);

// Google Maps Scraper
router.post('/scrape', startScraping);
router.get('/scrape/batches', getScrapeBatches);
router.get('/scrape/batches/:id', getBatchContacts);
router.delete('/scrape/batches/:id', deleteScrapeBatch);
router.delete('/scrape/contacts/:id', deleteScrapedContact);
router.patch('/scrape/contacts/:id/status', updateScrapedContactStatus);

// Scraper SSE log stream
router.get('/scrape/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onLog = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    scrapeEmitter.on('log', onLog);

    req.on('close', () => {
        scrapeEmitter.off('log', onLog);
    });
});

// Media Upload
router.post('/upload', upload.single('file'), uploadMedia);

// Session Management
router.post('/sessions/start', startSession);
router.post('/sessions/stop', stopSession);
router.get('/sessions/check', checkSession);
router.get('/sessions', listSessions);

// Auto-Reply Rules
router.post('/auto-reply', addReplyRule);
router.get('/auto-reply', listReplyRules);
router.delete('/auto-reply/:id', removeReplyRule);

// Broadcast / Blaster
router.post('/broadcast', queueBroadcast);
router.get('/broadcast/stats', getBroadcastStats);
router.get('/broadcast/:sessionId/jobs', getBroadcastJobs);
router.delete('/broadcast/jobs/:id', deleteBroadcastJob);
router.delete('/broadcast/:sessionId/clear', clearBroadcastQueue);

export default router;
