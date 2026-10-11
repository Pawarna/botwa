import prisma from '../utils/prisma';

// Template dikunci ke akun (sessionId = user id dari auth middleware).
export const listTemplates = async (sessionId: string, channel: string) => {
    return prisma.messageTemplate.findMany({
        where: { sessionId, channel },
        orderBy: { createdAt: 'asc' },
    });
};

export const createManyTemplates = async (
    sessionId: string,
    channel: string,
    templates: { body: string; subject?: string | null }[]
) => {
    return prisma.messageTemplate.createMany({
        data: templates.map((t) => ({
            sessionId,
            channel,
            body: t.body,
            subject: t.subject ?? null,
            isActive: true,
        })),
    });
};

export const updateTemplate = async (
    id: string,
    sessionId: string,
    data: { body?: string; subject?: string | null; isActive?: boolean }
) => {
    return prisma.messageTemplate.updateMany({
        where: { id, sessionId },
        data,
    });
};

export const deleteTemplate = async (id: string, sessionId: string) => {
    return prisma.messageTemplate.deleteMany({ where: { id, sessionId } });
};
