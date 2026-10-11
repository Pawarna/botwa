import makeWASocket, { DisconnectReason, WASocket, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { usePrismaAuthState, deleteSessionData } from '../repositories/authRepository';
import { findMatchedReply } from '../repositories/autoReplyRepository';
import { triggerWorker } from './broadcastWorker';

export type SessionStatusType = 'connecting' | 'qr' | 'connected' | 'error' | 'offline';

// In-memory stores for active WhatsApp sessions
export const sessions = new Map<string, WASocket>();
export const qrCodes = new Map<string, string>(); // Store base64 QR codes
export const sessionStatuses = new Map<string, SessionStatusType>(); // Explicit status tracking
export const sessionErrors = new Map<string, string>(); // Store connection error messages

// Cooldown auto-reply per chat: mencegah spam balasan beruntun
const autoReplyCooldowns = new Map<string, number>();
const AUTO_REPLY_COOLDOWN_MS = 10_000;

export const createSession = async (sessionId: string) => {
    if (sessions.has(sessionId)) {
        console.log(`Session ${sessionId} already exists.`);
        return sessions.get(sessionId);
    }

    sessionStatuses.set(sessionId, 'connecting');
    sessionErrors.delete(sessionId);
    qrCodes.delete(sessionId);

    const { state, saveCreds } = await usePrismaAuthState(sessionId);
    
    let version: any = [2, 3000, 1017578297]; // Stable fallback version
    try {
        const fetchPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Version fetch timeout')), 3000)
        );
        const latest = await Promise.race([fetchPromise, timeoutPromise]);
        version = latest.version;
        console.log(`Successfully fetched latest Baileys version: ${version}`);
    } catch (err: any) {
        console.warn(`Failed to fetch latest Baileys version (${err.message}). Using fallback version.`);
    }

    const sock = makeWASocket({
        version,
        auth: state as any,
        printQRInTerminal: false,
        syncFullHistory: false,
        // Mimic official WhatsApp Web to reduce ban risk
        browser: ['Ubuntu', 'Chrome', '22.14.5'],
        // Prevent sending too much traffic at once
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined,
    });

    sessions.set(sessionId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodes.set(sessionId, qr);
            sessionStatuses.set(sessionId, 'qr');
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            const errorMessage = lastDisconnect?.error?.message || 'Connection Failure';

            console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);
            
            sessions.delete(sessionId);
            qrCodes.delete(sessionId);
            sessionErrors.set(sessionId, errorMessage);
            sessionStatuses.set(sessionId, 'error');
            
            if (shouldReconnect) {
                // Reconnect after a short random backoff (3-7s) to avoid hammering WA servers
                const backoff = Math.floor(Math.random() * 4000 + 3000);
                console.log(`Reconnecting session ${sessionId} in ${backoff}ms...`);
                setTimeout(() => createSession(sessionId), backoff);
            } else {
                sessionStatuses.set(sessionId, 'offline');
                if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
                    console.log(`Clearing bad database session credentials for ${sessionId}`);
                    await deleteSessionData(sessionId);
                }
            }
        } else if (connection === 'open') {
            console.log(`Session ${sessionId} connected!`);
            qrCodes.delete(sessionId);
            sessionErrors.delete(sessionId);
            sessionStatuses.set(sessionId, 'connected');
            // Trigger broadcast worker untuk proses job PENDING yang tertunda
            triggerWorker(sessionId);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const jid = msg.key.remoteJid!;
            // Auto-reply hanya untuk chat personal — skip status, channel, dan grup
            if (jid === 'status@broadcast' || jid.endsWith('@newsletter') || jid.endsWith('@g.us')) continue;

            // Unwrap tipe pesan bersarang (ephemeral / viewOnce / documentWithCaption)
            let inner: any = msg.message;
            if (inner.ephemeralMessage) inner = inner.ephemeralMessage.message;
            if (inner.viewOnceMessage) inner = inner.viewOnceMessage.message;
            if (inner.viewOnceMessageV2) inner = inner.viewOnceMessageV2.message;
            if (inner.documentWithCaptionMessage) inner = inner.documentWithCaptionMessage.message;

            const text: string | undefined =
                inner.conversation ||
                inner.extendedTextMessage?.text ||
                inner.imageMessage?.caption ||
                inner.videoMessage?.caption;
            if (!text) continue;

            // Cooldown per chat — tidak membalas lebih dari sekali per 10 detik
            const cooldownKey = `${sessionId}:${jid}`;
            const lastReplyAt = autoReplyCooldowns.get(cooldownKey) || 0;
            if (Date.now() - lastReplyAt < AUTO_REPLY_COOLDOWN_MS) continue;

            const replyText = await findMatchedReply(sessionId, text);
            if (replyText) {
                try {
                    autoReplyCooldowns.set(cooldownKey, Date.now());
                    await sock.sendMessage(jid, { text: replyText });
                    console.log(`Auto-reply sent to ${jid} (matched incoming: "${text.slice(0, 40)}")`);
                } catch (error) {
                    autoReplyCooldowns.delete(cooldownKey);
                    console.error('Failed to send auto-reply:', error);
                }
            }
        }
    });

    return sock;
};

export const getSession = (sessionId: string) => {
    return sessions.get(sessionId);
};

export const deleteSession = async (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (session) {
        try {
            session.logout();
        } catch {}
        sessions.delete(sessionId);
        qrCodes.delete(sessionId);
    }
    sessionErrors.delete(sessionId);
    sessionStatuses.set(sessionId, 'offline');
    await deleteSessionData(sessionId);
};

export const getQrCode = (sessionId: string) => {
    return qrCodes.get(sessionId);
};

export const getSessionStatus = (sessionId: string): SessionStatusType => {
    return sessionStatuses.get(sessionId) || 'offline';
};

export const getSessionError = (sessionId: string) => {
    return sessionErrors.get(sessionId);
};
