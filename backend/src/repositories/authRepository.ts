import { AuthenticationCreds, SignalDataTypeMap, initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import prisma from '../utils/prisma';

export const getAllSessionIds = async (): Promise<string[]> => {
    const sessions = await prisma.whatsAppAuth.findMany({
        select: { sessionId: true },
        distinct: ['sessionId']
    });
    return sessions.map((s: { sessionId: string }) => s.sessionId);
};

export const deleteSessionData = async (sessionId: string): Promise<void> => {
    try {
        await prisma.whatsAppAuth.deleteMany({
            where: { sessionId }
        });
        console.log(`Successfully deleted auth data for session: ${sessionId}`);
    } catch (error) {
        console.error(`Error deleting auth data for session ${sessionId}:`, error);
    }
};

export const usePrismaAuthState = async (sessionId: string) => {
    const readData = async (key: string) => {
        try {
            const data = await prisma.whatsAppAuth.findUnique({
                where: {
                    sessionId_key: {
                        sessionId,
                        key,
                    },
                },
            });
            if (!data) return null;
            return JSON.parse(data.value, BufferJSON.reviver);
        } catch (error) {
            console.error(`Error reading auth data for ${sessionId} key ${key}:`, error);
            return null;
        }
    };

    const writeData = async (data: any, key: string) => {
        try {
            const value = JSON.stringify(data, BufferJSON.replacer);
            await prisma.whatsAppAuth.upsert({
                where: {
                    sessionId_key: {
                        sessionId,
                        key,
                    },
                },
                update: {
                    value,
                },
                create: {
                    sessionId,
                    key,
                    value,
                },
            });
        } catch (error) {
            console.error(`Error writing auth data for ${sessionId} key ${key}:`, error);
        }
    };

    const removeData = async (key: string) => {
        try {
            await prisma.whatsAppAuth.delete({
                where: {
                    sessionId_key: {
                        sessionId,
                        key,
                    },
                },
            });
        } catch (error) {
            console.error(`Error removing auth data for ${sessionId} key ${key}:`, error);
        }
    };

    let creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
                    const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
    };
};
