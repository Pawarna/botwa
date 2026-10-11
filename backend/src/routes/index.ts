import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';
import { checkSession, startSession, stopSession, listSessions } from '../controllers/sessionController';
import { addReplyRule, listReplyRules, removeReplyRule } from '../controllers/autoReplyController';
import { getBroadcastStats, queueBroadcast, getBroadcastJobs, deleteBroadcastJob, clearBroadcastQueue } from '../controllers/broadcastController';
import { startScraping, getScrapeBatches, getBatchContacts, deleteScrapeBatch, deleteScrapedContact, updateScrapedContactStatus } from '../controllers/scraperController';
import { getLeads, createLead, updateLeadStatus, deleteLead, getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController';
import { queueEmailBlast, getEmailStats, getEmailJobs, deleteEmailJob, clearEmailQueue, getEmailConfig } from '../controllers/emailController';
import { getTemplates, addTemplates, editTemplate, removeTemplate } from '../controllers/templateController';
import { scrapeEmitter } from '../services/scraperService';
import { uploadMedia } from '../controllers/uploadController';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public Auth routes
router.post('/auth/login', login);
router.post('/auth/register', register);

// Protect all following routes
router.use(requireAuth);

// Scraper
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
    res.end();
  });
});

// Session
router.get('/sessions', listSessions);
router.post('/sessions', startSession);
router.delete('/sessions/:sessionId', stopSession);
router.get('/sessions/:sessionId', checkSession);

// Upload Media
router.post('/upload', upload.single('file'), uploadMedia);

// Auto Reply
router.post('/autoreply', addReplyRule);
router.get('/autoreply/:sessionId', listReplyRules);
router.delete('/autoreply/:sessionId/:id', removeReplyRule);

// Broadcast
router.post('/broadcast', queueBroadcast);
router.get('/broadcast/:sessionId/stats', getBroadcastStats);
router.get('/broadcast/:sessionId/jobs', getBroadcastJobs);
router.delete('/broadcast/jobs/:id', deleteBroadcastJob);
router.delete('/broadcast/:sessionId/clear', clearBroadcastQueue);

// Cold Email
router.get('/email-blast/config', getEmailConfig);
router.post('/email-blast', queueEmailBlast);
router.get('/email-blast/stats', getEmailStats);
router.get('/email-blast/jobs', getEmailJobs);
router.delete('/email-blast/jobs/:id', deleteEmailJob);
router.delete('/email-blast/clear', clearEmailQueue);

// Message Templates (variasi gacha)
router.get('/templates', getTemplates);
router.post('/templates', addTemplates);
router.patch('/templates/:id', editTemplate);
router.delete('/templates/:id', removeTemplate);

// Project Management — Client Leads
router.get('/leads', getLeads);
router.post('/leads', createLead);
router.patch('/leads/:id/status', updateLeadStatus);
router.delete('/leads/:id', deleteLead);

// Project Management — Projects
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;
