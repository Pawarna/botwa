import prisma from '../utils/prisma';

export const findMatchedReply = async (sessionId: string, message: string) => {
    // Prisma tidak punya query "contains" di mana kolom DB adalah substring dari input,
    // jadi semua rule session di-fetch lalu dicocokkan di memory.
    const rules = await prisma.autoReply.findMany({
        where: { sessionId }
    });

    // Normalisasi: lowercase + trim + rapatkan spasi, supaya "Halo " tetap cocok dengan "halo"
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const msgNorm = norm(message);

    // Prioritas 1: exact match
    for (const rule of rules) {
        if (rule.isExact && msgNorm === norm(rule.keyword)) {
            return rule.replyText;
        }
    }

    // Prioritas 2: contains
    for (const rule of rules) {
        if (!rule.isExact && msgNorm.includes(norm(rule.keyword))) {
            return rule.replyText;
        }
    }

    return null;
};

export const createReplyRule = async (data: { sessionId: string, keyword: string, replyText: string, isExact: boolean }) => {
    return prisma.autoReply.create({
        data
    });
};

export const getReplyRules = async (sessionId: string) => {
    return prisma.autoReply.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
    });
};

export const deleteReplyRule = async (id: string, sessionId: string) => {
    return prisma.autoReply.delete({
        where: { id, sessionId } // Ensure session matches
    });
};
