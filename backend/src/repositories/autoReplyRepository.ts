import prisma from '../utils/prisma';

export const findMatchedReply = async (sessionId: string, message: string) => {
    // We fetch all replies for the session to match in memory,
    // or we can try to query directly using Prisma.
    // Given the `isExact` and `contains` logic, fetching all might be inefficient for large datasets,
    // but Prisma doesn't have a direct "contains" query where the DB column is the substring of the input.
    // Usually it's the other way around. 
    // We will fetch all keywords for the session and check in memory.
    
    const rules = await prisma.autoReply.findMany({
        where: { sessionId }
    });

    const lowerMessage = message.toLowerCase();

    for (const rule of rules) {
        const lowerKeyword = rule.keyword.toLowerCase();
        if (rule.isExact) {
            if (lowerMessage === lowerKeyword) {
                return rule.replyText;
            }
        } else {
            if (lowerMessage.includes(lowerKeyword)) {
                return rule.replyText;
            }
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
