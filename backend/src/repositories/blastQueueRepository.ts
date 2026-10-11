import prisma from '../utils/prisma';
type BlastStatusType = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export const addBlastJobs = async (sessionId: string, jobs: { targetJid: string, messageText: string, messageVariants?: string[], mediaUrl?: string, mediaType?: string, contactId?: string }[]) => {
    const data = jobs.map(job => ({
        sessionId,
        targetJid: job.targetJid,
        messageText: job.messageText,
        messageVariants: job.messageVariants && job.messageVariants.length ? JSON.stringify(job.messageVariants) : null,
        mediaUrl: job.mediaUrl,
        mediaType: job.mediaType,
        contactId: job.contactId,
        status: 'PENDING' as const
    }));

    return prisma.blastQueue.createMany({
        data
    });
};

export const getNextPendingJobBySession = async (sessionId: string) => {
    // Find the oldest pending job for a specific session
    return prisma.blastQueue.findFirst({
        where: { status: 'PENDING', sessionId },
        orderBy: { createdAt: 'asc' }
    });
};

export const getNextPendingJob = async () => {
    // Find the oldest pending job (across all sessions)
    return prisma.blastQueue.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
    });
};

export const updateJobStatus = async (id: string, status: BlastStatusType, error?: string) => {
    return prisma.blastQueue.update({
        where: { id },
        data: { 
            status,
            ...(error ? { error } : {})
        }
    });
};

export const getQueueStats = async (sessionId: string) => {
    const stats = await prisma.blastQueue.groupBy({
        by: ['status'],
        where: { sessionId },
        _count: {
            id: true
        }
    });

    const result: Record<BlastStatusType | 'total', number> = {
        'PENDING': 0,
        'PROCESSING': 0,
        'SENT': 0,
        'FAILED': 0,
        total: 0
    };

    stats.forEach((stat: any) => {
        result[stat.status as BlastStatusType] = stat._count.id;
        result.total += stat._count.id;
    });

    return result;
};

export const getQueueJobs = async (sessionId: string) => {
    return prisma.blastQueue.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 100 // limit to last 100 to prevent huge payloads
    });
};
